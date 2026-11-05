# KrishiGo — Farmer commerce, agricultural knowledge and field operations

**Authoritative development status:** [KNOWLEDGE.md](KNOWLEDGE.md)

KrishiGo is a PHP-first, React-based agricultural ecosystem for farmers, buyers, FPOs, service providers and editors. The initial regional focus is Maharashtra, with India-wide architecture and Marathi/Hindi/English localization goals.

## Current source status

- **M1–M15:** merged into main; 25 demo module workspaces with module-specific protected JSON draft contracts and six deeper workflow pilots.
- **M16–M18:** crop protection and plant nutrition workflows, 42 educational starter guides, moderation and in-app demonstration notices. On [draft PR #16](https://github.com/indigiti/krishigo/pull/16), not merged into main.
- **M19:** 24 operational field tools in draft PR #17; all PHP/web/browser CI checks passed on M19.
- **M20–M25 candidate:** source-reviewed knowledge articles, owner-scoped MySQL farm data, manually reviewed source snapshots, provisional quote/order records, safe source-only search, manual label intake, in-app consent, M25 offline readiness report and isolated MySQL testing. In draft PR #18, based on M19; not merged or deployed.
- The standard DigiOps release remains static/demo; **no live DB, trade, AI diagnosis, payments, external alerts or official input registration verification is implied**.

## Run the web UI

    cd apps/web
    npm ci
    npm run dev
    npm test
    npm run build
    npm run test:e2e

The front-end is React 19 / TypeScript / Vite with Forest, Sand and Night themes. Module tools perform local calculations or planning; all sample commercial, financial, weather and agricultural values are illustrative.

## PHP architecture

Custom PHP (no Laravel) is under apps/api-php. The default staging API uses fictional fixtures; the separately configured protected JSON pilot supports private role-gated draft workflows with session/CSRF protections. A production-candidate MySQL API is present in isolation but **must not be activated without dedicated approval and launch hardening**.

See:
- [Architecture and overall plan](docs/KRISHIGO_MASTER_PLAN.md)
- [Protected PHP runtime](docs/M14_PROTECTED_JSON_RUNTIME.md)
- [25 module form contracts](docs/M15_MODULE_CONTRACTS.md)
- [Agricultural input workflow scope](docs/M17_AGRI_INPUTS_P1_P4.md)
- [Crop, pest, disease and nutrient knowledge](docs/M18_AGRI_KNOWLEDGE_LIBRARY.md)
- [M20–M25 platform candidate and launch gates](docs/M20_M25_PLATFORM_FOUNDATIONS.md)

## Engineering policy

- Keep all 25 modules on one modular architecture; prefer reusable validated workflow tools over duplicate dashboards.
- Preserve static demo as the default; protected JSON backend must be explicitly enabled on an approved host.
- Never present unverified crop diagnoses, pesticide dosages, source registrations, mandi rates, weather warnings or government scheme eligibility as factual.
- Real production workflows require verified data sources, roles/ownership, consent, legal reviews, audits, performance and deployment acceptance.
- Log module status, tests, blockers and milestone evidence in **KNOWLEDGE.md**. Do not confuse passing CI with real host deployment.
