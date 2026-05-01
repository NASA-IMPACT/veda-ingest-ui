# GitHub App Setup for Destination Repos

This guide explains which GitHub App values to use for ingest-ui and how to choose between reusing an existing app or creating a new one.

## Required Values in ingest-ui

- `APP_ID`: GitHub App ID
- `INSTALLATION_ID`: GitHub App installation ID for the destination repository
- `GITHUB_PRIVATE_KEY`: Private key for the GitHub App

These values are consumed by the server API routes that create or update pull requests in the destination repo.

## Permissions Required

Set repository permissions to `Read and write` for:

- Contents
- Pull requests

Webhooks are not required for this app flow.

## If Destination Repo Is in NASA-IMPACT

You can reuse the existing GitHub App model by installing the app with equivalent permissions on the new destination repo, then providing:

- Existing app `APP_ID`
- Installation-specific `INSTALLATION_ID`
- Matching `GITHUB_PRIVATE_KEY`

## If Destination Repo Is in a Different Organization

Create a new GitHub App in that organization and:

1. Grant `Read and write` repository permissions for Contents and Pull requests.
2. Install the app on the destination repository.
3. Generate a private key.
4. Set ingest-ui values from that app installation:

- `APP_ID`
- `INSTALLATION_ID`
- `GITHUB_PRIVATE_KEY`

## Finding Installation ID

After installing the app, the installation ID is in the installation URL:

- `https://github.com/settings/installations/<installation_id>`
- `https://github.com/organizations/<org>/settings/installations/<installation_id>`
