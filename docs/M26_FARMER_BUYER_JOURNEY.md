# M26 — Farmer-to-Buyer Operational Journey

Status: feature/m26-farmer-buyer-lifecycle. NOT merged or deployed. No real payments, messages, booking or verified inventory.

## Internal end-to-end experience
1. Farmer/FPO registers and creates a produce lot, initially pending independent editorial approval.
2. A buyer discovers approved lots and submits a quantity-scoped enquiry; no external contact or message is sent.
3. The seller sees an owned enquiry and offers a time-limited provisional quote.
4. The recipient buyer accepts or rejects. Acceptance locks the listing row and checks existing reserved quantities before opening an internal order.
5. Seller confirms the provisional order record. It does not initiate payment, freight or contract fulfilment.
6. Either participant may cancel an awaiting or internally confirmed record with an explanatory reason, releasing internal reservation within the same transaction.
7. Only the buyer/seller may retrieve the order timeline. Anonymous/nonparticipant requests fail.

## Schema and PHP API
Optional schema 003_trade_lifecycle.sql adds append-only trade_activity (UUIDv7 event IDs, quote and order references, actor, timestamp).
Existing numeric user/listing/enquiry IDs and UUIDv7 quote/order IDs are preserved.

New candidate-only routes:
- GET /api/v1/trade/dashboard: public moderated lots, caller-owned listings and participant-scoped enquiries, quotes and orders; bounded lists.
- GET /api/v1/trade/orders/{uuidv7}/timeline: participant-only history of listing/enquiry, offer, decision, confirmation and cancellation.
- POST /api/v1/trade/orders/{uuidv7}/cancel: verified participant, CSRF, reason, row locks, audit and reservation release.

Existing M23 quote creation, acceptance/rejection and seller confirmation now record activity in their write transaction.

## UI
Connected Operations → Farmer–Buyer Trade contains lot discovery, inline enquiry, incoming requests, quotes, acceptance/rejection, order confirmation/cancellation and a readable history. The old manual-ID quote and order forms are replaced. Supplier onboarding stays separate.

## Verification gates
Isolated MySQL CI covers dual-buyer competition, overbooking prevention, cancellation release, repeat cancellation, source audit, cross-account privacy, role checks and CSRF. Desktop/mobile browser tests exercise the production-mode frontend with mock API responses.

No MySQL schema is applied to live Cloudways. Public static/demo mode stays unchanged. No vendor KYC, statutory licences, real stock, deliveries, payments, real notifications or enforceable contracts are implemented. A successful CI run alone never certifies production launch.

## Dependency incident
Post-consolidation main CI failed npm resolution due to floating @playwright/test ^1.58.0 resolving an unpublished playwright-core 1.65.0. M26 pins the stable 1.64.1 release; the final CI must pass before integration.

This document supplements, but does not replace, the canonical root KNOWLEDGE.md tracker.
