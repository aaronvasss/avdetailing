# Owner-only appointment hours
- [ ] Allow owner/admin portal creation outside customer hours without changing public settings.
- [ ] Enforce the exception only for authenticated admins using the internal booking form.
- [ ] Run scheduling/permission tests and check the signed-in portal without creating a real appointment.

# Portal React error 310
- [x] Reproduce the owner portal crash while signed in.
- [x] Correct appointment-list hook ordering without changing booking behavior or design.
- [x] Six regression tests passed; signed-in owner calendar/history/analytics and worker today/jobs/bookings/pay opened without React errors; hook-order scan and preview build passed.

# Reviews replacement
- [x] Retrieve three genuine Google reviews with original text, rating and date.
- [x] Build shared branded cards and mobile carousel.
- [x] Add admin editing, replacement and reordering.
- [x] Verify admin save and both public pages on desktop/mobile.
- [x] Present desktop/mobile previews.
- [x] Remove GoHighLevel review widget after successful verification.
- [ ] Publish only when the user requests it.

# Email-sending update
- [x] Inventory legacy senders, data writes, and preserved email content.
- [x] Replace queued account emails with managed account email sending.
- [x] Preserve independent Resend booking, contact, and review emails.
- [x] Scaffold the managed template helper and preview.
- [x] Validate replacement functions and remove legacy queue files from the repository only.
- [x] Events receiver not required: no suppression or unsubscribe handlers are being removed, and no feature reacts to those events.
- [x] Deploy updated email functions and verify the project remains buildable; six template renders, signature rejection, and protected preview passed without real sends.
- [ ] User reviews and publishes to complete the permanent update.
# Client portal upgrade (phased, do not publish automatically)
- [x] Phase 1a: Home-screen install (name, icon, theme) for iPhone/Android.
- [x] Phase 1b: Booking preparation instructions shown in the customer portal.
- [x] Phase 1c: Next-appointment card with Book Again, Reschedule, Cancel, Contact, Add to Calendar, Directions.
- [x] Phase 2: Vehicles: nickname, photos, service address, per-vehicle history, select when booking.
- [ ] Phase 3: Saved cards via current Stripe (SetupIntent), default card, written authorization, admin charge with receipt + duplicate guard; Venmo/Cash App labeled external.
- [x] Phase 4: Membership details, completed visits, linked rebooking and durable optional reminders; remaining entitlement requires confirmed policy.
- [x] Phase 5 (part 1): Audit history of appointment changes, charges, refunds, staff actions; receipts/photos/notes in portal.
- [ ] Desktop and mobile previews after each phase.

# Finish client portal
- [x] Customer appointment records: clear completed-history access, separate receipts/published notes, keyboard-accessible before/after photos, retry states; four focused tests passed and build OK.
- [ ] Signed-in customer record review: sign-in session unavailable; owner must sign in in the preview before desktop/mobile record checks can run.
- [x] Implement saved-card setup, authorization, defaults/removal and protected remaining-balance charges; uncertain or ambiguous payments fail closed.
- [x] Add customer receipt printing, approved service notes and before/after photos with compressed pre-service uploads.
- [x] Correct completed-visit reporting and connect saved-vehicle/membership rebooking.
- [x] Add consent-controlled reminders; protected scheduler dry-run passed with zero sends.
- [x] Check desktop/mobile account pages, saved preferences round trip, function validation and 17 unit tests.
- [ ] Full non-admin customer and card-charge checks: blocked by unavailable customer session and live-only Stripe credentials; no live charge performed.
- [ ] Remaining membership visit entitlement: awaits owner confirmation of included/rollover visits; do not invent quotas.
- [x] Add database charge/refund audit and reconcile a single metadata-matched reserved intent; ambiguous cases remain manual-only.
- [ ] Cash App URL awaits owner; keep the external option visible.
- [ ] Publish only on explicit request.
