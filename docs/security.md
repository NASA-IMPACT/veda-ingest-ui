# Security Architecture

This document summarizes the app's security controls across authentication, authorization, tenant isolation, secret handling, and request-path enforcement.

## Security Model Overview

The app uses layered controls:

1. Authentication with Keycloak (via NextAuth JWT sessions).
2. Capability-based authorization derived from token scopes.
3. Route-level enforcement in middleware (`proxy.ts`).
4. API handler enforcement using `withPermission`.
5. Tenant-level data isolation checks in server routes.
6. Runtime secret retrieval with environment fallback.

## Authentication

Implemented in [auth.ts](auth.ts):

- Provider: Keycloak via NextAuth.
- Session strategy: JWT.
- Access token scopes parsed from token payload.
- Tenant access list fetched from backend endpoint:
  - `GET {VEDA_BACKEND_URL}/ingest/auth/tenants/writable`
- Refresh tokens are used to renew access tokens

Mock mode (`NEXT_PUBLIC_DISABLE_AUTH=true`) is available for local/testing and is explicitly blocked in production by middleware.

## Authorization (Scope to Capability)

Scope mapping is defined in [lib/authorization/policy.ts](lib/authorization/policy.ts).

Application scopes:

- `dataset:limited-access`
- `dataset:create`
- `dataset:update`
- `stac:collection:update`

Derived capabilities:

- `canCreateIngest`
- `canEditIngest`
- `canEditExistingCollection`

Important rule: `dataset:limited-access` takes precedence and disables create/edit capabilities even if other scopes are present.

## Route-Level Enforcement (Middleware)

[proxy.ts](proxy.ts) acts as a centralized authorization gate for selected UI and API paths.

- Unauthenticated requests:
  - API routes return `401`.
  - UI routes redirect to `/login`.
- Authenticated but unauthorized requests:
  - API routes return `403`.
  - UI routes redirect to `/unauthorized`.

The matcher list in middleware defines exactly which routes are protected there.

## API-Level Enforcement

`withPermission` in [lib/authorization/withPermission.ts](lib/authorization/withPermission.ts) wraps route handlers and enforces:

1. Session exists (`401` otherwise).
2. Capability is permitted (`403` otherwise).

This protects routes even if middleware config is changed or a path is accessed in unexpected ways.

## Tenant Isolation

Tenant checks are server-side and do not rely only on UI filtering. Validation helpers are in [lib/serverTenantValidation.ts](lib/serverTenantValidation.ts)

If payload data targets a non-public tenant, the route validates the tenant is in `session.tenants` before proceeding.

## Secret Management

Runtime secrets are handled in [lib/runtimeSecrets.ts](lib/runtimeSecrets.ts):

- Primary source: AWS Secrets Manager (`APP_RUNTIME_SECRET_ID` JSON payload).
- Fallback: process environment variables used for local testing.
- In-memory cache with TTL to reduce repeated secret fetches.

Security-relevant keys include:

- `GITHUB_PRIVATE_KEY`
- `KEYCLOAK_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `INGEST_UI_EXTERNAL_ID`

## GitHub Access Boundary

GitHub operations use GitHub App installation credentials server-side (never from browser clients).

## Local Development Security Notes

- `NEXT_PUBLIC_DISABLE_AUTH=true` should only be used in testing contexts.
- Middleware throws an error if auth is disabled while `NODE_ENV=production`.
