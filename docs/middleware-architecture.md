# Middleware Architecture

This document explains how request gating is implemented in middleware (`proxy.ts`) and how it works with API-level permission checks.

## Why Middleware Exists

The middleware provides a single route-level authorization gate for both page routes and selected API routes. It ensures users are redirected or rejected early, before page rendering or handler execution.

API handlers still enforce permissions independently as a second layer.

## Entry Point

Implementation: [proxy.ts](proxy.ts)

## Route Categories

`routeConfig` groups paths into capability buckets:

- `authenticated`
  - Requires login and at least one app capability state.
- `createAccess`
  - Requires create capability.
- `editAccess`
  - Requires ingest edit capability.
- `editStacCollectionAccess`
  - Requires existing collection edit capability.

## Capability Derivation

Capabilities are derived in [lib/authorization/policy.ts](lib/authorization/policy.ts).

Inputs:

- session presence
- `session.scopes`

Output flags used by middleware:

- `isAuthenticated`
- `isLimited`
- `canCreateIngest`
- `canEditIngest`
- `canEditExistingCollection`

`dataset:limited-access` overrides and disables all create/edit capability flags.

## Decision Flow

1. If auth is disabled in production: throw error (hard fail).
2. If auth is disabled in non-production: allow request.
3. Resolve session and capabilities.
4. Check route category against capability flags.
5. If not allowed:
   - API route: return `401` or `403` response.
   - UI route: redirect to `/login` or `/unauthorized`.
6. If allowed: continue with `NextResponse.next()`.

## Route Matcher Coverage

The middleware `config.matcher` in [proxy.ts](proxy.ts) explicitly opts routes into middleware enforcement.

Current protected route groups include:

- landing and ingestion pages
- create/edit list/retrieve endpoints
- upload-related endpoints
- existing collection API namespace

If you add a sensitive route and forget to include it in matcher, middleware will not run for it.

## Relationship to withPermission

Middleware and `withPermission` address different layers:

- Middleware: path-level gate and user-experience routing behavior.
- `withPermission`: handler-level guarantee on API endpoints.

## Operational Logging

Middleware emits structured logs for:

- request start/end
- allow/deny reasons
- redirect target when applicable
- summarized session/capability context

This improves auditability and debugging of permission issues.

## Extending Middleware Safely

When adding new routes:

1. Add route prefix to the correct `routeConfig` category.
2. Add path to `config.matcher`.
3. If API route, also wrap handler with `withPermission`.
