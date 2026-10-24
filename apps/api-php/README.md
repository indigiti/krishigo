# KrishiGo Custom PHP API — M2 staging foundation

Custom PHP 8.3+ with no Laravel, no Composer dependencies and **no database**. This is a safe test harness, **not a production authentication or trading system**.

## Public read-only endpoints

- `GET /healthz` — minimal service health.
- `GET /api/v1/status` (also `capabilities`) — staging capabilities (always labels fictional data).
- `GET /api/v1/marketplace/listings`, `/community/posts`, `/buyers/requirements`, `/services`, `/content`, `/modules` — JSON fixtures from `fixtures/catalog.json` (fictional and non-actionable).

## Optional staging session

By default **authentication is disabled**. For controlled HTTPS staging tests, configure server environment variables described in `.env.example`: `KRISHIGO_STAGE_AUTH=enabled`, `KRISHIGO_STAGE_USERNAME`, `KRISHIGO_STAGE_PASSWORD_HASH` (generated using PHP `password_hash`), `KRISHIGO_STAGE_ROLE` (farmer, buyer, fpo, editor, admin). Never commit passwords or hashes. The `.env.example` is explanatory and **is not automatically loaded**.

Routes:

- `GET /api/v1/auth/csrf` — creates a session and returns a CSRF token.
- `POST /api/v1/auth/login` — HTTPS, JSON, `X-CSRF-Token`, configured staging account only.
- `GET /api/v1/auth/me` — public anonymous or current demo session metadata.
- `POST /api/v1/auth/logout` — JSON and current CSRF token.
- `GET /api/v1/admin/moderation` — protected by editor/admin role, returns only fictional cases.

The server enforces HTTPS except on loopback with the opt-in `KRISHIGO_ALLOW_HTTP_LOCAL=1`. Behind a reverse proxy, `KRISHIGO_TRUSTED_PROXY_IPS` must contain verified proxy IPs before forwarding `X-Forwarded-Proto` is trusted. Cloudways process/session sharing, TLS termination, cache bypass and session cookie attributes must be validated before public exposure.

Sessions use PHP's file-based session handler, not MySQL. Failed login limits are per session only and **do not replace** edge IP throttling, bot controls or production abuse prevention. A single environment-based staging account cannot support production account management, password recovery, MFA, revocation across deployments, or organization-level permission assignment.

All public business writes (listings, buyer enquiries, community posts, plant cases, moderation) return HTTP 501. No uploads, AI inference, payments, real identity verification or private user data are supported. Public read routes are sample-only. Turn staging auth **off** on any public preview where it is unnecessary.

## Test locally

```sh
php -l src/Core.php && php -l public/index.php
python3 tests/integration.py -v
```

## Production gap

A separate milestone must add database-backed identity, granular authorization, password-reset design, request rate limiting, encrypted storage, protected media uploads, auditing and moderation persistence, queue processing, and production acceptance testing. Do not reuse this staging account mechanism as the production login system.
