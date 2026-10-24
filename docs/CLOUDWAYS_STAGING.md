# M4 — Cloudways staging acceptance and deployment runbook

**Status:** Staging build integration and tests implemented; **no live Cloudways deployment**. The repository cannot authenticate to your Cloudways console, and no host is assumed.

## Scope and safety

- No Laravel; React/Vite frontend and optional custom PHP API are **separate deployment surfaces**.
- The default frontend is `VITE_DATA_MODE=mock`. Never set `VITE_DATA_MODE=api` for the no-database staging artifact.
- The sample marketplace, mandi data, weather, business listings, user profiles, community and Plant Doctor are **fictional demonstrations**. No real trading, medical diagnosis, or uploads to server.
- Protect staging with Cloudways platform HTTP Basic Auth (or another verified edge access control). `noindex` and `robots.txt` are **not access controls**.
- Configure HTTPS and confirm valid TLS on the actual staging hostname before accepting staging sign-in.
- Do not configure real MySQL credentials, customer records or AI keys on staging.

## GitHub Actions output

The `web` job builds a React static bundle, runs tests and packages a staging-only ZIP with an Apache `.htaccess` file and robots exclusions. The `browser` job then tests Chromium at **1440×900** and **390×844** using Playwright, retaining failure screenshots/trace artifacts. CI never attempts to SSH/deploy to Cloudways.

## Controlled staging rollout (not yet performed)

1. Select a **non-production Cloudways Custom PHP staging application** and create a verified HTTPS hostname. Do not reuse the public production site's document root.
2. Enable access protection at the Cloudways console or at the edge, then verify unauthenticated access is rejected. Test backup / restore independently.
3. Download the approved `krishigo-staging-static-zip` artifact from the successful GitHub Actions run. Extract into the **staging web root only**; the ZIP must contain `index.html`, `assets/`, `.htaccess`, `robots.txt`.
4. Verify `index.html`, assets, and each UI route render; verify that page source contains `noindex` and response includes `X-Robots-Tag: noindex, nofollow, noarchive` when Apache headers are enabled.
5. If Apache ignores `.htaccess` because the site uses NGINX routing, replicate the rules in Cloudways' supported server configuration through its control panel/support; never assume PHP rewrite rules protect static assets.
6. When separately evaluating the PHP test API, set its document root to `apps/api-php/public/` **on another staging application/subdomain**, not alongside arbitrary repository files. Leave `KRISHIGO_STAGE_AUTH` disabled unless deliberately checking HTTPS session behavior. Configure the corresponding access protection, cache bypass, and CORS policy.
7. Run browser acceptance on the deployed URL: no horizontal overflow at 390px, search usable, Plant Doctor clearly demo, saved listings temporary, no network writes, and no PHP errors. Test Firefox and Safari separately before declaring cross-browser acceptance.
8. Do not point live DNS at the staging app, turn on commerce, persist private data, or configure webhooks for automatic production deployment.

## Rollback

Keep the previous **static staging** web root ZIP and the Cloudways application restore point. Revert only the affected staging site after validating that no production domain or user state is shared. No DB rollback is required for the mock bundle.

## Production readiness gaps

Actual PHP API integration and auth hardening, database migrations, verified mandi data, asynchronous Python model inference, privacy/consent, PWA offline policy, public SEO rendering, CSP, full accessibility audit and production load testing remain separate milestones. A green CI run is not production acceptance.


## M5 — DigiOps verified deployment at `/krishigo/`

DigiOps is configured for `indigiti/krishigo`, branch `main`, artifact name
`digiops-release`, browser route `/krishigo/`, public folder
`public_html/krishigo/` and private folder `private_html/krishigo/`.

The workflow now creates an additional **unnested** GitHub Actions artifact named
`digiops-release`, containing:

```text
RELEASE.json                 # not publicly served by DigiOps
public/index.html
public/assets/...
public/manifest.webmanifest
public/favicon.svg
public/.htaccess             # hidden files explicitly included
public/robots.txt
public/STAGING_ONLY.txt
```

DigiOps extracts `public/` into the **configured public folder**. The initial
release carries **no** `private/` payload, PHP backend or database; the configured
private folder remains untouched. Vite uses the prefix `/krishigo/` for its JS,
CSS and public asset URLs. The manifest scope/start URL are also prefixed.

### Operator release gate

1. Open KrishiGo in DigiOps > Deploy, and use **Check update**.
2. Confirm a **successful full CI workflow** on `main`, artifact name exactly
   `digiops-release`, artifact ID, unexpired status and latest expected 40-digit
   commit SHA. The artifact should be associated with the run checked in DigiOps.
3. Confirm this is your intended staging application, access is restricted and
   the public root maps to `public_html/krishigo/`. The application path
   `/krishigo/` is under the DigiOps host; the screenshot alone does not establish
   its external domain or confirm TLS/access restrictions.
4. Only then click **Deploy** in DigiOps. DigiOps performs an atomic public
   release switch and retains previous releases for rollback.
5. Visit the actual `https://<verified-host>/krishigo/`, check both loaded JS and
   CSS assets under `/krishigo/assets/`, mobile UI, noindex, all demo disclaimers,
   and absence of real network writes. Use Health and Releases views for
   post-deploy verification and rollback if necessary.

An Actions success means **release candidate ready**, not proof that it was
published or that the live host is healthy. Neither GitHub CI nor this code
initiates a Cloudways deployment. Do not choose the legacy
`krishigo-staging-static-zip` artifact inside DigiOps; it contains a nested ZIP
and is intended for a manual static deployment process.
