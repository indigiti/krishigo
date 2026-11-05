# KrishiGo — Living Knowledge & Delivery Tracker

> **Single source of truth for development status.** Updated: 2026-11-06 (M28 production core implementation).
> Repository: indigiti/krishigo
> Branch lineage: main (M1–M25 consolidated via PRs #16, #17 and #18) → feature/m26-farmer-buyer-lifecycle (current development branch).
>
> This is a **code and product delivery tracker**, not an attestation of real data, regulatory compliance, live Cloudways deployment, vendor integrations, or final acceptance. The user has requested implementation of remaining modules ahead of hosted verification. Automated code/security tests still apply. **Do not** mark production-ready until evidence exists.

## Status contract

| Code | Meaning |
|---|---|
| D | Demo shell or local-only workflow (no external outcomes) |
| S | Server-validated protected staging JSON draft or read workflow, not production service |
| C | Useful reusable deterministic client operation implemented, tests required |
| X | Real external/production provider, registration, payment, delivery or feed NOT connected |
| V | Independently verified on intended live host with authorized data and end-to-end outcomes |
| BLOCKED | Requires credential, provider consent, verified source, regulated approval or production infrastructure |

A module can simultaneously be D+S+C+X. **Never convert “implemented UI” or “all checks pass” into V.**

## Product architecture
- React 19 / TypeScript / Vite frontend; Forest, Sand, Night themes; lazy-loaded module workspaces; mobile/tablet/desktop.
- Custom PHP-first APIs on Cloudways. **No Laravel.**
- Default static DigiOps release: fixture/demo, no server writes, no DB.
- Opt-in protected PHP staging pilot: private JSON with bounded domains, session/CSRF/roles, reviewer decisions, fail-closed mode. Single staging identity; not genuine tenant ownership.
- Production candidate MySQL/MariaDB API exists in isolation (M8); not activated. No automatic DB migration or production activation.
- M18 knowledge, M19 workbench and M20–M25 candidate foundations are consolidated in main. Production integrations remain disabled.
- Gate chemical treatment advice behind current locally registered product labels and agronomist review. Never invent pesticide rates or tank-mix compatibility.

## All 25 modules — implementation inventory

| ID | Module | Existing functional foundation | Still missing for real service | Priority |
|---:|---|---|---|---|
| 01 | Mandi Prices | D+S price-watch draft and sample data | X official APMC feed, freshness, alert delivery | P0 |
| 02 | Buy & Sell Marketplace | D+S lots, moderation, enquiry drafts, MySQL candidate | X verified sellers, offers, orders, payments | P0 |
| 03 | Buyer Requirements | D+S requirements and simple lot matching | X verified buyers, contact, negotiation | P0 |
| 04 | Farmer Community | D+S posts and review state | X public accounts, spam and reports | P1 |
| 05 | Agriculture News | D+S editorial source/headline draft | X publication pipeline and real ingestion | P1 |
| 06 | Weather & Alerts | D+S watch criteria | X authoritative forecast feed and consented warnings | P0 |
| 07 | Farming Knowledge | D+S guide outlines, M18 educational input guides | X expert-reviewed crop calendars/CMS and translations | P0 |
| 08 | Government Schemes | D+S research drafts | X official eligibility and deadline indexing | P1 |
| 09 | Machinery Marketplace | D+S listing draft | X verified sellers, inspection, availability | P2 |
| 10 | Equipment Rentals | D+S rental request draft | X calendars, providers, bookings | P2 |
| 11 | Agricultural Inputs | D+S 12 tools, 13 JSON collections, 42 educational guides, batch watches | X official product approvals, real OCR, retailers, notifications | P0 |
| 12 | Transport & Logistics | D+S shipment planning | X carrier quotes, dispatch, tracking | P1 |
| 13 | Agriculture Services | D+S service request | X verified providers, appointments, invoices | P1 |
| 14 | FPO & Cooperative Hub | D+S aggregation draft | X member ledger, authorization, reconciliation | P1 |
| 15 | Local Business Directory | D+S listing research | X verified addresses/contact permissions | P2 |
| 16 | Video & Learning | D+S learning outline | X hosted curriculum, learning progress | P2 |
| 17 | Storage & Warehousing | D+S capacity enquiry | X facilities, stock/capacity, reservations | P2 |
| 18 | AI Farming Assistant | D+S guarded question intake | X evaluated RAG, trusted sources, escalations | P2 |
| 19 | Livestock Marketplace | D+S listing outline | X animal welfare and permitted trade controls | P3 |
| 20 | Crop Price Intelligence | D+S sample arithmetic | X historical APMC data, analytics, validated forecasts | P1 |
| 21 | Soil & Crop Health | D+S observations and lab field templates | X real labs and expert interpretation | P1 |
| 22 | Agriculture Jobs | D+S job draft | X verified employers, applicants and safe hiring | P2 |
| 23 | Finance & Insurance | D+S education questions | X licensed partners and secure referrals | P3 |
| 24 | Export Marketplace | D+S export notes | X verified buyers, regulations and fulfilment | P3 |
| 25 | Farmer Recognition | D+S nomination drafts | X consent, editorial publication | P3 |

**M19 source milestone:** 24 standard modules now have one reusable deterministic field workbench each (12 numeric tools and 12 action-planning tools) in the M19 branch; Module 11 uses its advanced 12-tool Inputs Intelligence workspaces from M18. This is a code-complete local utility layer, not production-complete service operations. All modules remain X until real providers are connected.

## M19 field tools shipped in source

| Module IDs | Operational tool | Current state |
|---|---|---|
| 1, 2, 3 | Net mandi rate, produce lot value and procurement coverage calculators | C · local-only |
| 4, 5, 6, 7, 8 | Community, news, weather response, crop knowledge, scheme preparation | C · local action plans |
| 9, 10 | Annual machinery cost and rental budget | C · local-only |
| 11 | Separate 12-tool Agricultural Inputs Intelligence | D+S · M18 dependency |
| 12, 14, 17 | Transport unit cost, FPO pooled supply, storage budget | C · local-only |
| 13, 15, 16 | Services, business verification, training preparation | C · local action plans |
| 18, 19, 21, 25 | Farming assistant triage, livestock welfare, soil report, recognition preparation | C · local action plans |
| 20, 22, 23, 24 | Market comparison, wage budget, simple interest, shipment weight | C · local-only |

All calculations validate numeric boundaries, do not call network services, and operate on explicitly entered values. Checks are personal session progress, not identity, registration, qualification or compliance verification. M19 does **not** create real business workflows or connect external vendors.

## Development milestones and checklist

### M19 — Module completion workbench (ACTIVE)
- [x] Root KNOWLEDGE.md with status vocabulary and 25-module scope.
- [x] Add 24 domain-specific on-device field tools (12 calculations + 12 action plans); reuse 12 advanced Module 11 workspaces from M18.
- [x] Reuse existing Module Studio and advanced Module 11 rather than duplicating dashboards.
- [x] Author unit tests for 24 tools with invalid/overflow input; desktop/mobile browser smoke tests for selected modules.
- [x] Label simulation and disable external action, verified rates, booking, diagnosis, notifications and delivery.
- [x] Open dependency-aware draft PR #17 from M19 into the M18 feature branch.
- [x] M19 CI #42077996405 passed all PHP, web and browser jobs; no hosted deployment.
- [ ] Hosted deployment and real provider verification deliberately deferred.

### M20 — Source-backed content and service models (CODE FOUNDATION BUILT)
- [x] MySQL UUIDv7 source register with publisher, original HTTPS link, jurisdiction, publication date and independent editor approval.
- [x] Human-reviewable article records with crop/topic/language, source references, revision/supersession and audit.
- [x] Approved-only, bounded public read APIs; editorial queue and connected UI.
- [ ] Real agricultural content verification, agronomist sign-off and full human Marathi/Hindi translations.
- [ ] Rights clearance, source discovery and bulk editorial ingestion.

### M21 — Secure persistent multi-user flows (PARTIAL CANDIDATE)
- [x] Reuse M8 PHP sessions, CSRF, roles, staff verified_at and prepared MySQL queries.
- [x] Add user-owned farm profile, district/language/crop settings and reviewed supplier registration candidate.
- [x] Optional migration 002 with UUIDv7 IDs, foreign keys, audit trails, opt-in events and trade schema; isolated _test database only in CI.
- [ ] Real account ownership proofs, recovery/MFA, identity documents, privacy deletion, tenant isolation acceptance.
- [ ] Authorized real DB migration, backups/restore, data retention and production monitoring.

### M22 — Verified agricultural provider integrations (MANUAL SOURCE PATH ONLY)
- [x] Source-linked, independently reviewed mandi/weather/scheme/input/logistics snapshots and expiry/freshness gates.
- [x] Read-only public API filters out missing and expired data; no fabricated values or official-feed claims.
- [ ] Authorized live IMD/APMC and government provider APIs, data licences, ingestion jobs and monitoring.
- [ ] Current legally verified pesticide/fertilizer labels and professional product review.

### M23 — Real commerce and services (PROVISIONAL INTERNAL TRADE)
- [x] Seller quotation tied to owned published listing and buyer enquiry, quantity and expiry validation.
- [x] Buyer accept/reject, stock reservation guarded by listing row lock, internal order record and seller confirmation.
- [x] Duplicate quote prevention, status transitions, cross-role checks, in-app consented trade notices.
- [ ] Real provider verification, payments, tax/legal requirements, invoicing, fulfilment, dispute/refund controls.
- [ ] FPO collective member accounting and actual services/equipment/warehouse bookings.

### M24 — OCR, AI and messaging (SAFE FOUNDATION ONLY)
- [x] Private manual crop-health and product-label transcription intake for expert review; no file upload.
- [x] Deterministic source-only search with independent article citations and no generated pesticide advice.
- [x] In-app notification opt-in/out by topic, owner-scoped event inbox; no external send.
- [ ] Secure OCR worker and upload scanning, accuracy evaluation, real AI/RAG, clinician/agronomist dispatch.
- [ ] Official WhatsApp/email/push delivery, delivery receipts, template approval and unsubscribe processing.

### M25 — Production hardening and launch (CODE-ONLY PREFLIGHT)
- [x] Add isolated MySQL 8 CI service for cross-role production candidate regression, separate from static staging (run 42082870201 successful).
- [x] Add explicit production-only connected React workspace and mock desktop/mobile browser checks (run 42082870201 successful).
- [x] Add offline fail-closed readiness report with production_launch_authorized=false and remaining external gates.
- [ ] Independent security assessment, Cloudways deployment and browser acceptance, backup/rollback drill.
- [ ] Live observability, GDPR/Indian privacy compliance, local-language usability, SEO, performance and launch approvals.

## M20–M25 implementation ledger

| Component | Code location | Evidence / scope |
|---|---|---|
| Migration v2 | apps/api-php/database/migrations/002_platform_foundations.sql | Reviewed metadata, profiles, quotes, orders, cases, in-app preferences and audit |
| M20 knowledge | apps/api-php/src/Production/KnowledgeApi.php | Versioned source/editorial workflows and provenance |
| M21/M23 trade | apps/api-php/src/Production/CommerceApi.php | Authenticated farm owner records, seller review, provisional quote/order |
| M24/M25 intelligence | apps/api-php/src/Production/EngagementApi.php | Source-only results, manual observation/OCR intake, opt-in events, capability flags |
| Safeguards | apps/api-php/src/Production/PlatformCommon.php | UUIDv7, HTTPS provenance, roles, CSRF, audited decisions |
| Connected UI | apps/web/src/features/PlatformOperations.tsx | Available only under explicit production-candidate API mode |
| Production integration | apps/api-php/tests/platform_integration.py | Isolated MySQL HTTP tests; CI result to be recorded once final commit is green |
| Launch gate | tools/check_platform_readiness.py | Offline readiness JSON; explicitly not approval for deployment |
| Reference | docs/M20_M25_PLATFORM_FOUNDATIONS.md | API, migration and remaining external/legal dependencies |

**Milestone classification:** M20–M25 foundations are implemented as source code and testable internal workflows. They are **not** production-completed because external provider integrations, real identities, OCR/AI engines, regulated commerce and hosted acceptance are outstanding. Every module remains X where its real external service is absent.

## Engineering rules and definition of done
1. Each milestone logs branch, PR, commit, test/run, module IDs and status. Do not state “deployed” from CI.
2. All real-world outcomes require end-to-end checks once providers are authorized. A form is not proof.
3. Bound numeric inputs; reject NaN/infinite values; state units and validity dates; server auth for all writes.
4. No unapproved network integrations, DB installation, credentials, public publishing or automatic real-world actions.
5. Explicitly label mock data especially chemical advice, weather, prices, schemes and recalls.
6. Preserve M1–M18 compatibility and static default deploy; always run regression tests even if hosted verification is later.
7. Keep this as the **single living status file**. Milestone documents are reference appendices.

## Documentation debt
- Root README still describes M1 as in progress; STAGING.md and DEVELOPMENT.md include historical descriptions.
- Bring README status up to date and reference this file.
- PRs #16, #17 and #18 are merged; consolidate the remaining historical milestone references when updating documentation.

## M26 — Farmer-to-buyer operational journey (DEVELOPMENT BRANCH)

**Goal:** Complete a practical, auditable, internally simulated farmer-to-buyer journey using one React/PHP/MySQL architecture, rather than isolated demonstration forms. No real payment, delivery, warehouse booking or customer messaging is implied.

- [x] Add integrated trade dashboard: moderated public lots, seller-owned lots, participant-scoped enquiries, provisional quotes and orders.
- [x] Replace manual-number quotation entry with guided seller response to an actual owned enquiry.
- [x] Add buyer lot discovery and enquiry entry in one workspace.
- [x] Append trade activity history for offers, buyer decisions, seller confirmations and cancellations.
- [x] Add reversible, reasoned cancellation with listing-row lock to release reserved quantity and prevent double cancellation.
- [x] Enforce participant-only history and cancellation, owner/role checks, same-origin CSRF and staff-reviewed restricted actions.
- [x] Add schema 003_trade_lifecycle.sql to disposable MySQL test bootstrap only (no live migration).
- [x] Add cross-buyer conflict, CSRF, ownership, timeline, idempotency and reservation-release HTTP integration scenarios.
- [x] Pin Playwright to stable 1.64.1 after previously floating npm range produced ETARGET on main.
- [x] Full PHP, web, disposable MySQL and desktop/mobile browser acceptance passed in GitHub Actions run 42087215095 at commit 97680b611c24fb8829979e35f93da2f089308687.
- [ ] Merge M26 PR after code review and checks; no Cloudways deployment authorized.
- [ ] Real identity verification, independent supplier licences, live inventory, payments, freight, invoicing, disputes and contract policy are still missing.

| M26 asset | Path | Boundary |
|---|---|---|
| Internal trade API | apps/api-php/src/Production/TradeJourney.php | Participant-scoped, no external actions |
| Audit and quotation state changes | apps/api-php/src/Production/CommerceApi.php | Writes transactionally with activity events |
| Trade history schema | apps/api-php/database/migrations/003_trade_lifecycle.sql | Append-only audit, UUIDv7 |
| Guided React journey | apps/web/src/features/TradeJourneyWorkspace.tsx | Only explicit PHP production-candidate mode |
| Integration regression | apps/api-php/tests/platform_integration.py | Disposable _test MySQL |
| Browser coverage | apps/web/e2e/platform-operations.spec.ts | Production-mode mocked endpoints |
| Reference | docs/M26_FARMER_BUYER_JOURNEY.md | Operational flow and blocked live-service gates |

## M28 — Production module authorization, private fields and real-mode UI (DRAFT BRANCH)

See docs/M28_PRODUCTION_CORE_GUARDRAILS.md for API contracts, constraints and rollout requirements.

- [x] Add 004_core_guardrails.sql with production module policy, UUIDv7 private fields, and field-to-agronomy case links.
- [x] Enforce mapped module permissions server-side in the real PHP router, independent of mock browser flags.
- [x] Add admin-only, CSRF-protected, optimistic-revision policy updates with dependent-module cascade and audit records.
- [x] Fail closed if production module policy rows are absent or incomplete.
- [x] Route production-mode primary UI away from fictional data to authenticated PHP workspaces or explicit unavailable states.
- [x] Restrict production navigation to server-enabled modules; provide real admin controls.
- [x] Create/edit/archive owner-scoped farm fields with revision protection and private audit.
- [x] Connect manual crop/label observations to an active field owned by that account in one SQL transaction.
- [x] Add HTTP/SQL tests for role authorization, CSRF, module cascade, field ownership and case links.
- [x] Add connected-mode desktop/mobile tests to reject fictional Marketplace content and exercise field creation.
- [ ] Complete M28 code CI and independent review (record exact successful run).
- [ ] Merge M26 PR #19 first; M28 branch is based on that unmerged implementation.
- [ ] Hosted Cloudways verification, audited migration, live release and provider integrations are NOT completed.

**Still P0/P1:** Verified email/phone possession, account recovery and MFA; organization/FPO tenancy; certified pesticide registrations and agronomist review; live APMC/IMD/scheme sources; actual OCR/AI; payment/dispatch/WhatsApp; complete 25-module business lifecycles. These remain blocked or unimplemented, not assumed done.

## GitHub evidence and promotion chain

- M1–M15 merged earlier (base 8868e7f24b9f).
- PR #16 (M18) merged at 0a097322bf94b0f92e7b32fdea402c5bd06724e2.
- PR #17 (M19) merged at ee520b22a7f6e9b8383bc514184c4cb0f31d1b9d.
- PR #18 (M20–M25) merged at 2c2204582da55a87683f76c4bf0fd48fe72e50f9.
- M20–M25 last feature CI #42083434491 passed before consolidation. Main-branch web CI dependency issue was corrected by merged PR #20; M26 retains a compatible pinned version.
- M26 draft PR #19 targets main. Code and CI milestone verified by run 42087702914; hosted and external integrations not accepted.
- M28 depends on draft M26 and is developed on feature/m28-production-core-guardrails; separate approval required.
- No authorized Cloudways production-mode activation, real commerce settlement, or live provider verification.
- No verified live Cloudways deployment of M26 or the M20–M25 candidate. Internal CI results are not deployment acceptance.
