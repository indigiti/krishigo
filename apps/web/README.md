# KrishiGo — No-Database Staging Web App

Responsive agricultural platform prototype inspired by the supplied soft-glass plant-health and analytics dashboard references. Original UI composition (not a copy of the references).

## Technology

- React 19 + TypeScript + Vite
- Plain optimized CSS and Lucide icons (no UI framework, chart library, Tailwind runtime, or database)
- Three live themes: Forest, Sand, Night
- Modules: Overview, Plant Doctor, Marketplace, Farmer Community, Market Insights

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Open the local URL shown by Vite. To build: `npm run build`. Deploy `dist/` as static assets on any HTTPS host, including the public folder of a Cloudways Custom PHP application. Configure web-server SPA fallback for client-side routes if adding URL-based routing later.

## Demo behavior and data integrity

- `VITE_DATA_MODE=mock` (default) requires **no database, backend, or secret keys**.
- Mock listings, mandi prices, analytics, weather, community posts, users and numbers are **fictional and explicitly labelled**. They must not be interpreted as market prices or live weather.
- User-generated demo posts, likes, saved listings and theme choices live only in React memory and disappear on reload. No personal data is sent.
- Plant Doctor lets users upload a photograph locally and view its preview; **it does not inspect, transmit, classify, or diagnose the picture**. 'Guided screening' opens sample educational guidance irrespective of upload. Do not present this as AI disease detection.
- Marketplace enquiries and community replies are intentionally disabled pending backend authentication and moderation; interactive demo alerts explain this.
- No service-worker offline caching included yet, to avoid displaying stale prices as current.

## Production conversion (no Laravel)

1. PHP 8.x REST API on Cloudways with PHP session auth / short-lived native tokens, CSRF protection, validation, rate limiting and role-based access control.
2. MySQL persistence and migration scripts (not required in staging).
3. `VITE_DATA_MODE=api` and `VITE_API_BASE_URL=https://.../api/v1`; adapter is in `src/services/dataSource.ts`.
4. Redis for prices, feeds, rate limits and background jobs. Paginated public data and cache invalidation.
5. Python plant diagnostics as **private background service** with evaluated vision models, expert-reviewed knowledge and uncertainty handling; PHP remains the public API.
6. SEO-rendered public content / marketplace detail pages (separate SSR deployment or PHP prerendering) before go-live; this demo is an SPA and not a substitute for public SEO rendering.
7. Capacitor packages the same built React assets for mobile; optional Tauri for desktop.
8. Consent-controlled image storage and retention, moderated community, verified seller identity, trusted mandi data source and data freshness timestamps.

## Suggested production REST endpoints

See `docs/production-api.md`. The data adapter anticipates `/marketplace/listings` and `/community/posts`.

## Design approach

- **Forest**: signature editorial agriculture design (default).
- **Sand**: warm, premium, soft-surface direction.
- **Night**: high-contrast field operations theme.

All three preserve the same information architecture and component sizing, making selection easy without rebuilding the app.

## M4 staging build and browser acceptance

CI builds in `VITE_DATA_MODE=mock`, runs TypeScript / Vite, PHP contracts, packaging checks and Playwright Chromium tests at 1440px and 390px. The static ZIP intentionally excludes the PHP service, database, passwords and credentials. It is intended only for an access-protected Cloudways staging hostname. See `../../docs/CLOUDWAYS_STAGING.md`.

Local build after npm install:

```bash
VITE_DATA_MODE=mock npm run build
python3 ../../tools/package_staging.py --output ../../krishigo-staging-static.zip
npx playwright install chromium
npm run test:e2e
```

This does not deploy anything. Confirm Cloudways HTTPS, access protection and NGINX/Apache behavior before transferring the approved ZIP.

## Staging smoke checks

1. Switch themes and open all five modules.
2. Filter listings, save items, and view 'Saved'.
3. Create/like a community post and reload; it should reset.
4. Upload an image to Plant Doctor (<=10 MB) and confirm it only previews locally. Review sample report notice.
5. Resize to 390px mobile and verify menu navigation, charts and cards.
6. Confirm no real market feeds or AI inference are claimed.
