# Production PHP API contract (proposed, not implemented)

Base: `/api/v1`, versioned REST JSON. All production write endpoints require authenticated user, CSRF/session or device token, authorization, JSON schema validation, and rate limiting.

- `GET /health` — service status (no secrets).
- `GET /marketplace/listings?page=1&kind=Produce&district=Pune` — cursor/paginated listings; expose `verified` only from completed verification workflow.
- `POST /marketplace/listings` — authenticated publish + moderation.
- `POST /marketplace/listings/{id}/enquiries` — authenticated buyer enquiry.
- `GET /community/posts?cursor=...` — paginated moderated feed.
- `POST /community/posts` — authenticated post + moderation.
- `POST /community/posts/{id}/reactions` — authenticated reaction.
- `GET /mandi/prices?commodity=...&market=...` — include `source`, `report_date`, `verified_at`, `unit`, `currency`, `grade`.
- `POST /plant-care/cases` — consented photo upload and crop context, returns queued case ID; avoid blocking HTTP on model inference.
- `GET /plant-care/cases/{id}` — authorized status, differential possibilities, limitations, safer next steps, reviewer status and references.
- `POST /plant-care/cases/{id}/questions` — follow-up answers and triage.
- `POST /plant-care/cases/{id}/expert-referrals` — qualified agronomist referral workflow.

**Migration boundary:** `src/services/dataSource.ts` is the application repository boundary; swap mock fixtures for API calls without changing presentation components. Extend it to mutations, typed errors, pagination and auth after API implementation. Do not put DB credentials or Python service secrets in Vite environment variables.

**Security:** use PDO prepared queries, password_hash/password_verify, secure HttpOnly SameSite cookies, robust CSRF, verified image MIME and size, object-storage access controls, antivirus scanning as appropriate, moderation, audit logs, privacy/retention controls and tested backups.
