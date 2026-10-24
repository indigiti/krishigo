# M13 — Module-native JSON Pilot & Protected Hosting Acceptance

## Current delivery boundary

The accepted DigiOps deployment **#86** contains a static React demonstration. This milestone keeps the standard `digiops-release` mock-only; it does **not** bundle/deploy a PHP backend or turn on real accounts, live buyers, published content, uploads, invoices or AI.

Only a separately built, same-origin protected staging pilot with `VITE_JSON_WORKFLOWS_MODE=api` activates the module-native integrations described below.

## Native modules

| Frontend page | JSON domain | Dedicated workflow |
|---|---|---|
| Marketplace | marketplace | Owner's fictional harvest lots, quantity and price entry, moderation, approved sample feed |
| Buyers | buyers | Requirement draft and read-only matching with reviewed lots by exact crop, district and available kilograms |
| Community | community | Moderated sample discussions |
| Plant Doctor | plant | Private observation history and owner-verified, one-level case follow-ups; NO image diagnosis |
| Services | services | Service request drafts; no provider bookings |
| Review Desk | editorial | Draft articles and editor role review; no public publishing |

The original screens and default mock data remain unchanged in the standard DigiOps bundle. All connected pages use a shared, lazy-loaded `ConnectedDomainPanel`, typed `JsonStagingClient`, and server-side role validation. Login sessions are cookies, never stored credentials in localStorage.

## Backend requirements

- PHP 8.3+ `apps/api-php/public/` as the **only** web-accessible PHP document root.
- Private JSON records, module snapshots, PHP sessions and audit files outside `public_html`.
- Explicit `KRISHIGO_API_MODE=staging`, `KRISHIGO_STAGE_AUTH=enabled`, `KRISHIGO_JSON_WORKFLOWS=enabled`, `KRISHIGO_JSON_STORE_DIR` pointing to a writable protected directory.
- Trusted HTTPS forwarding from verified proxy peers only; no CORS and no public admin credentials.
- Same-origin forwarding for `/krishigo/api/v1/*` to the PHP router `/api/v1/*` with actual rewrite/proxy configuration validated before enabling frontend JSON mode.
- Browser build `VITE_JSON_WORKFLOWS_MODE=api`, `VITE_JSON_API_BASE_URL=/krishigo/api/v1`, `VITE_DATA_MODE=mock`. Compile this pilot separately, not as a replacement for #86.
- For the same pilot's Admin switches to follow **server-wide** configuration, also build with `VITE_MODULE_CONTROL_MODE=api` and `VITE_MODULE_API_BASE_URL=/krishigo/api/v1`. Without these additional flags the Admin module remains browser-local; PHP endpoints themselves still enforce server-side module activation.
- A **single staging role** remains the identity limitation. Real users and multi-role login cannot be accepted until separate production identity work.

## Safety and workflow behaviour

- Matches look only at already reviewed fictional lots, exact case-insensitive crop and district, and adequate kilograms; at most 10 results. No buyer enquiry is dispatched.
- Plant follow-ups must link to an original case owned by the staging identity. Links to other users' cases and chained follow-ups are rejected.
- Record moderation remains role-checked server-side; owner data are not taken from the client.
- Disabled modules return 404 from PHP and are not writable.
- The diagnostic queue remains read-only, manually processed, capped and non-transactional.

## Cloudways host acceptance gate — *not executed on protected PHP*

Once the separate PHP service is deployed safely, use GitHub Actions **M13 Cloudways staging probe** (manual workflow) to inspect the public shell and unauthenticated API boundary, plus its browser performance report. It cannot prove authenticated internal workflows and is intentionally non-destructive. The protected endpoint must **not** return 200 anonymously. Run a second authenticated browser acceptance in a controlled internal environment before publication. Missing PHP route (404), proxy misrouting and TLS errors block enabling JSON mode.

Live Cloudways API response time, Core Web Vitals, load/concurrency, failover, backup recovery and infrastructure monitoring are **unverified** until tested on actual hosting. CI synthetic metrics and mock browser tests are not substitutes.

## Remaining modules

The other 19 modules retain private generic JSON draft contracts; real domain workflows, source integrations, notifications, security verification and production deployment are not complete. Database installation remains deferred until explicit user approval.
