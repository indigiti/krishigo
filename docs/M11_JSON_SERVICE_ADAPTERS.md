# M11 — JSON-backed module service adapters

**Status:** Code-level staging pilot. Database installation deferred. No change to Cloudways
DigiOps runtime or the previously accepted static release.

## Layered boundaries

```text
React public demo -> local mocked workspace (unchanged)
Opt-in PHP staging route -> Authentication/CSRF -> Domain schema + feature flag
                         -> Bounded JSON Store -> private atomic JSON files
```

The six adapters cover produce listings, buyer requirements, community discussions,
private Plant Care observations, agricultural service requests, and editorial drafts.
All writes are fictional, stage-admin/test credentials only. A reviewed entry remains
explicitly marked `reviewed-demo`, never a real verified trade or published news item.

## Administration & fault recovery

Feature flags from M10 gate each adapter. Private JSON files use static allowlisted
names, file locks and temporary-file atomic replacement. A damaged state can be
recovered from a validated last-known-good snapshot. If no valid snapshot remains,
the affected domain returns 503 without recreating data or replaying actions.
`Idempotency-Key` prevents accidental duplicate draft creation with the same request
and owner. Simulated review status has a single pending-to-final transition.

The admin-only workflow-health endpoint reports per-domain record counts, pending
counts and whether a snapshot was recovered. It does not expose private draft fields.

## Safety & activation

Set `KRISHIGO_API_MODE=staging`, `KRISHIGO_JSON_WORKFLOWS=enabled`,
`KRISHIGO_STAGE_AUTH=enabled`, and configure a protected staging account and a private,
writable `KRISHIGO_JSON_STORE_DIR`. The PHP service must run on an isolated,
HTTPS-only deployment with its document root at `apps/api-php/public/`. Do not
expose source, fixtures or runtime JSON files under `public_html`.

The static `digiops-release` continues to contain only React assets. Enabling
JSON workflows on the PHP service does not automatically connect existing React
demo screens; a future adapter UI and staging proxy are required.

## Validation

The GitHub PHP CI job performs:
- PHP lint on the new JSON store, service and route classes.
- End-to-end HTTP creation across all six domains.
- Anonymous/CSRF/field checks and idempotency replay/conflict.
- Private Plant Care restrictions and role-protected review queues.
- Module deactivation/re-activation enforcement.
- Single-copy corruption recovery and dual-copy fail-closed behaviour.

## Production gaps

JSON is an intermediate test transport, not a safe permanent replacement for
transactional multi-user persistence. Verified account ownership, production roles,
audit/retention and deletion, user-media isolation, background queue durability,
origin configuration under Cloudways, real sources, trade delivery, and validated
Plant Doctor inference remain unfinished.
