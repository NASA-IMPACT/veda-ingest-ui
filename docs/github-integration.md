# GitHub Integration

This document explains how the app authenticates with GitHub and performs create, edit, list, and retrieve ingest operations against the configured destination repository.

## Purpose

The UI does not write files directly to a local checkout. Instead, server API routes use GitHub App credentials to:

- create branches and pull requests for new ingests,
- update JSON in existing ingest pull requests,
- list open ingest pull requests,
- retrieve the current JSON payload for edit forms.

## Required Configuration

The GitHub integration relies on these values:

- `OWNER`
- `REPO`
- `TARGET_BRANCH`
- `APP_ID`
- `INSTALLATION_ID`
- `GITHUB_PRIVATE_KEY`

`OWNER`, `REPO`, and `TARGET_BRANCH` are selected from `config/env.ts` by `NEXT_PUBLIC_APP_ENV`.

`APP_ID` and `INSTALLATION_ID` are regular environment variables.

`GITHUB_PRIVATE_KEY` is loaded from runtime secrets first, with environment-variable fallback (`lib/runtimeSecrets.ts`).

## Authentication Flow

GitHub calls are authenticated as a GitHub App installation, not as an end-user token.

1. `GetGithubToken.ts` reads `APP_ID`, `INSTALLATION_ID`, and `GITHUB_PRIVATE_KEY`.
2. It creates an Octokit client with `@octokit/auth-app`.
3. It requests an installation access token.
4. Utility functions create an authenticated Octokit client with that token.

## Endpoints and Utility Mapping

### Create ingest PR

- Route: `POST /api/create-ingest`
- Utility: `utils/githubUtils/CreatePR.ts`

Behavior:

1. Validate request body and ingestion type (`dataset` or `collection`).
2. Resolve target filepath:
   - dataset: `ingestion-data/staging/dataset-config`
   - collection: `ingestion-data/staging/collections`
3. Build filename with `formatFilename` from:
   - dataset: `data.collection`
   - collection: `data.id`
4. Build branch name: `feat/<filename>`.
5. Create blob, tree, commit, and branch off `TARGET_BRANCH`.
6. Open PR with title: `<ingestionType> Ingest Request for <sourceName>`.

### Update existing ingest PR file

- Route: `PUT /api/create-ingest`
- Utility: `utils/githubUtils/UpdatePR.ts`

Behavior:

1. Validate required fields (`gitRef`, `fileSha`, `filePath`, `formData`).
2. Serialize JSON via `CleanAndPrettifyJSON`.
3. Base64-encode content with UTF-8 safe `Buffer.from(...).toString('base64')`.
4. Call `repos.createOrUpdateFileContents` on the target branch.

### List editable ingests

- Route: `GET /api/list-ingests?ingestionType=dataset|collection`
- Utility: `utils/githubUtils/ListPRs.ts`

Behavior:

1. List open PRs targeting `TARGET_BRANCH`.
2. For each PR, find changed JSON under the expected ingest folder.
3. Read JSON content from the PR head commit.
4. Extract tenant value from configured tenant key.
5. Return only ingests the current user can access (tenant-filtered in route).

### Retrieve ingest JSON for edit form

- Route: `GET /api/retrieve-ingest?ref=<branch>&ingestionType=dataset|collection`
- Utility: `utils/githubUtils/RetrieveJSON.ts`

Behavior:

1. Derive filename from branch by removing `feat/`.
2. Compute full path under dataset or collection ingest folder.
3. Read file content from GitHub at `ref`.
4. Decode base64 and parse JSON.
5. Return `{ fileSha, filePath, content }` for edit submission.

## Ingest File Conventions

- Dataset files: `ingestion-data/staging/dataset-config/<filename>.json`
- Collection files: `ingestion-data/staging/collections/<filename>.json`
- Branch convention for ingest edits: `feat/<filename>`

The retrieve flow depends on the branch naming convention to reconstruct the file path.

## Data Formatting

All create and update operations pass through `CleanAndPrettifyJSON` before writing to GitHub. This keeps JSON output consistently formatted and reduces noisy diffs in pull requests.

## Authorization Boundary

The app enforces user auth and capability checks before GitHub operations using `withPermission` in API routes. GitHub itself is called with app-level credentials, so route-level authorization is the critical guardrail.

For tenant-specific behavior, see `docs/tenants.md`.

## Troubleshooting

- `Missing required environment variables: OWNER or REPO`
  - Check selected app profile in `NEXT_PUBLIC_APP_ENV` and `config/env.ts`.
- `Missing or invalid environment variables for GitHub authentication`
  - Verify `APP_ID`, `INSTALLATION_ID`, and `GITHUB_PRIVATE_KEY`.
- `Failed to fetch GitHub token`
  - Confirm app installation and private key validity.
- 422 errors during PR creation
  - Common causes: branch already exists, invalid path/name, or duplicate PR constraints.

## Related Docs

- `docs/deployment/github-app-setup.md`
- `docs/tenants.md`
