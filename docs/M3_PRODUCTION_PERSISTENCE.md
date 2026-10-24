# M3: DB-free staging now, production persistence later

## Current boundary

M3 preview stays browser-memory only. It does **not** submit personal identity documents, transmit enquiries, change seller verification, publish listings or act on real moderation cases. The custom PHP API exposes only fictional fixture detail and role-guarded sample review queues; all writes to planned trade/onboarding/review endpoints return `501 writes_disabled_in_staging`.

## Target data domains (not deployed)

| Domain | Prospective entities | Operational rules |
| --- | --- | --- |
| Identity | accounts, account_roles, consents, verification_requests, verification_evidence | secure password hashing or managed identity, OTP abuse controls, per-tenant role checks, encrypted PII, minimal retention |
| Marketplace | listings, listing_media, harvest_lots, listing_revisions, grades | verified provenance, time-stamped price/quantity/unit, no public verification flags without workflow decision |
| Trade | enquiries, enquiry_events, buyer_requirements, negotiation_offers | immutable audit history, idempotent creation, distinct draft/submitted states, anti-spam and throttling |
| Moderation | review_cases, report_reasons, review_decisions, audit_events | case assignment, conflict-of-interest rules, staff RBAC, append-only audits |
| Plant Doctor | crop_profiles, crop_cases, media_assets, recommendations, expert_reviews | consent, retention, signed uploads, source traceability, human review for risk-related guidance |

## Planned PHP modules (no Laravel)

- `Identity`: authoritative role and permission evaluator. Client role selection never grants permissions.
- `Marketplace`: validation of quantities, units, price and ownership; safe DTOs.
- `Enquiries`: draft creation and explicit buyer submission, deduplication and seller-notification queue.
- `Moderation`: role-protected decisions plus appeal/revision workflow.
- `Media`: MIME/content inspection, size limits, private object storage and malware screening.
- `Audit`: append-only event log with actor, target, action, timestamp and request ID.

Use parameterized PDO access within domain repositories and migrations versioned under `apps/api-php/database/migrations/`. Define constraints and indexes alongside API contracts, then require database-backed integration tests and migration/rollback checks before enabling `DATABASE_URL` in production. Do not enable database persistence simply by changing frontend `VITE_DATA_MODE`.

## Production launch gates

1. Verify Cloudways PHP runtime, DB version, Redis/session handler and secure reverse-proxy headers.
2. Move protected admin functions outside public UI; use backend sessions and per-action authorization.
3. Implement CSRF and rate limits for all writes, including enquiry delivery; keep same-site cookies appropriately scoped.
4. Separate private plant images from public marketplace media and require consent/retention settings.
5. Record actual verification decisions, never trust "verified flags from sample fixtures.
6. Confirm commercial rules for APMC, product-specific licences, privacy and consumer protections before handling transactions.
7. Add full browser accessibility/visual QA and Android/iOS packaging tests.
8. Validate disaster recovery, rollbacks, event logs and deletion paths.

## API response contracts introduced in M3

- `GET /api/v1/marketplace/listings/{id}` — fictional demo listing, object plus `demo:true`; invalid/not-found IDs return 404.
- `GET /api/v1/admin/review-cases` — editor/admin session required; fictional review cases, `writes_enabled:false`.
- `POST /api/v1/onboarding`, `POST /api/v1/enquiries`, mutations for review cases — explicitly blocked with 501.
