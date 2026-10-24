# KrishiGo — implementation status and next engineering milestones

## Milestone M1 deliverables (current source)

- React 19 + TypeScript + Vite starting from the approved prototype.
- Existing dashboard, Plant Doctor, marketplace, community, mandi insights, three themes and mobile navigation.
- New buyer requirements board: filters, local demo draft creation, empty state and clear no-enquiry notice.
- New services directory: category selection and non-actionable sample cards.
- New crop journal: in-session observations, safe notes and no remote image uploads.
- New discover/catalogue page: complete 25-module roadmap + draft editorial cards.
- New staging operations screen: immutable mock-readiness summary, not a real administration backend.
- Marketplace demo listing composer; no permanent records or real buyer contact.
- Central typed `KrishiGoDataSource` read interface: mock now, contracted PHP API later.
- Custom PHP API scaffold returning health status and HTTP 501 for unimplemented writes/resources.
- Unit-level staging invariants and GitHub Actions workflow.

## M1 acceptance pending

- `npm ci`, `npm test`, `npm run build` in GitHub Actions (local sandbox cannot resolve npm registry).
- Browser interaction and responsive QA against actual compiled React application.
- Accessible language/locality preferences and production-quality localization strings.
- Real production PHP API is NOT implemented; use mock mode for UI review.

## M2 planned

Secure PHP API, CSRF/auth/RBAC, audit trail, validation, moderation, private media uploads, MySQL migrations, Redis cache, rate limits, queue processing and API contract tests. No Laravel.

## M3 and beyond

Live mandi data with official sources and freshness, weather, news editorial verification, farmer onboarding and local language coverage. Pilot plant screening only after tests on representative field imagery, confidence and ambiguity controls, and independent expert review. Capacitor mobile packaging follows successful PWA and security gates.

## Milestone M2 — database-free security/API integration (October 2026)

- Functional PHP read-only APIs serving the same fictional listing, community, procurement, service, content and 25-module fixtures as the frontend.
- Custom PHP request validation, HTTP security headers and opt-in HTTPS-only staging sessions.
- CSRF login/logout, session rotation and editor/admin authorization for fictional moderation records.
- Account/profile role preview for five target account types; roles never grant real browser-side permissions.
- Plant Cases: local photograph preview and temporary crop observation entries, without remote uploads or AI results.
- Python standard-library PHP HTTP integration suite and updated frontend tests/CI.
- **No database, real user identities, live trading, persisted moderation, or machine-learning crop diagnoses.**
- Production identity, audit trails, uploads and MySQL migration remain later milestones.

## M2 acceptance status

- Offline PHP HTTP tests: pass locally (sample fixture contracts, CSRF, session/login/logout, editor role, no write endpoints).
- Frontend source-level tests: pass locally.
- Actual `npm run build` requires a network-enabled environment because the sandbox cannot resolve npmjs.org; GitHub CI is the definitive verification before merge.
- Cloudways staging not deployed by this milestone.

## M3 — onboarding, trade details and moderation experience

- Three new responsive and theme-aware screens: onboarding wizard, Trade Desk and Review Desk.
- Marketplace opportunity buttons open the associated Trade Desk listing details.
- Structured buyer enquiry drafts remain **unsent** and in memory; no database, contact or transactions.
- Review Desk simulates moderation categories and decisions locally, without granting any permissions.
- PHP allowlisted `GET /api/v1/marketplace/listings/{id}` and role-restricted `GET /api/v1/admin/review-cases` only.
- Future onboarding, enquiry and review writes are explicitly blocked with HTTP 501.
- See [M3 production persistence plan](M3_PRODUCTION_PERSISTENCE.md) for the data model and implementation gates.

**M3 is staging development, not a live business API or Cloudways deployment.**


## Milestone M4 — staging reliability and browser acceptance

- Accessible responsive mobile marketplace search (previously hidden on small screens).
- Global demo-data warning on every screen, staging `noindex` and `robots.txt` packaging.
- Restrict Plant Doctor local preview file types to JPEG, PNG and WebP; no remote uploads or inference.
- Playwright smoke tests for 1440px desktop, 390px mobile, all 15 navigation destinations, theme switching, mobile search, overflow, console errors and no demo POST calls.
- GitHub CI runs web build, PHP tests, artifact validation, and browser tests before considering merge.
- Safe static ZIP packaging for protected Cloudways staging; **no live deployment, database or real services**.
- Detailed deployment, rollback and remaining gaps documented in `CLOUDWAYS_STAGING.md`.

## M6 — 25 module-specific interactive staging workspaces

- Discover opens a dedicated exercise workspace for each of the 25 catalogue modules.
- Tailored activity examples, module-specific draft inputs, saved ideas, checklists and honest disclaimers.
- Mock net realization calculator for mandi and price intelligence, using only user-entered amounts.
- In-memory demo state: no account, network mutation, permanent record, real data or AI diagnosis.
- Details and remaining production boundaries: [M6 Module Workspaces](M6_MODULE_WORKSPACES.md).
