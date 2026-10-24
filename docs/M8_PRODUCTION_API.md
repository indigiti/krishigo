# M8 — Custom PHP multi-user service candidate

Status: **code implemented as an opt-in production candidate; not deployed or approved for real user traffic.** Existing DigiOps staging release is unchanged. No Laravel and no staging database.

## Separation and purpose

The existing React web app is still compiled with `VITE_DATA_MODE=mock` for DigiOps. The entire PHP production service is excluded from that static release. `VITE_DATA_MODE=api` enables the isolated **Connected Operations** React workspace and a same-origin PHP backend (provided separately). Current demo modules remain demos even when API mode is on; they are not represented as live trading experiences.

### Four backend layers

| Layer | Files | Responsibilities |
| --- | --- | --- |
| Presentation | `apps/web/src/features/ProductionWorkspace.tsx` | Accessible form flows, separate loading/error states, no permission decisions |
| Frontend Infrastructure | `apps/web/src/infrastructure/productionApiClient.ts` | Credentials-included HTTP, CSRF rotation, typed API calls and abort timeouts |
| PHP Application/Domain | `apps/api-php/src/Production/Api.php`, `Validation.php` | Server role/owner rules, registration, moderation, validation, crop case privacy |
| PHP Infrastructure | `Repository.php`, `Connection.php`, migrations | Prepared SQL, HMAC-throttling, MySQL connections and schema |

### Available real persistence candidates

- Unique-email account registration with hashed passwords; individual cookie-backed sessions; CSRF token generation and origin checking; login/logout; normalized role attributes; database-backed rate limiting.
- Produce listings created as `pending_review`, public queries only show published listings, sellers can see their own.
- Buyer requirements similarly reviewed and published; FPO membership role supports both supplier and buyer workflows.
- Owner-specific stored buyer enquiries on published listings, with quantity/ownership checks. No payment or outbound notification is performed.
- Community posts moderated before public visibility, admin/editor review actions and audit events.
- Private Plant Care symptom and growth-stage records. **No image uploads, machine vision inference, diagnosis, treatment prescriptions or AI service.**
- Manual admin attestation endpoint for externally checked account identity; owner verification required before publishing commercial listings. It is not a substitute for a robust evidence-validation workflow.

### Immutable staging boundaries

- `KRISHIGO_API_MODE` defaults to the existing database-free staging router; all business writes remain `501 writes_disabled_in_staging`.
- Set `KRISHIGO_API_MODE=production` only in a different backend application after provisioning a private MySQL database, migration review, TLS and session protection, and a separate acceptance cycle.
- A production-mode request returns `503 service_unavailable` unless the required MySQL DSN, user and rate-limit salt are configured.
- `apps/api-php` must never be included in DigiOps `digiops-release` public/static payload. Keep source, environment and database private.

### Tests / gates

- Offline: 6 staging HTTP tests; production fail-closed test; unit and browser checks on mock UI.
- CI integration job starts an isolated MySQL 8 instance, applies migration to `krishigo_test` only, verifies multi-actor ownership, session and CSRF, approval rules, moderation audit transitions, privacy and enquiry creation.
- Follow-on acceptance must include a connected UI browser run on a protected non-production HTTPS host, real Cloudways headers and proxy checks, load testing, backups/rollback, independent security review, identity recovery/MFA, verified information sources and notifications.

### Deployment caution

**Not deployable as a public production business system yet.** Backend hosting must support PDO MySQL and durable secure sessions, and be reviewed for rate-limiting across multiple servers. An admin may verify accounts only after checking identity evidence by an approved offline process, recording the reason. Until that process is approved, leave commercial publication disabled. No live medical/agronomic advice is served.
