# Customer portal live readiness audit (read-only, Nov 7 2026)

## What I checked live
- All 32 backend functions answer on the live backend, so every function is deployed. The live versions can't be read, though, so I can't tell which source version each one runs.
- Live database: **`portal_booking_balance` is missing**, **the owner-alert outbox is missing** (the `commit_owner_appointment_change` / `tick_owner_alert_dispatch` functions and the `owner_alert_*` tables), and the only scheduled jobs are `send-sms-reminders-hourly` and `expire-google-review-cache`.
- Every table the website reads directly exists (profiles, vehicles, memberships, payment_records, booking_photos, customer_service_notes, customer_notification_preferences, card_authorizations, and so on).
- The function logs for the last 72 hours show no errors and no portal traffic, so no breakage has been seen yet. That also means nothing has been proven to work.

## 1–2. Feature status

| Feature | Backend it needs | Live state | Risk on the live site now |
|---|---|---|---|
| Sign up / sign in | Built-in sign-in + profile trigger | Present | OK; real sign-in not tested |
| Password reset | Built-in recovery, /reset-password | Present, redirect allowed | OK; real email not tested |
| Account home / next appointment | bookings, profiles (direct reads) | Present | OK |
| Vehicles | customer_vehicles | Present | OK |
| Membership | customer_memberships, check-subscription, customer-portal | Present | OK if Stripe portal is set up; not tested |
| Receipts / photos | payment_records, booking_photos (private storage) | Present | OK |
| Reschedule | reschedule-booking → shared owner-alert outbox RPC | Function live, **outbox SQL missing** | **Broken if the live function is the current source** (save fails on missing RPC); unknown otherwise |
| Cancel | cancel-customer-booking → same outbox RPC | Function live, **outbox SQL missing** | **Same as reschedule** |
| Saved cards / pay balance | card-wallet → `portal_booking_balance` | Function live, **RPC missing** | **Pay balance broken** if the current source is live; listing/removing cards probably works |
| Reminders | send-reminder-sms (hourly job), portal_reminder_deliveries, scheduler credential | Present | Probably OK; real sends not tested |
| Email manage links | manage-booking, cancel-booking-public, process-booking-notifications | Live | Works only if those deployed versions match the published pages (not verifiable) |

## 3. Safest release order for tonight
1. Aaron does one real test sign-in on the live site to confirm the account home loads (nothing changes).
2. Apply `owner_alert_outbox.sql` (adds new tables and functions only, no data changes). Then set the scheduler setting it needs, using the existing private credential.
3. Deploy together: reschedule-booking, cancel-customer-booking, manage-booking, cancel-booking-public, process-owner-alerts.
4. Deploy process-booking-notifications, then send-reminder-sms.
5. Test with Aaron's own test appointment only: reschedule, cancel, and open the email link. Check that the owner alert arrives.
6. **Payments (risky, separate step):** apply `portal_payable_balance.sql`. It also replaces the trigger that protects charges, so pending charges must be zero first (read-only check). Then redeploy card-wallet and stripe-webhook, and run one small real charge on Aaron's own card. Then refund it.
- If time is short, skip step 6 and hide or disable "Pay balance" for tonight. Steps 1–5 don't touch Stripe.

## Needs Aaron's input
- A real test sign-in, plus a test appointment he owns.
- Permission to apply the two SQL files and to deploy the functions listed above.
- Whether to do the live test charge tonight, and on which card.
- The Cash App payment link to show (please confirm the exact URL).
- Membership entitlement: confirm what a member is owed per period before membership-related portal actions are trusted.

## Not verified
Which source version each deployed function runs, real email/SMS delivery, and Stripe flows on the live site.
