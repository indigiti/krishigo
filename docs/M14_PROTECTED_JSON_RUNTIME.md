# M14 — Protected JSON Staging Runtime & Operations Doctor

## What is complete in GitHub
- A standalone **protected PHP pilot review artifact**, generated separately from the existing `digiops-release`. It retains the full current React static files, and adds a guarded PHP entrypoint under `/krishigo/api/v1/` with PHP code and fictional fixtures under `private/api-service/`.
- The entrypoint **fails closed with HTTP 503** unless a server operator explicitly supplies staging-only settings. No API is enabled automatically by downloading or deploying the default static artifact.
- A protected runtime doctor at `GET /api/v1/staging/operations/doctor`, restricted to staging editors and admins, summarizes private JSON domain availability, snapshot restoration, queue failures, free private storage, and staging authentication. No private record bodies, filesystem paths or secrets are exposed.
- The opt-in React JSON Operations dashboard displays the doctor’s checks, safe queues and manual recovery options.
- Browser regression and real packaged PHP-router HTTP acceptance (including login, CSRF and anonymous denial) run in GitHub CI.
- Database installation is excluded. Production mode is not packaged in the protected pilot.

## Two independent release artifacts
| Artifact | Intended use | Backend included | Auto activation |
|---|---|---|---|
| `digiops-release` | Existing static staging UI | No | No |
| `krishigo-protected-php-pilot-review` | Separate acceptance candidate for private runtime | Yes: private PHP sources + guarded public entry | No — 503 until explicitly configured |

**Never point the existing DigiOps KrishiGo project at the pilot review artifact without first verifying** its configured public/private target roots, overlay/rollback strategy, Cloudways PHP execution, and host-specific environment. This artifact is not a confirmed deployment.

## Required Cloudways setup (web-managed approval gates)
1. Back up/retain the last healthy staging release (reported DigiOps #98), and inspect DigiOps’s configured public and private target paths.
2. Confirm Apache PHP requests under `/krishigo/api/v1/` reach the guarded front controller, not the React SPA fallback.
3. Confirm `KRISHIGO_PRIVATE_APP_ROOT` points to the private KrishiGo folder containing `api-service/`, and `KRISHIGO_JSON_STORE_DIR` points to a **separate persistent, writable private directory**, not under `public_html` or a code-overlaid release folder.
4. Configure `KRISHIGO_API_MODE=staging`, `KRISHIGO_JSON_WORKFLOWS=enabled`, `KRISHIGO_STAGE_AUTH=enabled`, and the staging username, password hash and role via the hosting provider's private settings. Never commit or put a password in a URL.
5. Verify HTTPS, `Secure` + `HttpOnly` session cookies, origin/CSRF checks and staff-only controls. Do not expose a test admin account to the public internet.
6. Run the manual M13 Cloudways external probe and *separate* authenticated module/browser acceptance; verify the host returns 401/403 for anonymous private endpoints. The public fixture shell is not proof the API is active.
7. Measure actual Cloudways latency and real mobile experience, including p95, LCP, INP and CLS under representative demand. Exercise backup/restore and a safe rollback before accepting the runtime.

## Operational safeguards and limitations
- Self-recovery is intentionally constrained to validating JSON snapshots and manual diagnostic-job recovery; no forced restarts, automatic refunds, trading replays, shell execution or uncontrolled provider retries.
- File-backed staging records and a single configured staging identity are not production-grade multi-user identity or transactions.
- If private storage, PHP routing or credentials are missing, do **not** lower security to make the UI look healthy. Keep the API offline.
- Actual Cloudways acceptance, real provider data, all 25 module-specific business operations and performance guarantees remain outside this code milestone.

## What follows
M15: finish full workflows for Marketplace/Buyers/Community/Plant Care/Services/Editorial.
M16–M18: complete remaining 19 module-specific contracts and verified integrations.
M19: production-level diagnostics, safe retries, security, privacy and hosted load/performance.
M20: accessibility, localization, mobile, all-module acceptance and launch checks.

No database provisioning is part of these milestones.
