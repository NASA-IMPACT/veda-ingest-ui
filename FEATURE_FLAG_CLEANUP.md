# Edit Existing Collection Feature Flag Cleanup Guide

This document describes the current behavior of Edit Existing Collection and the remaining cleanup work.

## Current Rollout Behavior

- Direct page navigation to `/edit-existing-collection` is allowed only when `NEXT_PUBLIC_APP_ENV=veda` or `local`. Other environments redirect to `/unauthorized`.
- Server/API access to `/api/existing-collection/*` is allowed only when `NEXT_PUBLIC_APP_ENV=veda` or `local`.
- UI visibility (menu/card) is controlled by `NEXT_PUBLIC_ENABLE_EXISTING_COLLECTION_EDIT`.
- Result: Page and API are AppEnv-gated, while menu/page visibility remains behind the UI feature flag.

UI visibility for Edit Existing Collection remains feature-flag controlled in:

- `components/layout/MenuBar.tsx`
- `app/(pages)/collections/_components/CollectionsClient.tsx`

Page and API access gating is implemented in:

- `proxy.ts` (middleware-level route protection for `/edit-existing-collection`)
- `app/api/existing-collection/route.ts`
- `app/api/existing-collection/[collectionId]/route.ts` (both `GET` and `PUT`)

## Environment Variables

### Keep

- `NEXT_PUBLIC_APP_ENV` (must be `veda` or `local` for direct page navigation and API access)
- `NEXT_PUBLIC_ENABLE_EXISTING_COLLECTION_EDIT` (controls menu/card visibility)

### Removed

- `ENABLE_EXISTING_COLLECTION_EDIT` - has been fully removed from test configs and env files

## Verification Checklist

- [ ] With `NEXT_PUBLIC_APP_ENV=veda` or `local`, direct navigation to `/edit-existing-collection` works
- [ ] With `NEXT_PUBLIC_APP_ENV=veda` or `local`, `/api/existing-collection/*` routes are accessible (subject to auth/tenant checks)
- [ ] With `NEXT_PUBLIC_APP_ENV` set to `disasters` or `eic`, `/edit-existing-collection` redirects to `/unauthorized` and `/api/existing-collection/*` returns `403`
- [ ] Menu item and Collections page card remain hidden unless `NEXT_PUBLIC_ENABLE_EXISTING_COLLECTION_EDIT=true`
- [ ] Existing auth and tenant checks still behave as expected for allowed environments

## Future Cleanup (Phase 2)

When ready to fully launch in UI:

1. Remove `NEXT_PUBLIC_ENABLE_EXISTING_COLLECTION_EDIT` checks from `MenuBar` and `CollectionsClient`.
2. Remove related test env wiring that only exists to force UI visibility.
3. Update README and environment examples to remove UI flag references.
4. Remove documentation references to temporary UI flag gating.
