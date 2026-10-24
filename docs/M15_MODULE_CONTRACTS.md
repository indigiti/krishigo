# M15 — 25 Module-specific JSON Staging Contracts

All 25 module studio draft tabs can now use dedicated *server-described*, role-filtered form schemas in the opt-in JSON staging pilot.

- Contract data: `apps/api-php/fixtures/module-workflow-contracts.json`.
- Contract validator: `apps/api-php/src/Json/Contracts.php`; each module defines required domain fields, types, limits, examples, and allowed staging roles.
- `GET /api/v1/staging/module-drafts/{id}/schema` returns the declared staging form schema (authenticated and module-enabled only).
- `POST /api/v1/staging/module-drafts/{id}` validates `{"title":"…","note":"…","details":{"…":…}}`, flattens validated scalar domain fields into the private JSON document, and enforces stage roles. Unexpected or missing fields return 422; disabled modules return 404.
- The React `ModuleStudio` uses a lazy-loaded `ConnectedModuleDrafts` form built from the schema, supporting searchable local UX and private JSON draft history. The original static demo behavior remains the default.
- HTTP tests exercise schema + valid/invalid private records across all 25 modules. No external delivery or data provider connection is implied.

This does **not** complete the real 19 integrations: weather and commodity feeds, identity verification, real bookings, financial referrals, AI inference, provider records, source-backed news, upload security, actual public publishing, and notification delivery are still pending.

Never activate the optional backend on a public Cloudways host without the secure M14 pilot acceptance. No database integration or MySQL installation.
