# M29 — AGMARKNET daily mandi rates, staging-ready integration

Status: candidate implementation on `feature/live-agmarknet-mandi-staging`. This is **not a live Cloudways deployment** and no provider key has been configured by this PR.

## What is implemented

- Government-source AGMARKNET / data.gov.in resource `9ef84268-d588-465a-a308-a864a43d0070`, accessed by PHP only.
- Read-only `GET /api/v1/mandi/daily` in the explicitly enabled **database-free staging** API.
- Validation of named filters (state, district, market, commodity, variety, grade), date, page and limit.
- Server-side API key; HTTPS and a hardcoded allowlisted upstream URL. No client-supplied URLs.
- Private JSON cache: 30-minute revalidation; limited to 7-day stale fallback **with an explicit stale warning**.
- Normalized dated records with INR/quintal, data-quality flags, source metadata and no fictional fallback.
- Live React Insights explorer: filters, 50-row pagination, local page search, CSV export, reporting dates and clear disconnected states.
- PHP unit tests for input contracts, dates, prices and quality flags, wired into CI.

## Authorized configuration

Obtain an API key from data.gov.in with permission for the AGMARKNET dataset. On the **approved staging PHP host only**, configure:

```sh
KRISHIGO_API_MODE=staging
KRISHIGO_MANDI_ENABLED=enabled
KRISHIGO_OGD_API_KEY=<server-only-data-gov-in-api-key>
KRISHIGO_MANDI_CACHE_DIR=/private/path/outside/public_html/krishigo-mandi-cache
```

The cache directory must be writable by the PHP worker, outside public document roots and backed up only if needed. Never commit the key or place it in `VITE_*` variables. Point the static web app at the same-origin `/api/v1/mandi/daily`. The web client supports an optional `VITE_MANDI_API_BASE_URL` build-time override, but it **must** be an approved same-origin location for hosted use.

Check the host's PHP extension/runtime (cURL is preferred), outbound HTTPS to api.data.gov.in, file permissions, rate limits and the provider's terms of use.

When the feature is not enabled, the endpoint returns 503 `mandi_feed_disabled`; the UI displays **unavailable**, not demo rates. Production API routing remains unchanged.

## Go-live acceptance

1. Verify host provider authentication and a real non-empty government response (without disclosing credentials).
2. Compare at least three commodity/market/date observations against the originating resource; validate price units and no false freshness claims.
3. Test cache hit, forced refresh, timeout, exhausted provider quota, invalid JSON, corrupt cache, rejected records and stale fallback.
4. Test mobile 360px/390px/768px, keyboard table navigation, export, date filters and paging; confirm no console errors.
5. Verify source terms, attribution and responsible scraping/API usage. Add request throttling, monitoring and daily provider-health measurements as warranted.
6. Confirm live production authorization separately. The existing `KRISHIGO_API_MODE=production` database routes are not modified in this staging candidate.

## Next.js / Python migration direction

The current repo is React 19 + Vite. Keep this module compatible with the existing app while planning a **separate** migration to Next.js App Router with `output: 'export'`, Tailwind, shadcn/ui, TypeScript, and Lucide. Exported Next.js frontend can be hosted on Cloudways without a Node server; SSR, server actions and dynamic Next routes **cannot** run there as static output. All live API calls remain in PHP. Python/FastAPI is optional for scheduled historical imports, analytics and ML on a separately supported runtime; it is not on the critical request path. Production MySQL requires independent approval and migration.

Do not claim the Next.js/Tailwind/shadcn migration or FastAPI deployment is complete merely because this Mandi Rates API and React interface exist.
