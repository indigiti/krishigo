# M12 — Connected JSON staging and safe operations

The existing production-like code remains *dormant* and database installation is still deferred.

## What is available in the repository

- Six module-specific opt-in React flows in `JsonOperations` with validated PHP JSON endpoints: Marketplace, Buyers, Community, Plant Care, Services and Editorial.
- A protected editorial queue for simulated review, never real publication.
- A protected health/operations area reporting per-domain counts and controlled diagnostic jobs.
- All 25 module numbers have optional, private test-draft endpoints `/api/v1/staging/module-drafts/{id}` with `title` and `note`; this is an extension seam, **not** 25 completed production integrations.
- Diagnostic queue `/api/v1/staging/jobs` implements bounded atomic JSON storage, allowlisted `domain_snapshot` jobs, manual processing, expiry leases, at most three attempts, explicit recovery, and fail-closed corruption handling. No shell commands, network callbacks, messages, payments, or AI inference.
- Browser navigation remains lazy-loaded. Default static release does not enable any connected operation.

## Opt-in PHP JSON pilot deployment (separate from static DigiOps)

Provision a protected same-origin PHP staging route serving `apps/api-php/public/index.php`.
Keep source, sessions and `KRISHIGO_JSON_STORE_DIR` outside public web root, and configure HTTPS and a staging admin password hash. Use:

```text
KRISHIGO_API_MODE=staging
KRISHIGO_STAGE_AUTH=enabled
KRISHIGO_STAGE_ROLE=admin
KRISHIGO_JSON_WORKFLOWS=enabled
KRISHIGO_JSON_STORE_DIR=/private/staging/path
```

Only after verifying the API route and protection, compile a separate pilot UI with:

```text
VITE_DATA_MODE=mock
VITE_JSON_WORKFLOWS_MODE=api
VITE_JSON_API_BASE_URL=/krishigo/api/v1
```

These build variables **do not activate anything in the default DigiOps artifact**. Production authentication and multi-user account registration are NOT part of this staging pilot. The API relies on a single configured staging role and cannot safely simulate multiple real customer identities.

## API details

- `GET/POST /api/v1/staging/records/{marketplace|buyers|community|plant|services|editorial}`: read reviewed/public or private personal demo drafts; create with CSRF, fixed field schema and `Idempotency-Key`.
- `GET /api/v1/staging/admin/records/{domain}`: pending editorial queue; private plant notes deliberately excluded.
- `POST /api/v1/staging/admin/records/{domain}/{id}/review`: approve/reject simulation with role and CSRF checks.
- `GET /api/v1/staging/workflows/health`: protected per-domain record/pending/recovery counts.
- `GET/POST /api/v1/staging/module-drafts/{id}`: private validated draft contract for all 25 module switches. No public feed or external delivery.
- `GET /api/v1/staging/jobs`, `POST /api/v1/staging/jobs` with `{"kind":"domain_snapshot","domain":"marketplace"}`, `POST /api/v1/staging/jobs/process`, `POST /api/v1/staging/jobs/recover`: allowlisted manual diagnostics only.

## Recovery and performance scope

JSON workflows: fixed domain IDs, 500 records per domain, file locking, atomic replacement, valid last-good snapshot recovery, duplicate-submission checks and 503 on dual corruption.

Queue: maximum 100 retained diagnostic jobs, 3 jobs per manual process call, 3 attempts maximum; a lease can be recovered only after expiry or explicit failure, and only through administrator action. Queued jobs are read-only counts; real business effects are never auto-replayed.

`tools/benchmark_json_api.py` captures localhost PHP synthetic p50/p95/p99 latency and throughput in the GitHub runner. `e2e/performance.spec.ts` captures Chromium navigation/FCP/CLS evidence. **Neither measures Cloudways field LCP, INP, p95 response times, concurrency under load, or real devices**. Thus no superfast SLA is claimed.

## Open work

Application CRUD for the other 19 modules beyond generic draft contracts; verified India-specific feeds, real transactions, durable background integrations, identity/ownership verification, private media storage, retention/consent, penetration testing, real server performance and validated AI inference. Production and database activation require explicit approval.
