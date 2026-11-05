# M17 — KrishiGo Inputs Intelligence: P1 to P4

Status: IMPLEMENTED AS PROTECTED JSON STAGING WORKFLOWS. Not production-launched.

## P1: Catalogue / search / editorial verification
Module 11 now includes an educational input-categories UI, curated Marathi and Hindi search aliases, category and composition comparison, and server-side staging catalogue/evidence collections. Editors and administrators review pending records with a mandatory reason and stored reviewer/time. Search only indexes reviewer-approved-demo records with submitted HTTPS sources. Source review does not establish regulatory approval, label validity or correct crop uses.

## P2: Farm + Plant Doctor
Direct navigation links from Plant Doctor and Crop Journal connect to the input hub. Privately owner-scoped JSON collections record soil test observations, application history, proposed nutrient plans and consultation requests. These are staged farm records, not diagnoses, calculated application prescriptions or real expert referrals.

## P3: Supplier / manufacturer operations
Staging supplier profile, licence-evidence, stock/price-offer and enquiry contracts exist and are role-gated. They do not verify a licence or contact a dealer. Payments, subscriptions, real inventory feeds, notifications and retail transactions remain disabled.

## P4: Advanced intelligence
Label image preview remains on-device in demo, with protected OCR/manual transcript-review intake available in opt-in JSON staging. No OCR engine or image upload service exists yet. Source-grounded lexical search is deterministic and citation-linked, not generative AI. Source-reviewed regulatory notice and batch recall drafts can be queried, but no live regulator-feed polling or actual alert delivery is active.

## Protected PHP endpoint summary

Private staging paths (same-origin /api/v1/staging/inputs):
- GET capabilities and schemas
- GET/POST records/{kind} (with ?mine=1 for private owner records)
- GET admin/{kind}, POST admin/{kind}/{id}/review
- GET search?q=term and assistant?q=term (reviewed-demo source results only)
- GET alerts?batch=ID (reviewed-demo exact batch notices only)

The code enforces staging authentication, CSRF, explicit module-11 activation, role restrictions, bounded private JSON storage, atomic locking and idempotency. The staging account is a single configured identity and cannot provide genuine multi-user or tenant isolation. No live user data should be loaded.

## Secure pilot activation

Default DigiOps release remains static and database-free; never silently enable these endpoints. The separate protected pilot bundle includes the new API source files. Verify Cloudways PHP routing, HTTPS/proxy headers, session cookies, durable private storage outside web root and rollback before enabling:

KRISHIGO_API_MODE=staging
KRISHIGO_STAGE_AUTH=enabled
KRISHIGO_JSON_WORKFLOWS=enabled
KRISHIGO_JSON_STORE_DIR=<private writable folder>

Build a separate React pilot with:

VITE_JSON_WORKFLOWS_MODE=api
VITE_JSON_API_BASE_URL=/krishigo/api/v1
VITE_DATA_MODE=mock

Do not use real farmer images, identity documents, supplier licences or sensitive laboratory data in this staging pilot.

## What is NOT complete for production

- Real CIBRC pesticide registration/label matching, current FCO product conformity verification, expert-validated agricultural instructions and truly verified sourcing
- Professional English/Marathi/Hindi translations across every product record
- Production database multi-tenant persistence, verified identities, moderation, audit exports, deletion and retention
- Actual OCR processor, upload scanning, model confidence and human verification
- Generative AI retrieval system grounded exclusively in verified current documents
- Authorized monitoring connectors for official regulatory/recall feeds
- Verified dealer stock, licensing and price freshness; paid business subscriptions, payments and live trade
- Opt-in email/WhatsApp notifications with delivery receipts
- Live Cloudways browser, security and performance acceptance

CI covers only the repository staging flows. Passing CI is not evidence of real-life regulatory compliance or deployment.
