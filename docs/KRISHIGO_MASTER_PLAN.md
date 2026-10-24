# KrishiGo — Final Master Product & Engineering Plan

**Plan date:** 24 October 2026  
**Status:** Architecture and scope approved for planning; product features are **not** production implemented.  
**Repository:** https://github.com/indigiti/krishigo  
**Non-negotiables:** No Laravel; Cloudways Custom PHP primary backend; React cross-platform UI; Python for crop AI and specialized processing; **no database in staging**; production database only after verification.

## 1. Product vision

KrishiGo is a multilingual agricultural operating platform for Indian farmers, buyers, traders, FPOs, experts and service businesses. It joins six experiences under one identity:

1. **KrishiGo Home:** personalized agriculture dashboard and daily action hub.
2. **KrishiGo Market:** produce buy/sell, buyer requirements, inputs, machinery and services.
3. **KrishiGo Plant Doctor:** preliminary disease/pest screening, crop diary and expert guidance.
4. **KrishiGo Circle:** local and crop-based farmer community.
5. **KrishiGo Insights:** mandi prices, weather, price trends, news and knowledge.
6. **KrishiGo Business:** FPO, service-provider and buyer management dashboards.

India-wide architecture; initial content, language and locality optimization for Maharashtra. Support Marathi, Hindi and English initially.

## 2. Exactly what exists today

The current supplied prototype is a **React 19 + TypeScript + Vite** static, no-database UI. Five selectable views exist: **Overview, Plant Doctor, Marketplace, Community, Insights**. It has three working visual themes: **Forest, Sand, Night**.

Prototype functions: theme switching; responsive navigation; fictional sample data display; marketplace search/filter/save; in-memory community post/like; local image preview in Plant Doctor; sample screening guidance; illustrative chart and mandi-rate interface. This does not provide persistent posting, authenticated multi-user flows, actual mandi feeds, a PHP API, real disease diagnosis, expert consultations, transactions, verified identities, or production notifications.

`src/services/dataSource.ts` is an early data-source seam, currently supporting only listing and community-post reads. It must be expanded and hardened; it is **not** a complete production persistence adapter.

## 3. Full 25-module product scope

The 25 modules from the original scope remain included in the master roadmap. P1/P2/P3 indicate deployment priority, not existing implementation.

| # | Module | Scope | Phase |
|---|---|---|---|
| 1 | Mandi Prices | APMC quotations, report dates, history and comparison | P1 |
| 2 | Buy & Sell Market | Produce listing, offers, negotiations and enquiries | P1 |
| 3 | Buyer Requirements | Trader procurement requests, matches and enquiry flow | P1 |
| 4 | Farmer Community | Crop/district groups, posts, Q&A, media and moderation | P1 |
| 5 | Agriculture News | Editorial publishing, categories and source attribution | P1 |
| 6 | Weather & Alerts | Location-based forecast and appropriately sourced alerts | P1 |
| 7 | Farming Knowledge | Crop guides, planting, nutrition and prevention | P1 |
| 8 | Government Schemes | Scheme listings, eligibility, documents, expiry | P1 |
| 9 | Machinery Marketplace | New/used tractor and implement listings | P2 |
| 10 | Equipment Rentals | Tractor/harvester/drone availability, enquiries | P2 |
| 11 | Agricultural Inputs | Seed, fertilizer and supplies directory/listings | P2 |
| 12 | Transport & Logistics | Vehicle discovery and quote requests | P2 |
| 13 | Agriculture Services | Labour, soil tests, repairs and spraying services | P2 |
| 14 | FPO & Cooperative Hub | Bulk produce aggregation and buyer management | P2 |
| 15 | Local Business Directory | Agricultural supplier/provider discovery | P2 |
| 16 | Video & Learning | Training, expert events, learning content | P2 |
| 17 | Storage & Warehousing | Cold-storage/warehouse directory and enquiries | P2 |
| 18 | AI Farming Assistant | Crop-grounded multilingual questions and answers | P2; limited guided Plant Doctor Q&A P1 |
| 19 | Livestock Marketplace | Permitted livestock listings and verification | P3 |
| 20 | Crop Price Intelligence | Advanced historical analysis and price trends | P3 |
| 21 | Soil & Crop Health | Soil reports and extended crop-health analytics | P3; Plant Doctor core P1 |
| 22 | Agriculture Jobs | Agricultural work and seasonal labour listings | P3 |
| 23 | Finance & Insurance | Educational content and regulated-partner referrals | P3 |
| 24 | Export Marketplace | Exporter leads and quality/market information | P3 |
| 25 | Farmer Recognition | Success stories, awards and community showcases | P3 |

**Additional flagship module (cross-cutting, P1): KrishiGo Plant Doctor**. It is included above through related functionality, but implemented as a first-class main navigation area, not buried within a subpage.

## 4. Plant Doctor end-to-end feature map

| Stage | Features | Phase |
|---|---|---|
| Intake | Capture/upload leaf, stem, whole-plant photos; crop, stage, affected area, symptoms, location, duration | P1 |
| Screening | Photo quality checks; possible disease/pest causes; confidence/uncertainty; ask for extra views | P1 after validation |
| Explanation | Easy-to-read regional-language explanation; distinguishing symptoms; safe next steps | P1 |
| Interaction | Ask questions; text/voice input; translated responses | Text P1; voice P2 where needed |
| Memory | Per-crop case history, photos, follow-ups and outcomes | P1 |
| Expert safety | Refer ambiguous/severe cases to qualified agronomists; moderated advisories | Referral flow P1; full expert scheduling P2 |
| Care tools | Crop calendars, irrigation, deficiencies, nutrient/soil interpretation | P2 |
| Monitoring | Recovery comparison, weather-linked risk, field notes and alerts | P2 |
| Intelligence | Regional outbreak aggregation and offline capabilities | P3 |

**Safety:** Photos are not definitive diagnoses. Distinguish visually similar disease, pest, nutrient, water and environmental stress; avoid false precision. Use evidence-based IPM guidance. Do not generate pesticide product/dosage instructions unless checked against current locally applicable labels and regulations. Mark unverified AI outputs as preliminary and offer expert review. Explicit permission and retention rules for photos and optional location. Do not use private uploads for training without separate consent.

## 5. Product navigation / screen inventory

### Public website
Homepage; Explore Market; Commodity Detail; Mandi and Market Detail; Seller Profile; Buyer Requirement Detail; Plant Doctor explainer; Public Crop Guides; News Article; Schemes; Business Directory; Public Community Topics; Language and Location selectors.

### Farmer application
Overview; My Crops; Plant Doctor Scan; Screening Result; Follow-Up Chat; Case History; Saved Guidance; Post Produce; My Listings; Buyer Enquiries; Saved Listings; Community Feed; Create Post; Community Groups; Notifications; Profile; Privacy and Preferences.

### Buyer / business / FPO application
Procurement Dashboard; Post Requirement; Supply Search; Offers and Enquiries; Verified Business Profile; FPO Harvest Calendar; Members and Aggregation; Machinery/Rental Management; Leads and Services.

### Admin / editorial
Overview; Users and Verifications; Listings Moderation; Crop Cases and Agronomist Escalations; Mandi Sources and Freshness; News/Crop Content CMS; Community Reports; Business Directory Reviews; Alerts; Analytics; Audit Logs; Integrations; Roles and Settings.

### Mobile navigation
Home · Market · Plant Doctor (prominent central action) · Community · Profile. Mandi/News/Weather/Services under Home and Discover. Desktop gets a full left navigation and contextual search.

## 6. Design system — visual direction

- **Primary:** Forest design (deep agricultural green, warm white, lime accent, restrained gold).
- **Secondary:** Sand design for crop care, guides and softer editorial pages.
- **Optional:** Night dashboard theme for analytics/dark mode.
- Rounded premium cards, large accessible typography, editorial agriculture imagery, natural gradients, lightweight charts, professional iconography and generous spacing.
- Do **not** show sensor-derived water, humidity, growth, pesticide or nitrogen values unless actual measurements or defensible calculations exist. Illustrative values must be labelled SAMPLE.
- Prioritize accessibility, 44px+ touch targets, keyboard navigation, low-end Android testing, compressed image delivery and reduced-motion support.

## 7. Architecture — no Laravel

### Staging (zero database)
- React 19 + TypeScript + Vite, plain optimized CSS or chosen utility styling.
- Static mock JSON/TypeScript fixtures for every planned module. No secrets and no production user data.
- Client-only in-memory demo state. Optional browser `localStorage` only for non-sensitive UI preferences, never to imply multi-user persistence.
- A `DataProvider` interface for each domain: Marketplace, Buyers, Community, PlantCare, Mandi, Weather, Content, Services, Admin.
- `MockProvider` for staging and `ApiProvider` for later production; same typed contracts.
- Plant Doctor photo preview and guided educational sample mode explicitly labelled; do not pretend AI analysis happened.
- Build static `dist/` hosted over HTTPS on Cloudways Custom PHP hosting or CDN. No staging MySQL, MariaDB or SQLite.

### Production
- PHP 8.x custom modular API (Composer PSR-4, PDO, PSR-7-compatible routing if desired), on Cloudways Custom PHP app. **Never Laravel.**
- MySQL/MariaDB as authoritative relational store, with versioned migrations and seeded reference data.
- Redis for cache, throttling and job coordination as supported by the deployment.
- Python 3 worker or private FastAPI service for plant image inference, dataset normalization, AI, forecasting and specialist jobs. Deploy outside Cloudways if permanent Python processes are unsupported.
- CDN with S3-compatible object storage for compressed media, expiring access tokens for private scan images.
- PHP is the public business API; Python private to service-to-service calls or jobs.
- React web/PWA shared component library; Capacitor for Android/iOS; Tauri only on validated demand.
- Public listing/article/commodity detail pages must receive SSR or prerendered HTML for SEO. Select hosting strategy before production search launch; Vite SPA by itself is not adequate for every SEO page.

### Deployment boundaries
`apps/web`, `apps/api-php`, `apps/admin`, `apps/mobile`, `services/plant-ai`, `packages/ui`, `packages/contracts`, `packages/i18n`, `fixtures`, `docs`, `infrastructure`.

## 8. Migration from staging to production database

1. Freeze typed API contracts and stable IDs across JSON fixtures.
2. Define MySQL schema and migration scripts for users/roles, crops, listings, buyer_requirements, enquiries, posts/reactions, plant_cases, plant_case_images, mandi_prices, services, content, notifications, moderation and audit logs.
3. Implement `ApiProvider` alongside the current mock providers. Never hard-code network/business logic in UI components.
4. Build production authentication/authorization; session or native tokens, CSRF where applicable, rate limits, validation, moderation and idempotent mutations.
5. Add a read-only preview against test production-shaped APIs, then test writes in an isolated non-production environment before production cutover.
6. Integrate Python AI worker, asynchronous case processing and image retention rules. Release only after field-photo validation and advice-safety review.
7. Create production migration/backups, observability, and rollback runbook; avoid treating temporary browser data as transferable user accounts.
8. Switch environment from mock to API. Verify all workflows and launch incrementally.

## 9. Milestones with exit criteria

### M0 — UI foundation (prototype status: PARTIAL)
All themes, desktop/mobile navigation, design tokens, shared cards/form patterns, loading/error/empty states, translations, accessible responsive layout. Existing five prototype pages are a starting point, **not complete**.

### M1 — All-modules no-database staging showroom
Accessible screens or intentionally marked previews for all 25 modules plus Plant Doctor. Every module has meaningful workflows, fixture contracts and visible DEMO badges. Functional UI demo flows for core Marketplace, Buyers, Plant Doctor, Community, Mandi and Admin. No false real transactions or diagnoses.

### M2 — PHP API and production data design
Custom PHP modular API, auth, roles, domain contracts, MySQL schemas/migrations, moderation, queue/cache/storage, security and API tests. No Laravel.

### M3 — Core production release
Verified mandi feeds with source timestamps; produce marketplace and buyer requirements; community moderation; editorial content; localized weather; crop knowledge and government schemes; user profiles and alerts. Plant Doctor preliminary screening only after clinical-equivalent agricultural validation and expert-review safeguards.

### M4 — Services and scale
Machinery market/rentals, input listings, agriculture jobs, logistics, storage, business directories, FPO features, videos and paid business plans. Phased Android/iOS packaging and push alerts.

### M5 — Advanced intelligence and expansion
Price intelligence, regional crop monitoring, soil reports, livestock, export, finance partners, farmer recognition and desktop-specific features if needed.

## 10. Quality gates / measurable acceptance

- Mobile first: 360–390px, mid-range Android and poor network testing; no horizontal scroll.
- Core Web Vitals targets (real users, 75th percentile): LCP <=2.5s, INP <=200ms, CLS <=0.1.
- WCAG 2.2 AA target for accessibility; keyboard, screen reader, contrast, focus and reduced-motion checks.
- Automated builds, lint/typecheck, unit and API contract tests; visual regression for Forest/Sand/Night themes.
- Scan results must document model version, crop context, uncertainty, rationale/reference, review state and follow-up actions.
- Prices must include market, date, unit, grade and source; clearly label stale/unverified information.
- Moderation, anti-spam, trust levels, fraud reports and consent controls before open multi-user launch.
- Cloudways deploy/staging rollback, tested DB backups (production), monitoring and audit logs.

## 11. Commercial model and compliance

Free baseline farmer listings, crop-care knowledge and community; paid featured listings, verified commercial profiles, FPO tools, equipment/service leads, disclosed sponsors and advanced business intelligence. Start with enquiries, **not** in-app payments or escrow. Examine APMC trading constraints, agricultural input licensing, food safety, regulated financial referrals and platform privacy obligations before monetized transactions.

## 12. Immediate development decision

**Build M1 first:** expand the five-page prototype into the full no-database staging showroom, with core end-to-end user flows and the premium Forest design. No production data, real diagnosis, PHP backend deployment or GitHub claims until the relevant code is implemented and verified. Then move through M2 and M3 with controlled production-readiness gates.