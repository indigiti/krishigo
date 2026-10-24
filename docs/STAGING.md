# KrishiGo staging and production boundary

## Current GitHub delivery

- `preview/index.html`: standalone interactive mock-data demonstration. Open in a browser; no build, API or database needed.
- `docs/KRISHIGO_MASTER_PLAN.md`: authoritative scope and phasing.
- `README.md`: repository entry point.

**This is not the full React/Vite source upload.** The full React source archive was produced as a separate conversation artifact and has not been committed here. The standalone preview should not be confused with it.

## Safe staging rules

1. No MySQL/MariaDB, no permanent accounts, no credentials and no payment integration.
2. Display visible DEMO labels for prices, weather, community content, forecasts, and all health guidance.
3. Uploaded plant photos are previewed locally only; the demonstration does not classify images, call an AI service, or provide a diagnosis.
4. Any user input stored in local component memory is disposable and may reset on reload.
5. Publish to a staging URL only; do not use as a real trading or agriculture advice system.

## Planned production implementation

- React/TypeScript frontend, Vite build, theme-ready component library.
- Cloudways Custom PHP API; no Laravel.
- MySQL/MariaDB data persistence and Redis caches/queues.
- Auth, verification, audit logs, role permissions, and moderation.
- Independent authenticated Python diagnostic workers after field testing.
- SSR/prerendering for public content and indexable listing pages.
- Explicit consent, retention limits, and image handling for plant cases.
- CI tests and rollback before promotion.

## Development sequence

1. Commit full React source under `apps/web/` and make `npm run build` pass.
2. Add screens for buyer requirements, services, crop diary and farmer profiles.
3. Expand the typed data adapter and mock fixtures without depending on MySQL.
4. Build the standalone custom PHP API as a separate production milestone.
5. Add real-source integrations and disease-model validation.
6. Deploy to Cloudways staging only after build and smoke checks.
