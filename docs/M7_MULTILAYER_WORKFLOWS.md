# M7 — Multi-layer, fast, connected KrishiGo workflows

## Delivery summary

M7 expands the M6 **all-25-module interactive showroom** with cross-module
workflow orchestration. It does **not** implement permanent accounts, verified
trading, a real AI diagnosis, or a production database.

### Layer ownership

| Directory | Responsibility | Must not contain |
| --- | --- | --- |
| `apps/web/src/domain` | Workflow entities, action union types and status definitions | React, HTTP, storage |
| `apps/web/src/application` | Pure input validation, invariants, state transitions | `fetch`, cookies, React, MySQL, browser storage |
| `apps/web/src/infrastructure` | Repository interface, current in-memory adapter, subscription contract | Agricultural treatment logic, implicit publication |
| `apps/web/src/features` | Accessible forms, visual workflow views, user feedback | Authoritative role checks, database queries |
| `apps/api-php` | Future source of truth for identity, trades, moderation and plant cases | Browser-trust authorization |

### Connected demonstrations implemented

1. Farmer drafts a lot -> requests **sample** review -> simulates review.
2. Buyer drafts a requirement -> validates the same crop -> drafts an **unsent** enquiry capped by available and required quantities.
3. Community member drafts a question -> flags a draft for **simulated** moderation.
4. Farmer records symptoms -> prepares an **unsubmitted** agronomist referral. **No diagnosis or chemical recommendation** occurs.
5. Farmer drafts service requirements without booking/contacting suppliers.
6. All 25 module workspaces share a temporary, in-tab draft repository (survives navigation, resets on refresh).
7. Activity panel traces only local demo events; it is **not an audit ledger**.

### Performance and maintainability

- Lazy-loads Trade Desk, Review Desk, Onboarding, extended Workspaces and Workflow Hub to avoid shipping all secondary views with the initial route.
- Allows Vite/Rollup to generate route-aware chunks instead of forcing every dependency into one `vendor` chunk.
- Adds a CI build-budget gate for gzip transfer weight (total JS <400 KiB, CSS <90 KiB, individual asset <200 KiB).
- Bounded in-memory activity feed (100 entries), no localStorage, IndexedDB, cookies, network writes, or image uploads by the new workflow module.
- Leaves DigiOps public path `/krishigo/`, artifact `digiops-release`, and staging noindex/headers unchanged.

**Important:** Bundle budgets are not a measured performance guarantee. Verify real mobile CWV LCP <=2.5s, INP <=200ms, CLS <=0.1 after deployment.

### API production integration plan (M8+)

The repository adapter must be replaced with **authenticated custom PHP APIs**, never direct database access from React. Plan domain endpoints:

- `POST /api/v1/lots` (authenticated farmer; validated unit, quantity, rate, location, ownership)
- `POST /api/v1/lots/{id}/review-request` (ownership, idempotency key, auditable status)
- `POST /api/v1/buyer-requirements` (verified buyer)
- `POST /api/v1/enquiries` (verified accounts; race-safe quantities; anti-spam; immutable event)
- `POST /api/v1/community/posts` and `/reports` (spam, permissions, content moderation)
- `POST /api/v1/plant-cases` and `/expert-referrals` (consent, retention, private media, reviewed guidance)
- `POST /api/v1/service-requests` (provider validation and notification permission)
- `GET /api/v1/activity` (read authoritatively scoped events, not browser history)

Any real write must have server-side auth and authorization, CSRF for cookie sessions, validation, request size limits, safe file handling, idempotency, abuse prevention, transaction boundaries, audit logs and testable rollback. Actual MySQL persistence is a separate approved production milestone; none is needed for staging.

### Acceptance gates

- Unit tests exercise full draft → sample-review → unsent enquiry state machine and failures.
- UI staging tests ensure there are no network POSTs and check desktop + 390px mobile.
- Production build must pass React/TypeScript, bundle budgets, DigiOps packaging, backend fixture API tests and browser CI.
- Keep DigiOps deployment #22 untouched until the new branch is reviewed and a full green `main` release exists.
