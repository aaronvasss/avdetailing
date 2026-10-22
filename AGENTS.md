# Architecture rules
- Store the featured Google review selection as one atomic, admin-only editable collection in public.featured_google_reviews; public readers receive only complete selections, preventing partial updates across pages.
- Keep review validation and access in one repository, and render public reviews through GoogleReviews on every page so content and behavior cannot diverge.
- Keep account email dispatch in the scaffolded managed SDK handler; preserve independent Resend feature senders so the email update does not change their provider or content.
- Record booking changes via the bookings_audit database trigger into public.booking_audit_log, never from app code, so every change path (app, functions, admin) is captured.
- Keep card data in Stripe; use the authenticated card-wallet function and durable per-booking authorization/reservation guards for balance charges, refusing ambiguous ledgers and uncertain retries to avoid unauthorized or duplicate payments.
- Settle portal charges atomically with a service-only database function and serialize payment/deposit writes on the booking lock so ledger, receipt and booking payment state cannot diverge.
- Publish customer service notes separately from internal notes, and keep documents protected by booking ownership so staff-only content never appears in the customer portal.
- Store reminder preferences and STOP suppression durably, and claim each appointment/channel/time reminder before dispatch through existing Resend and Twilio providers to honor consent and prevent duplicate sends.
- Authenticate reminder cron callbacks with a private service-only scheduler credential; never embed tokens in cron definitions or expose the credential through customer access.
