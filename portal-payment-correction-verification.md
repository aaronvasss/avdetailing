# Payment safeguard correction — October 25, 2026

## Status
Prepared and verified locally, not released. No production database inspection or writes, historical edits, deployment, publication, real customer data, card sessions, charges, refunds or notifications.

## Corrective migration
`scripts/pending-migrations/portal_payable_balance.sql` is staged outside the managed migration journal to avoid automatic production application. It was applied only to disposable PostgreSQL on loopback port 55439. Submit this SQL through the managed migration tool only after release authorization.

Adds service-only `portal_booking_balance(uuid)` and replaces `guard_portal_charge_reservation()` calculation, without removing the existing trigger, ownership, approval, booking/authorization locks, uniqueness, audit or settlement protections. No historical rows are changed.

`card-wallet` balance/quote/authorize/charge use this RPC. Appointment details consume its verified balance; the saved-card control validates the response and refuses an amount differing from the displayed balance. Status-only deposits never create inferred credits. Ambiguous records, owner/currency conflicts, unresolved quotes, checkout-only identities and refunds require review.

## Isolated database evidence
Thirty real PostgreSQL integration checks passed with fictional fixtures and original reservation uniqueness, pending-ledger guards, authorization guard and original charge audit trigger.

| Fixture | Result |
|---|---|
| Saved payable $145.18, no payments | $145.18 reservation accepted, $0 additional fee |
| Approval for old fee-added $150.26 | Rejected |
| Saved $500, verified $100 deposit, stale booking deposit $999 | $400 due; stale field ignored |
| Saved $500, pending/failed $100 deposit | $500 due |
| Deposit-paid status without ledger evidence | Review; reservation rejected |
| Saved $500, $100 deposit + $150 partial | $250 due |
| Same deposit intent twice plus matching quote | Credited once; $400 due |
| Conflicting duplicate, quote-only deposit, missing metadata, refunds or currency/owner conflict | Review |
| New payment after amount approval | Old approval rejected |
| Paid or fully credited appointment | $0 due; no new charge |
| Simultaneous reservations | Exactly one winner and one durable reservation |

Pending charges block ledger/quote edits and authorization changes. Winning reservations retain the original audit record. Direct authenticated callers cannot invoke the balance RPC.

Run `python3 scripts/test-portal-payment-db.py` against an initialized disposable database using the named local role/port; it rebuilds only its explicitly loopback fixture schema. Managed production environment variables are never used for its connection. Bootstrap roles must include anon, authenticated and service_role.

## Mocked browser evidence
Six desktop/375px/390px checks passed: appointment total and saved-card balance both $145.18; ambiguous history displays Needs review with no approval action. No runtime errors or horizontal overflow; screenshots inspected. Auth, card-wallet and record responses were intercepted; no real services exercised.

## Release order, only after authorization
1. Freeze new portal balance-charge attempts during the coordinated backend update. The old endpoint and new safeguard must not coexist for charge attempts.
2. Apply the staged correction with the managed migration tool; verify RPC grant and trigger presence in the deployment environment.
3. Deploy matching `card-wallet`; confirm the already-required atomic `settle_portal_charge` function and `stripe-webhook` settlement implementation are present/matching. Their amount contract remains unchanged; no new settlement migration is staged here.
4. Run approved hosted smoke checks, then publish matching `BookingDetailsDialog`, `AppointmentPaymentApproval`, balance response validator and summary changes. Enable portal charging only once matching backend and website are active.
5. Appointment action/email/recovery releases are independent outstanding dependencies from the wider readiness report, not deployed here.

No new secrets or provider settings are required. Until deployment, hosted card-wallet lacks the new balance response; unreleased UI fails closed instead of guessing. Rollback must disable portal charging and keep the corrected safeguards; never revert to the duplicate-fee guard or silently rewrite approvals/history.

## Remaining verification gaps
Production data compatibility is intentionally uninspected. Legacy NULL-owner, quote-only, session-only, mixed-type duplicate or refund evidence remains manual-review-only, not guessed or rewritten. The disposable schema mirrors payment-relevant fields/constraints, not the entire hosted RLS stack. Actual Stripe creation/settlement/retry behavior, hosted authentication, deployment grants, delivery and end-to-end production audit readback remain unverified. Isolated tests reserve fictional database rows only; no payment provider is contacted.