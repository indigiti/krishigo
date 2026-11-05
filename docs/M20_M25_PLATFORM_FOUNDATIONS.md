# KrishiGo M20–M25 — Integrated Platform Foundations

**Status: implemented as an isolated PHP/MySQL production-candidate feature branch, NOT a deployed or authorized live service.** This branch is based on M19, which depends on unmerged M18.

## Delivery matrix

| Milestone | Source-code implementation | External work not completed |
|---|---|---|
| M20 knowledge and CMS | Versioned UUIDv7 source registry, independent source/article review, approve/reject audit events, revision/supersession, language tags, citation-based article retrieval | Rights/official source agreements, agronomist review, complete human Marathi/Hindi content, content operations |
| M21 persistent accounts | Reuse M8 MySQL multiuser authentication, CSRF, session, roles and staff verification; owner-scoped farm profile and supplier review | Verified email/phone possession, MFA, recovery, consent/legal privacy requirements and real tenant acceptance |
| M22 data services | Editor-submitted source-linked snapshots for mandi, weather, government schemes, inputs and logistics; independently approved, date-expiring public data retrieval | Official APMC/IMD/scheme connectors, actual ingestion jobs, data licences and verified updates |
| M23 commerce | Seller quotation to existing enquiry on published owned lot; checked quantity, duplicate prevention, buyer accept/reject, locked stock reservation, internal order and seller confirmation | Payments, payment settlement, legally validated licences, fulfilment, disputes, shipping |
| M24 AI/OCR/notifications | Private manual crop/label intake; deterministic search of approved references; explicit topic-wise in-app consent and notification event inbox | Binary/image OCR, actual source-grounded AI, agronomist communications, WhatsApp, SMS, email and push delivery |
| M25 readiness | Offline fail-closed capability inventory, MySQL end-to-end CI, mobile/desktop UI tests, secure mode separation | External security review, production backup/rollback, Cloudways hosted acceptance, Web Vitals and monitoring sign-off |

**A reviewed record is not a verified government registration, crop-use approval, business licence or expert diagnosis.**

## Versioned data

The optional migration 002_platform_foundations.sql extends the M8 base schema. New records use UUIDv7 text IDs; existing numeric user, listing and enquiry references are preserved. Key tables:

- knowledge_sources, knowledge_articles, source_data_snapshots
- farmer_profiles, supplier_profiles
- trade_quotes, trade_orders
- agronomy_intakes, notification_preferences, notification_events
- operations_audit

Migration 002 is never applied automatically to a public site. The isolated test initializer refuses databases without a _test suffix. Never run the destructive test initializer against production.

## PHP route inventory (production-candidate mode only)

Knowledge: GET /api/v1/knowledge/sources, GET /api/v1/knowledge/articles, GET /api/v1/knowledge/articles/{uuid}; staff POST /api/v1/editor/knowledge/sources and /articles and /{uuid}/review. Review requires a different submitter and reviewer. Publishing a replacement revision retires its predecessor atomically.

Data: GET /api/v1/data/snapshots?domain=mandi; staff GET/POST /api/v1/editor/data/snapshots and POST /api/v1/editor/data/snapshots/{uuid}/review. No automated network ingestion; invalid or expired records never appear in reviewed snapshots.

Profiles: GET/PUT /api/v1/me/farm-profile; GET/POST /api/v1/suppliers/profile; admin review /api/v1/admin/suppliers/{uuid}/review. Supplier review is not statutory licensing confirmation.

Trade: GET/POST /api/v1/trade/quotes and GET /api/v1/trade/quotes/mine; POST /api/v1/trade/quotes/{uuid}/decision; GET /api/v1/trade/orders/mine; POST /api/v1/trade/orders/{uuid}/confirm. The trade records are provisional. No actual payment, dispatch or legal contract completion is represented.

Agronomy: POST /api/v1/agronomy/intake and GET /api/v1/agronomy/mine; no real upload/AI/OCR.

Intelligence: GET /api/v1/assistant/search?q= returns human-reviewed, source-linked results without generating agricultural treatments.

Notifications: GET/PUT /api/v1/me/notification-preferences, GET /api/v1/me/notification-events. Only in-app delivery; no external messaging.

Capability status: GET /api/v1/platform/capabilities. All real provider, OCR, AI, WhatsApp and payment flags remain false.

## Security and performance

- Existing secure transport, same-origin cookies, CSRF, login throttling, prepared SQL and role guard reused.
- New verified-at checks for restricted operational mutations; staff/editor decisions require independent reviewer identity.
- New public IDs are random UUIDv7; query returns are bounded (12–50), source URLs are stored but not fetched, user input lengths are bounded.
- Quote acceptance serializes reservations by locking the associated listing. Database foreign keys and unique constraints prevent many duplicate and dangling records.
- Never put real passwords, bank/identity data, lab PII or live crop chemical instructions into test fixtures.

## CI and launch gates

The CI production-mysql job creates a disposable MySQL 8 service and runs both the existing M8 multiuser HTTP suite and the new platform integration suite. The CI web job builds the default database-free mock and the explicit production-candidate frontend; Playwright exercises connected screens with mocked PHP responses. None of these tests indicate Cloudways deployment.

To generate the fail-closed offline inventory:

    python3 tools/check_platform_readiness.py

The report is written to reports/m25-platform-readiness.json and always declares production_launch_authorized=false. Do not change that value from a code-only test.

If an authorized deployment is eventually planned: separately review migration 001 and 002, provision real MySQL and backups, secure PHP sessions/TLS, configure valid credentials and tenant boundaries, rehearse rollback, perform licensed source verification and threat-model testing, and only then consider real users.

## Development ownership

KNOWLEDGE.md is the single canonical project tracker. Update milestone status and CI evidence there. The future work above remains blocked on providers, legal review, credentials, secure identity and real-host verification.
