# KrishiGo Custom PHP API — isolated modes, no Laravel

Two deliberately separate HTTP execution paths are supported:

- **Staging default** (`KRISHIGO_API_MODE=staging`, or unset): fictional read-only fixture endpoints; optional single-account session tests; all business writes blocked with HTTP 501. Runs without any database. The DigiOps web artifact never includes PHP API files.
- **Production candidate** (`KRISHIGO_API_MODE=production`): real MySQL 8.0+/MariaDB 10.6+ tables, separate database-backed user identities and server-side authorization. Mode requires a configured MySQL DSN, database username and high-entropy rate-limit salt. An incomplete configuration fails closed (HTTP 503).

## Layering

- `public/index.php`: security headers, transport and route dispatch.
- `src/Core.php`: CSRF/session helpers, JSON transport and sandbox fixtures.
- `src/Production/Validation.php`: normalized domain field constraints.
- `src/Production/Api.php`: workflows, roles, ownership and request dispatch.
- `src/Production/Repository.php`: prepared SQL access and transactions.
- `src/Production/Connection.php`: MySQL/PDO configuration gate.
- `database/migrations/001_core.sql`: explicit MySQL schema, not used for staging.

## Production JSON API v1

- `GET /api/v1/auth/csrf`, `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`
- `GET/POST /api/v1/marketplace/listings`, `GET /api/v1/marketplace/listings/{id}`, `GET /api/v1/marketplace/listings/mine`
- `GET/POST /api/v1/buyers/requirements`, `GET /api/v1/buyers/requirements/mine`
- `GET/POST /api/v1/community/posts`, `GET /api/v1/community/posts/mine`
- `GET/POST /api/v1/plant-cases/mine` (GET), `POST /api/v1/plant-cases` (private notes only, no diagnosis)
- `POST /api/v1/enquiries`, `GET /api/v1/enquiries/mine` (stored enquiries; no messaging or outbound notifications)
- `GET /api/v1/admin/review-cases`; `POST /api/v1/admin/review-cases/{listing|requirement|post}/{id}/decision`
- `POST /api/v1/admin/users/{id}/verify` — admin attests externally checked evidence, logged in audit events.

All business objects begin pending moderation, plant cases are private, published results are read-only, and review operations require server-side editor/admin roles. Listing approval additionally requires a verified seller. FPO and other roles must be authorized per endpoint, not by a browser selection. Listings and buyer requirements paginate with `before` numeric ID cursors (max 30 records). Auth failure limits are enforced in a MySQL table keyed by salted HMAC of IP/email. The production service requires same-origin frontend API access; cross-origin CORS is not enabled.

## Setup — not an automatic staging migration

1. Provision separate **production-candidate** Cloudways Custom PHP application and MySQL database, never reuse the DigiOps staging root.
2. Create DB user with least privileges; configure PHP 8.3+, `pdo_mysql`, TLS, server-side protected environment variables. See `.env.example` (no credentials committed).
3. Review schema, back up database, apply `database/migrations/001_core.sql` via your approved deployment/migration mechanism.
4. Set a high-entropy `KRISHIGO_RATE_SALT` (min. 32 characters). All PHP processes must share its value. Set `KRISHIGO_API_MODE=production` only on the isolated backend.
5. Create initial admin once through `bin/bootstrap_admin.php` with one-time environment values. Then remove those values from the host.
6. Run functional/database/ownership/CSRF tests with an isolated `_test` MySQL database before accepting the candidate. Deploy backend code outside a public source directory; make `public/` the web document root.

## Launch blockers / known limitations

**Do not activate this PHP API for public users yet.** Pending: real email/phone ownership verification, password reset and recovery, MFA for moderators, independent security review, migration rollback strategy, security and abuse monitoring, media virus scanning, user consent and deletion workflows, origin/proxy validation on actual Cloudways, role review, notifications, and integrated frontend browser acceptance. Manual administrator verification does not itself prove an account's identity. Plant Doctor is a private observation log only and provides no AI diagnosis, pest-treatment prescription, or photo upload.

### Test commands

```sh
php -l src/Production/Api.php
python3 tests/integration.py -v                           # no-database staging tests
# In isolated _test MySQL configuration only:
python3 tests/production_integration.py -v
```


M9: Optional JSON-backed module control. See docs/M9_JSON_MODULE_CONTROL.md. Requires private configured storage and authenticated stage administrator. No database.

## M11: Private JSON workflow adapters (opt-in, staging ONLY)

The optional `KRISHIGO_JSON_WORKFLOWS=enabled` staging service uses a preexisting private
`KRISHIGO_JSON_STORE_DIR`, the existing staging session, and module registry. It is NOT
included in static DigiOps artifacts. No MySQL or database installation is required.

Six fictional domains: `marketplace`, `buyers`, `community`, `plant`,
`services`, `editorial`. Each has a domain-specific allowlisted field schema.
No contact with sellers, buyers or experts; no real publication, moderation, AI
diagnosis, payment or notification. The single configured staging login is not
real multi-user identity.

- `GET /api/v1/staging/records/{domain}` — reviewed demo records only; `?mine=1`
  requires a session and returns only that stage login's drafts.
- `POST /api/v1/staging/records/{domain}` — allowed stage roles, CSRF and a
  16–64-character `Idempotency-Key` header. Creates a pending-demo draft.
- `GET /api/v1/staging/admin/records/{domain}` — editor/admin pending review
  queue, excluding private Plant Care notes.
- `POST /api/v1/staging/admin/records/{domain}/{id}/review` — editor/admin
  approve/reject simulation; never publishes to external systems.
- `GET /api/v1/staging/workflows/health` — editor/admin read-only domain counts
  and recovery flags; no personal record contents.

The `plant` collection is private and cannot be publicly listed or moderated
through the sample publishing workflow. All routes enforce module activation.
Bounded JSON documents (500 entries/domain, <=900 KiB), locked writes,
atomic state replacement, validated last-good recovery, and request-idempotency
protect staging correctness. If primary and backup fail validation, the affected
domain fails closed with HTTP 503 rather than resetting. The session-level write
cap is 60 changes per 15 minutes and is **not** production abuse protection.

## M14 — Protected JSON runtime review artifact
The dedicated **`krishigo-protected-php-pilot-review`** GitHub Actions artifact packages
a guarded public entrypoint and the required private PHP code, separately from
the static `digiops-release`. The API returns 503 until explicitly configured.
It does not include the dormant production/MySQL implementation.
See `docs/M14_PROTECTED_JSON_RUNTIME.md` before any manual host activation.
