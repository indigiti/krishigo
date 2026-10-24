# M6 — Interactive workspaces for all 25 KrishiGo modules

## What is delivered

The existing **Discover** catalogue now opens a dedicated, visually consistent staging workspace for each of the 25 planned modules. The module workspaces contain specifically worded sample activities, full-text filtering, saved sample ideas, distinct module-specific draft forms, removable local drafts, and checklist controls. Mandi Prices and Crop Price Intelligence additionally offer a mathematical *net realization* calculator using numbers the visitor enters (not market forecasts). Local module states reset when navigating away or reloading the page.

No module uses a database, account storage, API mutations, or live external information. No real transactions, seller contact, bookings, scheme applications, job applications, recommendations, plant AI inference, financial services, livestock trading, or publications occur. The existing primary Marketplace, Community, Plant Doctor, and other screens remain available.

## Module coverage

1. Mandi Prices — crop and market watch drafts plus a transparent calculator.
2. Buy & Sell Marketplace — produce draft listing fields.
3. Buyer Requirements — draft procurement needs.
4. Farmer Community — moderated post outline.
5. Agriculture News — source-attributed editorial draft.
6. Weather & Alerts — location/crop alert criteria (no notifications).
7. Farming Knowledge — guide outline and crop stages.
8. Government Schemes — official-source research drafts.
9. Machinery Marketplace — condition and price fields.
10. Equipment Rentals — equipment, hours and date draft.
11. Agricultural Inputs — category, crop and quantity enquiry draft.
12. Transport & Logistics — route and payload draft.
13. Agriculture Services — service request draft.
14. FPO & Cooperative Hub — bulk aggregation draft.
15. Local Business Directory — category and locality research.
16. Video & Learning — learning plan and language.
17. Storage & Warehousing — storage type and capacity draft.
18. AI Farming Assistant — symptoms intake only, explicitly no diagnosis.
19. Livestock Marketplace — regulated-category listing outline.
20. Crop Price Intelligence — analysis brief and net realization calculator.
21. Soil & Crop Health — lab-result and field observation draft.
22. Agriculture Jobs — role, location and work duration draft.
23. Finance & Insurance — educational research, not loan/insurance advice.
24. Export Marketplace — destination, commodity and compliance checklist.
25. Farmer Recognition — consent-based recognition nomination draft.

## Implementation boundaries

- React module IDs align with `scopeModules` in `apps/web/src/data/expanded.ts`.
- All 25 content definitions and module-specific form fields live in `apps/web/src/features/ModuleStudio.tsx`.
- Discover opens a ModuleStudio screen without changing the top-level navigation or route; dedicated URL routing remains a separate future milestone.
- Saved ideas, reviews and drafts use only React component state and are erased on reload or when leaving the module.
- Detailed production modules require an authoritative PHP API, verified sources, persistent identity and data, moderation and audit logs, localization and legal/safety reviews.

## QA gates

- Existing 15 navigation screens and theme-switching tests must pass.
- Automated source check asserts 25 tailored specs and no local persistence/HTTP mutations.
- Playwright validates representative different module sections on mobile and desktop, local draft save/delete, and no HTTP mutation requests.
- All staging demo disclaimers, Vite `/krishigo/` base, DigiOps artifact name and safe public payload must remain intact.

## Roadmap after M6

**M7 — Finish selected end-to-end flows** in the existing Marketplace, Plant Doctor, Community and Buyer modules (still mock, but precise validation, states and accessibility). Then implement independent secure PHP API and database-backed operations for production. Only after validated field testing should AI-based plant screening be enabled. Avoid counting a working front-end prototype as a launched service.
