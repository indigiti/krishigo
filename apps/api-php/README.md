# KrishiGo PHP API (scaffold only)

This is a **Custom PHP 8.3+ API scaffold** for the later Cloudways deployment. No Laravel, Composer dependencies, database, user sessions or credentials are required to inspect it.

Available read-only routes:
- `GET /healthz`
- `GET /api/v1/status`

All planned marketplace, buyer, community, content and plant-care endpoints return HTTP 501 *Not Implemented* on purpose. No form submission, user authentication, financial transaction or plant diagnosis is active.

## Local smoke check

```
php -l public/index.php
php -S 127.0.0.1:8080 -t public public/index.php
curl -i http://127.0.0.1:8080/api/v1/status
```

**Not for public deployment as a completed API.** M2 must add service tests, HTTPS-only secure session authentication, role permissions, CSRF protection, input validation, audit logs, strict upload controls, abuse prevention, authorization, migrations, and a production server configuration. The PHP entrypoint is separated from the React static frontend.
