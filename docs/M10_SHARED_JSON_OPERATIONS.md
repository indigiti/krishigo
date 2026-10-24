# M10 — JSON-first shared module operations (staging-only)

## Purpose

The existing `Admin` module switchboard defaults to browser-only settings. M10 adds an **optional** protected, shared control plane so a staging administrator can switch modules for the PHP fixture API. No database is provisioned. The existing DigiOps static release remains unchanged until a new deployment is specifically approved.

## Architecture

```
React Admin (VITE_MODULE_CONTROL_MODE=api)
     -> same-origin, HTTPS fetch with cookie and X-CSRF-Token
     -> Custom PHP staging session + admin RBAC
     -> Modules Registry domain (25 descriptors, dependencies, revision checks)
     -> private JSON snapshots (atomic write, file lock, last good and previous)
```

## Enable only for an isolated protected environment

- Deploy `apps/api-php/` separately, with its web root at `apps/api-php/public/`. Keep fixtures, source and JSON storage *outside* the public web root.
- Explicitly configure `KRISHIGO_API_MODE=staging`, `KRISHIGO_JSON_STORE_DIR` to an existing writable private directory, `KRISHIGO_STAGE_AUTH=enabled`, and the staging admin username/password hash and role `admin`. Use HTTPS and disable any caching of authenticated responses.
- Expose the PHP API under a **same-origin** reverse-proxy path such as `/krishigo/api/v1` before compiling the frontend with `VITE_MODULE_CONTROL_MODE=api` and `VITE_MODULE_API_BASE_URL=/krishigo/api/v1`. A static artifact alone does not create this route.
- The default `VITE_MODULE_CONTROL_MODE` is unset; it continues to display local demo switches without any network calls.
- Production mode requires separate identity, permission, consent, privacy, audit, backup and recovery milestones. Do not use a single staging account as production authentication.

## API

- `GET /api/v1/modules/registry`: read the current descriptor/flag snapshot, revision and health summaries. Works without authentication; returns demo-safe metadata.
- `GET /api/v1/modules/health`: catalog count, enabled/disabled counts, revision, store and recovery status.
- `GET /api/v1/admin/module-controls`: administrator-only current revision and module flags.
- `POST /api/v1/admin/module-controls/{id}`: administrator and CSRF protected; body `{"enabled":false,"expected_revision":"64-hex-revision"}`. Legacy callers can omit the revision, but the new console always provides it.
- `POST /api/v1/admin/module-controls/reset`: optional expected revision, restores defaults.
- `POST /api/v1/admin/module-controls/rollback`: optional expected revision, swaps the last saved configuration with the previous validated snapshot.
- Stale revision: 409 `module_state_conflict`; dependency violation: 409 `module_dependency_required`; unrecoverable data: 503.

## Safe recovery and performance

Configuration mutations use a file lock and atomic file replacement, with bounded JSON, fixed module identifiers and immutable application descriptors. A damaged state can be replaced from a validated last-known-good copy. If both are damaged the API fails closed. Rollback is one-step and scoped to module flags; it does not re-run notifications, trading activity or other side effects. Browser API calls are on-demand rather than polling, and the shared console is code-split. Existing bundle budget and Chromium gates remain in CI.

## Remaining

JSON controls are not a replacement for all 25 real integrations or complete module business workflows. Real multi-user records and agricultural feeds are still pending. Database installation remains deferred until explicitly authorized.
