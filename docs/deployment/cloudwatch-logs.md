# CloudWatch Log Guide

This guide explains how to find and interpret application logs emitted by the structured logger and shipped to CloudWatch from the Amplify SSR runtime.

## Logger Output Format

Logs are emitted as one-line JSON records by the logger in [lib/structuredLogger.ts](../../lib/structuredLogger.ts).

Each record includes an event name and flattened properties. Common fields:

- `event`
- `requestId`
- `route`
- `method`
- `path`
- `status` (for request-end logs)
- `durationMs`
- `reason` (when supplied by route code)
- `error.name`, `error.message`, `error.stack` (for error logs)

## Important Events

Core request lifecycle events:

- `api.request.start`
- `api.request.end`
- `api.request.error`

Common auth/proxy events you may also see:

- `auth.initialize.start`
- `auth.initialize.success`
- `auth.initialize.failure`
- `auth.token.refresh_attempt`
- `auth.token.refresh_succeeded`
- `auth.token.refresh_failed`
- `auth.tenants.fetch_failed`

Frontend structured error events are also emitted with the same logger helpers, prefixed as `frontend.*` (for example `frontend.error_boundary.api.caught` and `frontend.thumbnail.upload.request_failed`).

Global browser listeners in [components/error-boundaries/FrontendErrorListeners.tsx](../../components/error-boundaries/FrontendErrorListeners.tsx) also capture:

- `frontend.window.error`
- `frontend.window.unhandled_rejection`

When frontend forwarding is enabled, browser logs are posted to [app/api/frontend-logs/route.ts](../../app/api/frontend-logs/route.ts), then written by the server logger so they are included in CloudWatch streams with the same JSON format.

- These frontend events appear in browser devtools logs.
- They are shipped to CloudWatch through the server-side ingest route.
- In production, the ingest route enforces an origin guard by comparing `origin` against `x-forwarded-host`/`host` (Amplify-safe), and rejects cross-site submissions.

## Log-Level Behavior (Very Important)

The logger is intentionally quieter in non-debug mode.

- Default production behavior:
  - Lowest level is `warn`.
  - `api.request.start` is suppressed.
  - Successful `api.request.end` (2xx/3xx) is suppressed.
  - `api.request.end` with 4xx/5xx is emitted.
  - `api.request.error` is emitted.

- Debug behavior (`ENABLE_DEBUG_LOGGING=true`):
  - `api.request.start` is emitted.
  - Successful request-end logs are emitted.
  - Default lowest level becomes `debug` unless overridden with `LOG_LEVEL`.
  - Frontend logger debug verbosity is also enabled via the public mapping `NEXT_PUBLIC_ENABLE_DEBUG_LOGGING`.

Environment variables:

- `ENABLE_DEBUG_LOGGING=true|false`
- `NEXT_PUBLIC_ENABLE_DEBUG_LOGGING=true|false` (browser-facing flag; auto-populated from `ENABLE_DEBUG_LOGGING` in `next.config.ts` unless explicitly set)
- `LOG_LEVEL=debug|info|warn|warning|error` (used only when debug logging is enabled)

## Finding Logs From Amplify

The easiest path is to start in the Amplify app and jump to the server log stream from there.

In AWS Console:

1. Open Amplify.
2. Open the target ingest-ui app.
3. Click on _Monitoring_.
4. Click on _Hosting Compute Logs_.
5. Click the link to view the server log stream in CloudWatch.

## Quick Search Patterns (Log events view)

Use the search bar in the selected log group/stream with terms like:

- `"event":"api.request.error"`
- `"event":"api.request.end" "status":403`
- `"event":"api.request.end" "route":"/api/create-ingest"`
- `"requestId":"<id>"`

## CloudWatch Logs Insights Queries

Select the target log group, then click on _View in Logs Insights_ to run queries like these.

### 1) Recent errors and warnings

```sql
fields @timestamp, event, status, route, path, reason, requestId, error.message
| filter event in ["api.request.error", "api.request.end"]
| filter ispresent(error.message) or status >= 400
| sort @timestamp desc
| limit 100
```

### 2) 4xx/5xx by route

```sql
fields @timestamp, event, status, route
| filter event = "api.request.end" and status >= 400
| stats count(*) as failures by route, status
| sort failures desc
```

If this returns no rows but `filter status = 400` returns rows, those `400` logs are likely from non-route events (for example `auth.token.refresh_failed`) that include `status` but do not include `route`.

Use this to see which events are producing `400`:

```sql
fields @timestamp, event, status, route
| filter status = 400
| stats count(*) as count by event, route
| sort count desc
```

For route-level failures only, you must require route presence:

```sql
fields @timestamp, event, status, route
| filter event = "api.request.end" and status >= 400 and ispresent(route)
| stats count(*) as failures by route, status
| sort failures desc
```

### 3) Latency p95 by route

```sql
fields @timestamp, event, route, durationMs
| filter event = "api.request.end" and ispresent(durationMs)
| stats avg(durationMs) as avgMs, pct(durationMs, 95) as p95Ms, max(durationMs) as maxMs by route
| sort p95Ms desc
```

If this query returns no rows, it usually means there were no `api.request.end` events in the selected time window.

Common causes:

- You are looking at non-request log lines (Lambda `START`/`REPORT`) plus auth-only warnings.
- The window has no route executions that reached `logRequestEnd`.
- Successful request-end logs are suppressed when debug logging is off.
- You are scoped to a stream that only captured platform/runtime lines for that period.

Quick verification query:

```sql
fields @timestamp, event, route, status, durationMs, @message
| filter ispresent(event)
| sort @timestamp desc
| limit 50
```

### 4) Trace a single request

```sql
fields @timestamp, event, route, method, path, status, durationMs, reason, error.message, requestId
| filter requestId = "REPLACE_WITH_REQUEST_ID"
| sort @timestamp asc
```
