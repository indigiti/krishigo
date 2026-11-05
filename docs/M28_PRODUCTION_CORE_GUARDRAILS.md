# M28 — Production core guardrails and farm-context integration

Status: engineering candidate on feature/m28-production-core-guardrails, based on draft M26 PR #19. Not merged, not deployed.
Audit: 6 November 2026 (IST).

## Implementation

### Server-enforced production module authorization

New Production/ModuleGate.php and migration 004_core_guardrails.sql introduce a MySQL-backed production policy for all 25 registered IDs. The policy is independent from browser localStorage and protected JSON staging controls. GET /api/v1/platform/modules reports effective enablement, revision and dependencies. Verified administrators alone may PUT /api/v1/admin/platform/modules/{id} with CSRF protection, expected_revision, row locks and audit events. Disabling a parent automatically disables dependent modules; enabling a child requires its parents. Absent or incomplete policy fails closed (503). Mapped production API routes return module_disabled (404) after a server-side check.

Current mappings cover marketplace listings, enquiries/trade, buyer requirements, community, source-backed knowledge, supplier profiles, plant cases, agronomy, farm profiles and fields, and source-only assistance. Snapshot reads map to the requested mandi, weather, schemes, inputs or logistics domain.

This is NOT a promise that all 25 domains already have independent production APIs: missing specialized service endpoints and some editorial maintenance routes still need their own controls. Enabling a module cannot activate an unconnected data provider, payment service, agronomist, OCR engine or WhatsApp gateway.

### Primary connected navigation no longer mixes fictional data

In VITE_DATA_MODE=api, App.tsx now renders ProductionModePage: supported domains lead to authenticated PHP records; connected knowledge and manual snapshots are available in the corresponding operations tabs; modules lacking real provider workflows show a clear unavailable state. It no longer renders fictional weather, sample listings, synthetic dashboard metrics or demo-only market results as operational information. Navigation reads the PHP production policy, not browser demo flags. Admin has real production module controls. The default static/mock build remains exactly the intended prototype.

Some connected pages currently share the internal operations workspace rather than possessing a final bespoke module interface. This is a transitional, transparent architecture choice pending domain-specific backend completion.

### Private farm fields linked to plant observations

MySQL creates UUIDv7 farm_fields with numeric existing user owner, district, village (optional), crop, hectares, active/archived status, timestamps and optimistic revision. GET/POST/PATCH routes under /api/v1/me/fields enforce farmer/FPO/admin authorization, staff review on mutations, owner-only access, CSRF, bounded validation, throttling, row-level locks and audit. Archived records are retained but no longer editable. No GPS or land-title data is collected by default.

The separate farm_field_case_links table associates private agronomy intakes with an active field owned by the same user. The field lookup and link insertion share a transaction. Foreign or archived field identifiers are rejected. Existing cases without a field remain valid. The farm UI supports creating, editing and archiving plots and selecting a plot in crop observation intake.

This does not establish legal land ownership, complete FPO tenancy, lab interpretation or expert diagnoses.

### Testing

The isolated MySQL regression checks 25 policy rows, admin-only changes, optimistic conflicts, disable cascade for modules 2/3/24, production route blocking, unrelated route continuity, CSRF, field ownership, field revision updates/archival and private agronomy links. Browser checks verify the production-mode Marketplace does not display fictional records and test farm field entry. PHP lint and static readiness inventory include the new files.

Record latest complete CI run before merge. No target Cloudways, live databases, or real provider integrations were exercised.

## Deployment gates

Migration 004 must be applied after 001–003 in an approved MySQL 8 maintenance operation with tested backup and rollback; the protected PHP application and schema must be versioned together because policy-missing routes fail closed. The static DigiOps package never migrates MySQL. CI initializer explicitly refuses any database that does not have a _test suffix.

Before live activation: exercise same-origin cookies and CSRF on Cloudways, confirm trusted proxies, database permissions, module-policy rows, source data privacy, tenant/owner access, security headers, logging/monitoring, backup restore, disaster recovery, performance and desktop/mobile acceptance.

## Explicit unfinished major architecture gaps

1. Email/phone possession verification, account recovery and MFA: NOT IMPLEMENTED. Current verified_at means manual staff review only, not verified contact ownership.
2. Complete FPO organization membership and tenant boundary: NOT IMPLEMENTED. Current field records are user-scoped; multi-member organizations require invitation/approval/revocation and cross-tenant tests.
3. Official live APMC/IMD/schemes data and freshness monitoring: NOT CONNECTED; manually reviewed snapshots only.
4. Legally verified pesticide product registration, crop-use labels, manufacturer compatibility and qualified agronomist review: NOT CONNECTED.
5. Real OCR, evaluated multilingual AI and assigned expert responses: NOT CONNECTED.
6. Payments, real verified stock, tax invoices, transport bookings, delivery, disputes and settlements: NOT CONNECTED.
7. Email/WhatsApp provider workers, durable send retries and delivery reports: NOT CONNECTED.
8. Full 25-module business lifecycles: many modules still consist of educational samples, calculated planning tools and protected draft forms. They require specialized backend resources and independent acceptance.
9. Production-wide feature policy still needs additional route mappings whenever new modules gain production endpoints; the policy does not replace service design or regulatory/legal acceptance.
10. Independent hosted security, load, backup and operational acceptance: NOT PERFORMED.

## Recommended continuation

M28: finish code review and green CI, preserve draft dependency on M26.
M29: contact verification, recovery and MFA, then FPO tenancy/roles and farmer plots.
M30: source-provider integration and provenance rules for mandi, weather, schemes and agricultural inputs.
M31: true trade and service fulfillment using authorized providers, with security and legal approval.
M32: evaluated OCR, grounded AI and consented notification workers.
M33: domain-by-domain acceptance for all 25 modules, independent security/Cloudways validation and deployment controls.

A passing CI check establishes candidate-code correctness for tested cases only. It does not authorize live release or certify all modules complete.
