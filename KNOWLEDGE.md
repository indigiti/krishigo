# KrishiGo — Living Knowledge & Delivery Tracker

> **Single source of truth for development status.** Updated: 2026-11-05 (M19).
> Repository: indigiti/krishigo
> Branch lineage: main (M1–M15) → feature/agri-inputs-intelligence (M16–M18, PR #16, not merged) → feature/m19-module-completion-tracker (current engineering batch).
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
- M18 knowledge library and M17 input operations live in open PR #16; M19 depends on that work.
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
- [ ] Record successful final CI and update test evidence before marking M19 engineering accepted.
- [ ] Hosted deployment and real provider verification deliberately deferred.

### M20 — Source-backed content and service models
- [ ] Versioned editor-reviewable catalogue for crops, calendars, schemes, mandi metadata and input references.
- [ ] Publisher/source URL, publication date, last review, jurisdiction, supersession and freshness metadata.
- [ ] Safe staging import and provenance diagnostics, plus multilingual editorial workflow.

### M21 — Secure persistent multi-user flows
- [ ] Authorized DB strategy, migration, backups and rollback.
- [ ] Account ownership verification, recovery, MFA, roles and record ownership tests.
- [ ] Media scanning, consent, retention/deletion and audit logs.
- [ ] Durable idempotent event processing and observability.

### M22 — Verified agricultural provider integrations
- [ ] Current mandi and IMD/weather data with dates, units and error handling.
- [ ] Official scheme and pesticide/fertilizer registration evidence.
- [ ] Authorization/data licences and source staleness logic.

### M23 — Real commerce and services
- [ ] Onboarding, actual marketplace enquiries and quotation/order lifecycle.
- [ ] FPO aggregation, equipment and storage bookings, logistics.
- [ ] Trade legal checks, payments, reconciliation and disputes.

### M24 — OCR, AI and messaging
- [ ] Secure OCR with audited label matching and human verification.
- [ ] Source-grounded multilingual assistant with confidence and agronomist escalation.
- [ ] Opt-in WhatsApp/email notifications, unsubscribe, receipts and limits.

### M25 — Production hardening and launch
- [ ] Production DB acceptance, integration tests, independent security testing and rollback.
- [ ] Cloudways acceptance, real device performance, accessibility, SEO and localization.
- [ ] Controlled pilot activation and farmer feedback.

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
- M18 PR #16 must be integrated before merging M19 against main.

## Evidence before M19
- M1–M15 merged on main at 8868e7f24b9f.
- PR #16, M18 head 5373a2cdfa8968bf72dbfa3143db650ba6389e3d, open/draft. GitHub CI 42067293001 passed.
- No verified live Cloudways deployment for M18/M19.
