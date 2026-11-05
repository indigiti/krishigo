# M27 — KrishiGo deep 25-module and feature audit

**Audited:** 6 November 2026. **Source:** main at 1685d3ec3a2af41a9172600a902bf8f25e1e26ec, and draft M26 PR #19 at fa21e1a2bda678ab9c42d7fba5078dfadeeaac9d.

**Method:** Source inspection of both registries, 25 staging contracts, React screens and tool specs, PHP JSON and MySQL services, SQL schemas, current GitHub Actions and test files. No authorized Cloudways login or database read, real source credentials, agronomist approval, payments or hosted user testing. This is a static engineering audit, not a penetration test.

## Executive verdict

All **25 modules** appear in the registry with **mode = demo** and enabled = true. All have a UI preview, a 3-field JSON draft contract and a local field tool (12 calculations + 12 checklists), except Agricultural Inputs which has 12 preview workspaces and 13 JSON draft collections.

**Completion levels:** L1 = UI/demo; L2 = bounded draft/calculator/checklist; L3-P = selected authenticated MySQL workflow, not full service; L3-M26 = tested but unmerged farmer-to-buyer operational candidate; L4 = real-provider operational service independently accepted on target host. **0/25 demonstrated L4.**

The MySQL candidate implements real *internal persistence* for listings, buyer requirements, community posts, plant cases, source/article reviews, manual data snapshots, farm profiles, supplier review, internal quotes/orders and consented in-app records. This is not comprehensive implementation of 25 business products.

## Detailed module-by-module status

| # | Module | Existing functionality | Depth | Work still required |
|---:|---|---|---|---|
| 1 | Mandi Prices | Market and commodity watch draft, net price calculator, generic manually approved source snapshot | L2 + shared L3-P | Authorized APMC ingestion, price normalization/history, freshness, subscriptions |
| 2 | Buy & Sell Marketplace | Listing, review, enquiry, provisional quote/order API; M26 guided trade, reservation, cancellation (draft PR #19) | L3-P / M26 | Verified seller/produce, actual stock, payment, invoicing, shipping, dispute handling |
| 3 | Buyer Requirements | Requirement draft, quantity-gap calculator, moderated MySQL requirement and enquiry | L3-P | Verified procurement, grades, matching, outreach, offers/fulfillment |
| 4 | Farmer Community | Post draft, moderation checklist, MySQL post approval | L3-P | Groups, discussions/replies, member trust, reporting, anti-spam, notifications |
| 5 | Agriculture News | Editorial draft/checklist and generic reviewed article CMS | L3-P partial | Real newsroom publication, feed ingestion, rights, corrections, distribution |
| 6 | Weather & Alerts | Location/risk watch draft and preparation checklist, manually reviewed snapshot | L2 + shared L3-P | Official forecast/warning provider, timing, crop-context rules, delivery |
| 7 | Farming Knowledge | Guide drafts; 42 educational guides; language-tagged source/article CMS | L2 + CMS L3-P | Agronomist-approved crop calendars, full professional Marathi/Hindi, publishing lifecycle |
| 8 | Government Schemes | Research and document checklist, manually approved snapshot | L2 + shared L3-P | Official scheme registry, eligibility/rules, deadlines, application status |
| 9 | Machinery Marketplace | Machinery/condition/price draft, annualized cost calculator | L2 | Seller ownership, equipment photos/inspection, enquiries, trade completion |
| 10 | Equipment Rentals | Rental-date/hours draft and hire budget | L2 | Provider inventory/calendar, booking, operator safety, invoices |
| 11 | Agricultural Inputs | 12 crop/label/nutrient tools, 13 staging collections, 8 crop guides, 15 pest/disease, 11 nutrients, 8 input-class guides | L2 rich staging | Official registered crop uses, verified products/dealers, actual OCR, nutrient review, live prices/recalls |
| 12 | Transport & Logistics | Pickup/destination/load draft and unit freight cost | L2 | Fleet quotes, transport booking, dispatch, tracking and POD |
| 13 | Agriculture Services | Service request drafts and preparation checklist; six-domain protected staging pilot | L2 | Verified providers, availability, job assignment, payment, completion |
| 14 | FPO & Cooperative Hub | Aggregation draft and pooled quantity calculation | L2 | Member accounts, organizational roles, lot ledger, reconciliation, payments |
| 15 | Local Business Directory | Business draft/review checklist; adjacent supplier profile API | L2 / adjacent L3-P | Verified geocoded directory, contact permission and search |
| 16 | Video & Learning | Course outline and instructor/captions checklist | L2 | Hosted content, curriculum publication, progress, quizzes |
| 17 | Storage & Warehousing | Capacity enquiry and storage budget | L2 | Verified warehouse inventory/rates, booking, cold-chain SLA |
| 18 | AI Farming Assistant | Question draft and triage; server-only deterministic approved-source keyword search | L2 / source L3-P | Evaluated RAG/model, multilingual responses, qualified expert handoff |
| 19 | Livestock Marketplace | Category/age draft, animal welfare checklist | L2 | Legal restrictions, veterinary and ownership evidence, verified transactions |
| 20 | Crop Price Intelligence | Sample rates, manual A/B net comparison | L2 | Historical market time-series and validated analytics/forecasts |
| 21 | Soil & Crop Health | Soil observation draft, private MySQL plant case/agronomy intake | L2 + L3-P intake | Field/plot model, lab integration, diagnosis review, treatment traceability |
| 22 | Agriculture Jobs | Job posting outline and wage budget | L2 | Verified employers, applicants, hiring lifecycle, labor compliance |
| 23 | Finance & Insurance | Literacy draft and simple-interest calculation | L2 | Authorized providers, verified referrals, secure regulated application |
| 24 | Export Marketplace | Export note and package-weight calculation | L2 | Buyer/exporter verification, compliance documents, logistics/payments |
| 25 | Farmer Recognition | Nomination/consent draft, editorial checklist | L2 | Consent evidence, adjudication, publication and correction/removal |

## Deep check — Module 11's twelve advertised tools

| Feature | Actual implementation | Not implemented |
|---|---|---|
| Crop-wise discovery | Static crop/category guides, search, source links | Registered products approved for each crop |
| Pest and disease | 15 recognition examples | Validated differential diagnosis and complete crop coverage |
| Nutrient deficiency | 11 role/symptom/field-guide references | Lab-linked, crop-specific deficiency interpretation |
| Product comparison | Eight unverified example categories/grades | Real manufacturer SKU/label catalogue |
| Label scanner | On-device image preview and typed transcription | OCR, scanned uploads, official registration matching |
| Soil test interpreter | Manual pH/text intake | Lab units, validated thresholds and expert interpretation |
| Fertilizer planner | Transparent nutrient-equivalent math | Crop-specific nutrient schedule or safe application recommendation |
| Application history | Local records and protected JSON drafts | Production field-owned event log and traceability |
| Compatibility reference | Unknown/unsupported status and caveats | Manufacturer-evidenced compatibility database |
| Input price/availability | Unsent enquiry/offer drafts | Verified retailer stock, prices and transaction flow |
| Batch and expiry | Date helper, JSON watch, staged recall references | Official recalls, validated batches and real alert delivery |
| Expert consultation | Private draft/question intake | Verified expert assignment, chat, response and case resolution |

**The numbers 12 and 13 refer to tools and collections—not complete external integrations.**

## Defects and launch blockers

**P0-1 — Demo UI / API separation.** The default dataSource stays fixture-backed even when API mode is configured. Connected MySQL workflows appear only in a separate authenticated operations section. Main Marketplace/Buyers/Community/Insights still display examples instead of the authenticated records. Evidence: apps/web/src/services/dataSource.ts and App.tsx.

**P0-2 — Accounts and organizations incomplete.** Email ownership, phone verification, recovery and MFA are not present. The verified_at timestamp represents staff review only. The SQL schema lacks a full organization/tenant and farm plot/field ownership model. Evidence: apps/api-php/src/Production/Api.php and migrations 001_core.sql / 002_platform_foundations.sql.

**P0-3 — Trade is not commercial fulfillment.** M26 adds transactional, participant-scoped order history and cancellation on a draft branch, with passing disposable MySQL tests. Payments, inventory verification, invoicing, dispatch, consumer support and legal seller evidence are still absent. Evidence: draft PR #19 and apps/api-php/src/Production/TradeJourney.php.

**P0-4 — Agronomic and pesticide trust unverified.** Current example product records lack registered crop/use proof; the OCR label screen is local-preview only; sources are educational, not regulatory approvals. Do not present application rates, tank mixing or real crop diagnosis. Evidence: apps/web/src/features/agriInputsModel.ts, AgriInputs.tsx and apps/api-php/src/Json/Inputs.php.

**P1-1 — Registry flags are not uniform production authorization.** Browser-local flags govern demo navigation and a separate shared staging registry exists. PHP production routing happens before staging module-control routing and does not consult the module registry on every production route. Evidence: modulePreferences.ts and apps/api-php/public/index.php.

**P1-2 — Generic drafts are not module services.** Each of 25 module workflow schemas has three fields and saves isolated protected JSON drafts; no domain state transitions or third-party integrations follow from those writes. Evidence: module-workflow-contracts.json and Json/ModuleDrafts.php.

**P1-3 — Thin per-module acceptance coverage.** Unit tests check module tool inventory, math and bounds; browser tests demonstrate selected modules, not all 25 with role, persistence and failure scenarios. MySQL tests cover selected workflows, not booking/payment/feed pipelines. Evidence: moduleFieldTools.test.mjs, module-field-tools.spec.ts, platform_integration.py, CI workflow.

**P1-4 — Editorial trust is administrative, not agronomic/regulatory.** Separate editor approval and source URL metadata exist, but do not prove rights, official authorization, agronomist qualifications or scheduled refresh. Evidence: Production/KnowledgeApi.php.

**P1-5 — Providers are absent.** Live APMC, IMD, government schemes, WhatsApp/email dispatch, OCR worker, AI/RAG, payment gateway, rental and warehouse providers remain explicitly disabled. Evidence: Production/EngagementApi.php capabilities and tools/check_platform_readiness.py.

**P1-6 — Documentation drift.** On main README and KNOWLEDGE.md still describe already-merged PRs #16–#18 as open; draft M26 PR #19 is separate. CI's tracker test checks module count and phrases, not current merge state.

**P2 — Scalability and security acceptance.** Bounded JSON staging store, nonindexed SQL LIKE search, no demonstrated full tenant-isolation test matrix, backup/restore, dynamic production abuse testing, live performance or Cloudways go-live acceptance.

## Working engineering safeguards

Some meaningful controls exist: fail-closed static-vs-production routing, HTTPS/session/CSRF checks, SQL parameterization, validation, row-scoped reads, review/role gates, opt-in notifications, isolated CI MySQL. M26 adds quantity reservation under a listing lock, participant-only history, and cancellation conflict checks. These are **code controls**, not third-party or live-service certification.

## Test evidence

- Consolidated main GitHub Actions #42088136752: successful.
- M26 branch GitHub Actions #42087702914: successful (draft PR #19, not merged).
- The CI builds static web release by default; the protected PHP bundle is separate.
- Current staging URL and Cloudways database were not independently available in this audit. No real provider or production action verified.

## Remediation order and definition of done

1. **R0: Per-module acceptance contracts.** Each module needs domain entities, roles, state transitions, error paths, consent, source freshness, test cases and deployment mode. Do not mark modules complete because a form renders.
2. **R1: Identity/farms/organizations.** Verified account ownership; field/plot model, organization tenancy, user roles, MFA/recovery, privacy retention and auditing.
3. **R2: Production-connected primary UI.** Properly route authenticated marketplace, buyer, community and knowledge pages to real API DTOs in explicit production mode; make demo/real states unmistakable.
4. **R3: M26 review and deeper commerce.** Review/merge PR #19 with approval, then complete legal seller onboarding, settlement, booking, shipping and dispute flows.
5. **R4: Agronomy content and field intelligence.** Licensed sources, crop-stage calendars, soil lab interpretation, product registration and agronomist-reviewed evidence.
6. **R5: Authorized provider connectors.** Mandi/weather/schemes first, then messaging/retail/logistics. Enforce source time, error and staleness requirements.
7. **R6: Complete specialized modules.** FPO, equipment, rentals, warehouse, jobs, livestock, export, finance and learning need independent persistent lifecycles.
8. **R7: Independent quality gates.** Each module must pass role × state × API/DB × browser × network-failure × concurrency tests and hosted performance/security acceptance before L4.

**Conclusion: the 25-module catalogue and draft tools are built, but no module has verified L4 live-service completion.** M26 substantially deepens trade, not every feature. This audit is source-level and does not guarantee that all issues have been detected.
