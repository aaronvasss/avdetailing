# GoHighLevel sync — Phase 1 plan (app → GHL, one-way)

This app stays the source of truth. GHL receives contacts, tags, one opportunity per booking, and the fields it needs to send its own follow-ups. Nothing customer-facing changes in this phase, and nothing is published.

## What you create in GHL before I build

1. **Private Integration token** for the AV Detailing sub-account. Scopes: contacts read/write, opportunities read/write, custom fields read, locations read. I'll ask for it as `GHL_PRIVATE_TOKEN` through the secure secrets form, together with `GHL_LOCATION_ID`.
2. **Pipeline "AV Detailing"** with stages in this order: New Lead, Quoted, Booked, Paid, Completed, Review Requested, Maintenance Member, Lost/Cancelled. I look up the pipeline and stage IDs by name at startup, so you don't need to send IDs.
3. **Contact custom fields.** Create these exact names; I map them by key.

| GHL field (create as) | Type | Source in this app |
|---|---|---|
| av_next_appointment | Text | Next pending/confirmed booking, Central Time, e.g. "Sat Nov 14, 2026 9:00 AM CT" |
| av_next_appointment_iso | Date | Same booking date |
| av_service | Text | Service + package name of next/latest booking |
| av_vehicle_type | Text | bookings.vehicle_type |
| av_vehicle | Text | year make model (or boat brand/length, aircraft type) |
| av_service_city | Text | bookings.service_city |
| av_manage_link | Text | Existing secure manage-booking link (same link already in customer emails) |
| av_last_service_date | Date | Latest completed booking |
| av_last_service_type | Text | Latest completed service name |
| av_lifetime_spend | Monetary | Sum of total_price on completed bookings |
| av_completed_visits | Number | Count of completed bookings |
| av_membership_status | Dropdown: active, cancelled, none | customer_memberships |
| av_utm_source / av_utm_medium / av_utm_campaign | Text | Left empty for now (see Questions) |

**Tags:** lead, customer, member, ceramic-client, aviation, rv, boat, paint-correction, cancelled, refunded.

**Never sent:** card data, Stripe IDs, internal or staff notes, worker pay, photos, raw manage tokens outside the link, gate codes or paint-sensitivity notes.

## Messaging switch (planned now, default OFF)

I'll add one admin setting: "Let GHL send customer follow-ups." While it's OFF (the default), nothing changes. When it's ON, these app senders skip customer messages and log that they skipped:

- **send-reminder-sms** and the hourly reminder scheduler that calls it: appointment reminder SMS and email.
- **send-review-request**: review request SMS/email on completion, from the worker job card and admin.
- **send-booking-sms**, customer recipient only: the booking confirmation text sent from the booking page, the post-payment text from stripe-webhook, the admin overview text, and the "on my way" texts from the worker job card and booking details.
- **send-sms**, customer messages from the worker job card: in-progress and completed texts.

**Not covered, so they keep running:**
- Customer confirmation emails from process-booking-notifications (Resend).
- Password and account emails.
- All owner alerts.
- Admin's manual one-to-one Messages tab (send-sms from AdminMessagesTab).

**Question:** should the booking confirmation SMS count as a "confirmation" and stay in the app?

## Database (one migration, additive)

- **`ghl_sync_events`**: the outbox. Columns: id, event_key (unique, so the same event is never queued twice), kind, booking_id, contact_email, contact_phone, payload jsonb, created_at.
- **`ghl_sync_deliveries`**: status, attempts, next_attempt_at, lease_id, lease_until, last_error, ghl_contact_id, ghl_opportunity_id, synced_at. Same lease/retry shape as owner alerts. Locked with no client access.
- **`ghl_links`**: ghl_contact_id per email/phone and ghl_opportunity_id per booking, so the same GHL records are updated each time instead of duplicated.
- **`ghl_sync_config`**: function URL, enabled flag (OFF until rollout), and customer_messaging_via_ghl flag (OFF).
- **Admin read RPC `ghl_sync_status()`**: returns counts, last success and recent failures, checked server-side for admin. Plus **`ghl_retry_failed()`** for admin.
- **Service-only RPCs `claim_ghl_deliveries` and `finish_ghl_delivery`**, modeled on claim/finish_owner_alert.
- **Wake and retry timer**: reuses the existing private scheduler credential and the wake-on-enqueue plus self-disarming retry pattern from owner alerts.

### Where each event is enqueued

Database triggers queue the event in the same transaction as the change. Every path (customer, admin, worker, Stripe, functions) is covered with no app-code edits, and a GHL outage can't fail the save.

| Event | Trigger point | Current writers it covers |
|---|---|---|
| Inquiry submitted | AFTER INSERT on `contacts` | InquiryForm.tsx and ContactPage.tsx inserts |
| Booking created | AFTER INSERT on `bookings` | create-booking (public, portal, admin internal) |
| Paid / deposit paid | `bookings.payment_status` changes to paid or deposit-paid | stripe-webhook checkout/payment handlers, settle_portal_charge |
| Rescheduled | `scheduled_date`/`scheduled_time` change | commit_owner_appointment_change, admin edit |
| Cancelled | status changes to cancelled | cancel-customer-booking, cancel-booking-public, admin |
| Completed | status changes to completed | admin tabs/calendar, worker job card |
| Rating submitted | AFTER INSERT on `booking_ratings` | submit-rating |
| Membership started / cancelled | `customer_memberships` insert, or status change to/from active | stripe-webhook subscription.created/updated/deleted |
| Refund | `payment_records.status` changes to refunded or partially_refunded | stripe-webhook charge.refunded |

## Functions

- **New `ghl-sync`:** a worker called only by the scheduler, authenticated with the private credential. Each run it:
  - Claims a batch of up to 10.
  - For each event: searches for the contact by email, then phone (`/contacts/search/duplicate`), then updates or creates it.
  - Recomputes custom fields from current database rows rather than the event snapshot, so fields are always correct.
  - Adds tags and moves or creates the booking's opportunity: stage plus value = total_price.
  - Records the result. It retries with backoff on 429/5xx (honoring Retry-After), and stops after 8 attempts as failed, visible to admin.
- **New `ghl-backfill`:** admin-only and server-verified. Modes:
  - `dry_run` returns counts and a sample mapping, sending nothing.
  - `run` queues backfill events in pages, with event_key `backfill:<booking_id>`, so re-running it is safe. Rate is handled by the worker batch.
- **`_shared/ghl.ts`:** API v2 client (base `services.leadconnectorhq.com`, Version header), field mapper and stage resolver.
- **Messaging switch:** a small `_shared/customer-messaging.ts` check added to the four senders listed above. It changes nothing while OFF.

## Stage rules (one opportunity per booking)

- Inquiry → New Lead. This is a contact-level opportunity until a booking exists; the first booking from that contact then becomes the booking opportunity.
- Aircraft or quote request → Quoted.
- Booking created → Booked. Paid → Paid. Completed → Completed. Rating submitted, or review request sent → Review Requested.
- Booking linked to an active membership → Maintenance Member.
- Cancelled → Lost/Cancelled. A full refund also goes to Lost/Cancelled; a partial refund keeps the stage.
- A stage only moves forward, except to Lost/Cancelled, so retries arriving out of order can't move a booking back.

## Admin view

A new "GHL Sync" card in the existing admin area shows:
- whether sync is enabled, the last successful sync and today's queued/sent/failed counts
- the last 20 failures with the reason (no personal data beyond a masked email)
- a "Retry failed" button, plus the backfill dry-run and run buttons
- the messaging switch, with a warning to turn it on only after your GHL workflows are live

## Tests (GHL fully mocked; no real calls)

- Mapper tests: field values, Central Time formatting, tags per service, excluded fields never present.
- Stage tests: forward-only order, cancel/refund rules, one opportunity per booking.
- Worker tests with a mocked fetch:
  - Contact found by email; found by phone; created new.
  - 429 then success; 500 until marked failed; a duplicate event sent once.
- Trigger SQL tests on a draft or test database: each table change queues exactly one event, and a failed queue insert never blocks the booking save.
- Switch tests: each listed sender skips when ON and sends when OFF.

## Rollout order

1. You create the pipeline, fields and token in GHL. I request the two secrets.
2. Apply the migration with sync disabled. Triggers start queueing, but nothing is sent.
3. Deploy ghl-sync and ghl-backfill. A read-only connection check confirms the token works and lists the pipeline/fields it found.
4. Enable sync and test on one test booking of yours: create, pay, reschedule, cancel. Check GHL by hand.
5. Run the backfill as a dry run; you review the counts. Then run it.
6. Watch the admin card for 48 hours.
7. Phase 2 (inbound webhook) and Phase 4 (remove tracking script) come later. The messaging switch stays OFF until you say your GHL workflows are live.

## Risks

- **Duplicate contacts in GHL.** Existing contacts created by the tracking script or chat may have only a phone or a different email. Matching by email, then phone, reduces this but can't merge existing duplicates.
- **Backfill volume.** About 390+ bookings at GHL's per-location rate limit (around 100 requests per 10 seconds) takes minutes, not seconds. The batch size keeps it under the limit.
- **Lifetime spend** uses saved booking totals for completed jobs, not Stripe settlements. It can differ for refunded or cash-era jobs.
- **Trigger additions run inside booking saves.** They only insert one row, but a migration bug could block saves, so they get tested on a draft first.
- **Manage link in GHL.** GHL staff and workflows will see a link that can reschedule or cancel. It's the same link customers get by email.

## Questions for you

1. Should the booking confirmation SMS stay with the app (as a "confirmation") or move to GHL?
2. UTM: the app doesn't save first-touch source/medium/campaign today; it's kept in memory only, behind analytics consent. Leave those fields empty, or add consented capture on bookings later?
3. Should inquiries without a booking create a New Lead opportunity, or only a contact with the "lead" tag?
4. Should past bookings that were cancelled be backfilled, or only upcoming and completed ones?
