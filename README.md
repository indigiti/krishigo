# KrishiGo — agricultural platform

**Development milestone M1 (in progress).** React/TypeScript mobile-first staging application + custom PHP API scaffold. No Laravel and **no database used in staging**.

## Application

```
cd apps/web
npm install
npm run dev
npm test
npm run build
```

- Five original premium screens: Overview, Plant Doctor, Marketplace, Community, Insights.
- New screens: Buyer Requirements, Services, Crop Journal, Discover (all 25 scope modules), Admin staging readiness.
- Demo listing drafts, mock buyer requirements, guided photo preview, notes and community posts are session-only. They are not real transactions, medical/agronomic diagnoses or persistent posts.
- Forest, Sand and Night design themes.

The API boundary is in `apps/web/src/services/dataSource.ts`. Mock mode is the default. A PHP scaffold lives in `apps/api-php/` and intentionally returns HTTP 501 for business endpoints.

## Repository documentation

- [Full product master plan](docs/KRISHIGO_MASTER_PLAN.md)
- [Staging vs production](docs/STAGING.md)
- [Development milestone tracker](docs/DEVELOPMENT.md)

## Important restrictions

No real produce orders, payments, AI diagnosis, unverified chemical advice or external marketplace contact in this release. M2 will implement secure authentication, persistence, moderation, and contracted PHP APIs; M3 requires verified market data and independent field validation before real crop inference.
