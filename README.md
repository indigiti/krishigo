# KrishiGo 🌱

**Status: database-free UI staging prototype (not a production application).**

KrishiGo is planned as an Indian agricultural platform combining:
- Produce marketplace and buyer requirements
- Farmer community
- Plant Doctor (future AI-assisted screening)
- Mandi rates and agricultural intelligence
- Machinery, rental, logistics, FPO, and agricultural services

## Try the staging preview

Open **[preview/index.html](preview/index.html)** locally in a browser, or deploy the `preview/` folder as static HTTPS content.

The standalone preview uses fictional sample data. No database, PHP runtime, API credentials, or AI inference is required.

## Documents

- [Final product and engineering master plan](docs/KRISHIGO_MASTER_PLAN.md)
- [Staging and production boundaries](docs/STAGING.md)

## Technology direction

- **No Laravel**
- React + TypeScript + Vite for the cross-platform application
- Custom PHP API on Cloudways in production
- Python workers for evaluated crop AI and specialist processing
- MySQL/Redis only when moving to production
- Capacitor for Android/iOS; PWA first for desktop

The current published staging preview is a *standalone HTML demonstration*. Do not mistake it for the React/Vite source tree or a live API-based application. React source, real Plant Doctor inference, user accounts, live mandi feeds, and production persistence are separate milestones.

## Safety and data integrity

All sample market prices, weather, forecasts, user posts, and Plant Doctor outputs are illustrative, not verified live information. Plant photos are not medically or agronomically diagnosed by the preview.

## Next development milestone

Move the full React/Vite source tree into `apps/web/`, expand the data-adapter boundary, add dedicated Buyer Requirements and Services UIs, then validate a production build and mobile layout. Never add credentials to version control.
