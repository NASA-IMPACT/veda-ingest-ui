# Edit Existing Collection Cleanup Status

This cleanup is complete.

## Current Behavior

- Edit Existing Collection is available in all environments.
- Menu and Collections page visibility is no longer controlled by a feature flag.
- Access is controlled by existing authentication and Keycloak scopes.
- Existing tenant validation for collection reads/updates remains in place.

## Access Control

- UI access: users need `stac:collection:update` (and must not be `dataset:limited-access`) to interact with Edit Existing Collection links/actions.
- Route/API authorization: enforced by existing middleware permission handling and API auth checks.
- Tenant access: enforced by `getUserTenants` and `validateTenantAccess` logic in API routes.

## Removed Gating

- Removed `NEXT_PUBLIC_ENABLE_EXISTING_COLLECTION_EDIT` checks from:
	- `components/layout/MenuBar.tsx`
	- `app/(pages)/collections/_components/CollectionsClient.tsx`
- Removed app-environment gating for Edit Existing Collection from:
	- `proxy.ts`
	- `app/api/existing-collection/route.ts`
	- `app/api/existing-collection/[collectionId]/route.ts`

## Config and Docs Cleanup

- Removed `NEXT_PUBLIC_ENABLE_EXISTING_COLLECTION_EDIT` from `vitest.config.mts`.
- Removed stale flag examples from `.env` and `README.md`.
