# Recoverable owner cancellation/rescheduling alerts

## Result
Prepared locally; no production migration, configuration change, deployment, publication, appointment changes, or real messages.

- Cancellation and rescheduling now use a service-only transactional compare-and-set operation that saves the appointment and immutable owner alert together. Existing ownership/capability validation, policy/availability checks, booking triggers and financial guards remain active.
- Stable event key = action + booking ID + prior stored revision. Each channel/recipient has one durable delivery row. Concurrent writers or repeated requests cannot enqueue the same change twice.
- Dispatcher claims with row locks and SKIP LOCKED, unique leases, and durable send intent. A crashed processor can be replaced after the five-minute lease. Old leases cannot complete recovered work.
- Existing content builders, configured recipients, Resend sender and Twilio settings are reused. No customer interface or message wording changed.
- Email/SMS record independent outcomes and provider IDs. Existing notification logs record attempts; dispatcher errors go to the existing error logging system. `failed` and `needs_review` remain queryable for follow-up; no new admin retry interface added.

## Verification
**24 isolated PostgreSQL + mocked-provider checks passed.** Dedicated disposable `owner_alert_test` database on explicit loopback connection; no managed environment connection or customer data used.

Verified atomic change/enqueue, interrupted processing after commit, duplicate events/requests, concurrent writers and disjoint processor claims, lease expiry before sending, email failure with successful SMS, definite SMS rejection with successful email, exact five-attempt cap, six-hour window, lost email result with stable provider key, uncertain SMS/manual review, interrupted SMS send intent, stale leases, owner/capability mismatch, queue-insert rollback including audit, payment preservation, service-only access, wake-on-enqueue, drain disarming, future retries without early wake, and failed wake retaining an armed timer.

**246 regression tests passed across 25 files**, including customer policy rules, signed-out secure email actions, atomic enqueue, saved prices, dates, recovery and owner destination authorization. Preview build OK.

The local scheduler uses stand-ins for `pg_cron`/`pg_net` to test actual scheduling SQL. Hosted scheduler execution, credentials, provider network behavior and inbox/handset delivery were not exercised. Provider success here means accepted, not delivered/read. No browser run needed: presentation is unchanged, and provider requests were intercepted in the database integration tests.

## Retry and duplicate-delivery limits
- Maximum five claimed attempts per channel and six hours from event creation; rejection retries after 1, 5, 15 and 60 minutes, with at most one additional minute until the active timer fires. Expired claims count toward the bound.
- Resend: 429, 5xx and uncertain network outcomes retry with the same delivery-row idempotency key. Six-hour replay window stays below the provider's documented 24-hour idempotency retention. Actual provider retention/behavior remains unverified here; end-to-end exactly-once delivery cannot be guaranteed.
- Twilio: definite HTTP 429 rejection retries. HTTP 5xx, timeout, lost response, or a crash after send intent become `needs_review`; no automatic resend because acceptance may already have occurred. An interrupted SMS send before the network call may also conservatively require review. Inspect provider message history before any manual recovery. No new duplicate-risk retry button is supplied.
- A provider success followed by an unrecorded database result leaves recoverable durable send intent. Email can replay safely within its bounded key window; SMS is held for review. Successful channels never resend while the other channel retries.
- Queue insertion failure aborts the transaction: there is no successfully saved appointment change without its durable alert. Subsequent dispatch/logging failures cannot undo committed changes.

## Release requirements and order (not performed)
1. Pause customer cancellation/reschedule writes briefly during cutover so the old immediate sender cannot create unqueued changes. Do not pause public reads or payment safeguards.
2. Apply `scripts/pending-migrations/owner_alert_outbox.sql` using the managed migration tool. New tables have service-only grants, enabled RLS and no customer/anonymous policies. Keep the migration staged outside managed history until authorized.
3. Release `process-owner-alerts`, `reschedule-booking`, and `cancel-customer-booking` with their `_shared` modules and unchanged content builders together. Both client-space and secure email-link actions reuse these writers. No customer email sender, recovery function or website publication is required for this change.
4. Confirm hosted `pg_cron` and `pg_net` availability and existing private `portal_scheduler_credentials` access. Configure `owner_alert_dispatch_config` with the deployed HTTPS dispatcher URL and `enabled=true` through a separate authorized configuration write. No secret is embedded in cron definitions; callbacks load the existing private credential. Do not expose it to customers.
5. Invoke `tick_owner_alert_dispatch` through privileged access to arm any already-pending work, then verify private callback authentication, claims, logs, channel outcomes and drain behavior using authorized test data/providers before reopening writes.

The retry timer runs once per minute **only while pending work exists**, unschedules on drain, and wakes immediately on enqueue. At most 1,440 timer checks/day if work remains pending continuously; normally far fewer. This cadence gives retries roughly one-minute wake latency and may increase Cloud costs while work is pending; there is no permanent idle sweeper.

If scheduler extensions/configuration are missing or the timer cannot be armed, alerts still remain durable but require privileged recovery after configuration repair. Release must verify this before enabling new writers. Roll back by pausing writes/dispatch, keeping outbox rows and safeguards, correcting the worker and resuming the same durable events; do not restore immediate sending for queued changes or blindly replay uncertain SMS.