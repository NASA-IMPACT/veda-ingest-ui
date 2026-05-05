# App Environment Profiles

This app supports multiple deployment profiles selected by `NEXT_PUBLIC_APP_ENV`.

Profiles centralize repo targets, API endpoints, branding, tenant-field behavior, and dataset schema profile so the same codebase can run in different environments without extensive environment vairable configurations.

Profiles are defined in [config/env.ts](config/env.ts).

`NEXT_PUBLIC_APP_ENV` is parsed case-insensitively. If the value is missing or invalid, the app defaults to `local`.

## What Profiles Affect

### 1. GitHub target repository

GitHub utilities and API routes write PRs to profile-selected `OWNER`, `REPO`, and `TARGET_BRANCH`.

Impacted paths include:

- [utils/githubUtils/CreatePR.ts](utils/githubUtils/CreatePR.ts)
- [utils/githubUtils/UpdatePR.ts](utils/githubUtils/UpdatePR.ts)
- [utils/githubUtils/ListPRs.ts](utils/githubUtils/ListPRs.ts)
- [utils/githubUtils/RetrieveJSON.ts](utils/githubUtils/RetrieveJSON.ts)

### 2. STAC/auth backend endpoints

Auth and collection-related requests use profile-selected backend URLs.

Examples:

- writable tenant fetch in [auth.ts](auth.ts)
- STAC/collection routes under [app/api](app/api)

### 3. Tenant field name in JSON payloads

Tenant key is dynamically resolved by [utils/tenantField.ts](utils/tenantField.ts), then used by:

- form schema injection in [hooks/useTenants.ts](hooks/useTenants.ts)
- tenant validation in [app/api/create-ingest/route.ts](app/api/create-ingest/route.ts)
- ingest filtering in [app/api/list-ingests/route.ts](app/api/list-ingests/route.ts)

### 4. Dataset schema profile

`DATASET_FORM_SCHEMA_PROFILE` controls which dataset form schema family is active (`default` or `disasters`).

### 5. Branding

`ADDITIONAL_LOGO` toggles profile-specific visual branding where supported by layout components.
