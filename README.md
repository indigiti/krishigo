# KrishiGo — Farmer commerce, agricultural knowledge and field operations

**Authoritative development status:** [KNOWLEDGE.md](KNOWLEDGE.md)

KrishiGo is a PHP-first, React-based agricultural ecosystem for farmers, buyers, FPOs, service providers and editors. The initial regional focus is Maharashtra, with India-wide architecture and Marathi/Hindi/English localization goals.

## Current source status

- **M1–M25:** source-code foundations consolidated on main via PRs #16, #17 and #18, including 25 demo module workspaces, M18 agricultural knowledge, M19 field tools, and M20–M25 opt-in PHP/MySQL candidates.
- **M26:** guided authenticated farmer-to-buyer lifecycle, draft PR #19. CI passed, but not yet merged or deployed.
- **M27 audit:** all 25 modules and their advertised features were inspected; see [deep feature audit](docs/M27_DEEP_25_MODULE_FEATURE_AUDIT.md). Most modules have L1/L2 functionality and only selected capabilities have partial L3 workflows. No L4 live service is independently accepted.
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
- [M27 full 25-module feature-depth audit](docs/M27_DEEP_25_MODULE_FEATURE_AUDIT.md)

## Engineering policy

- Keep all 25 modules on one modular architecture; prefer reusable validated workflow tools over duplicate dashboards.
- Preserve static demo as the default; protected JSON backend must be explicitly enabled on an approved host.
- Never present unverified crop diagnoses, pesticide dosages, source registrations, mandi rates, weather warnings or government scheme eligibility as factual.
- Real production workflows require verified data sources, roles/ownership, consent, legal reviews, audits, performance and deployment acceptance.
- Log module status, tests, blockers and milestone evidence in **KNOWLEDGE.md**. Do not confuse passing CI with real host deployment.
