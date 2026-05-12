# Tenant System

## What Is a Tenant?

A **tenant** in this application is a named scope used by the STAC API to partition data access. When a dataset or collection is tagged with a tenant, only users who have write access to that tenant can create or modify it.

There is always one special tenant: **`Public`**. Public data has no tenant restriction — any authenticated user with the appropriate scope can create or edit it.

---

## Where the Tenant List Comes From

On login, the app fetches the list of tenants the authenticated user is allowed to write to from:

```
GET {VEDA_BACKEND_URL}/ingest/auth/tenants/writable
Authorization: Bearer <keycloak-access-token>
```

This endpoint is called once during JWT initialization (`auth.ts`, `fetchWritableTenants`) and again on every access token refresh.

**Normalization** is applied to the raw list before it is stored:

- Whitespace is trimmed from each value.
- Duplicate entries are removed (case-insensitive).
- Any `public` variant (any case) supplied by the API is stripped.
- `"Public"` (title case) is always appended as the last entry.

So a user who has no tenant assignments in Keycloak still ends up with `["Public"]` in their session.

---

## What Happens With No Tenant Assignments

If a user has no tenant assignments (or the `/ingest/auth/tenants/writable` call fails), their tenant list is `["Public"]`.

**Form behavior:** `useTenants` (`hooks/useTenants.ts`) injects the tenant list into the JSON schema and UI schema at render time. When the list contains **only** `"Public"` — which is the default "no assignment" state — the tenant field is **hidden from the form** entirely. The tenant field only appears in the form when the user has access to one or more non-Public tenants.

**API behavior:** If a submitted payload contains no tenant field (or `"Public"`), the create-ingest and existing-collection API routes skip tenant validation entirely and proceed normally.

---

## How Tenants Flow Through the App

```
Keycloak login
    │
    ▼
auth.ts JWT callback
    ├── parseScopesFromAccessToken (from JWT payload)
    └── fetchWritableTenants → VEDA_BACKEND_URL/ingest/auth/tenants/writable
            │
            ▼
        normalizeTenants → stored in JWT as `token.tenants`
            │
            ▼
        session callback → stored in session as `session.tenants`
            │
            ▼
        TenantContext (app/contexts/TenantContext.tsx)
            │   reads session via useSession()
            │   exposes { tenants, isLoading } to all client components
            │
            ▼
        useTenants hook (hooks/useTenants.ts)
            │   injects tenant enum into RJSF JSON schema
            │   hides the field when tenants === []  or  ["Public"]
            ▼
        Form renders tenant dropdown (or hides it)
```

On the server side, `lib/serverTenantValidation.ts` provides `validateTenantAccess(tenantId, session)`, which checks whether the given tenant ID is in `session.tenants`.

---

## Tenant Field Key (`VEDA_TENANT_FILTER_FIELD`)

The JSON key used to store the tenant value in the ingested payload differs per environment. It is configured in `config/env.ts` via `VEDA_TENANT_FILTER_FIELD`:

| Environment | Key                             |
| ----------- | ------------------------------- |
| `local`     | `local:tenant`                  |
| `eic`       | `eic:tenant`                    |
| `veda`      | _(unset — tenant field hidden)_ |
| `disasters` | _(unset — tenant field hidden)_ |

When `VEDA_TENANT_FILTER_FIELD` is unset for a profile, the utility in `utils/tenantField.ts` falls back to `eic:tenant`.

This key is used in three places:

1. **`useTenants`** — to inject and position the field in the RJSF schema.
2. **`/api/create-ingest`** — to read the tenant value from the submitted payload before calling `validateTenantAccess`.
3. **`utils/githubUtils/ListPRs.ts`** — to filter open PRs by tenant when listing editable ingests.

---

## Server-Side Enforcement

Tenant access is enforced in two API routes:

### `POST /api/create-ingest` and `PUT /api/create-ingest`

Reads the tenant value from `data[tenantFieldKey]`. If the value is non-empty and not `"Public"`, calls `validateTenantAccess(tenant, session)`. Returns `403` if the user's session does not include that tenant.

### `GET /api/existing-collection/[collectionId]` and `PUT /api/existing-collection/[collectionId]`

Reads the `eic:tenant` (or configured key) from the fetched STAC collection. If the collection is tenant-scoped, validates the user has access before returning or updating it.

---

## Local Development

To simulate tenant access without a real Keycloak server:

```bash
NEXT_PUBLIC_DISABLE_AUTH=true
NEXT_PUBLIC_MOCK_TENANTS=tenant1,tenant2
```

`NEXT_PUBLIC_MOCK_TENANTS` is a comma-separated list. The same `normalizeTenants` logic applies, so `"Public"` is always appended. Leave `NEXT_PUBLIC_MOCK_TENANTS` unset (or empty) to simulate a user with no tenant assignments (only `"Public"` — tenant field hidden).
