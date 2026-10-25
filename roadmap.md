# Exact payable booking pricing
- [x] Reverified existing pricing against current active catalog: 72 browser final-summary cases at 1280px/375px/390px and 114 pure pricing/payment/scheduling tests passed; no bookings, payment sessions, charges, deployment, publication or data changes. Only regression tests added; results and verification limits in pricing-verification_v2.md.
- [x] Replace booking display-price overrides with authoritative package/add-on prices; shared cent arithmetic and vehicle resolution; checkout uses persisted total without duplicated add-ons/fees. Deployed booking and checkout functions.
- [x] Test Basic, Silver and Gold for all vehicle types, both payment methods, Back and add-on changes at desktop, 375px and 390px: 72 final-summary checks and 33 regression tests passed; no records, sessions, charges or website publication.
- [x] Report displayed and payable amounts and verification limits in pricing-verification.md; actual saved-record/Stripe read-back intentionally untested because real creation was prohibited. Unsupported referral discount is no longer promised or redeemed.
- [ ] Secure atomic referral-credit redemption remains separate work; existing flow never actually deducted the shown credit, so booking now clearly excludes it and preserves rewards.

# Published-domain HTTPS and genuine 404 handling
- [x] Check production TLS, DNS, HTTP/HTTPS redirect chains, canonical service pages, booking/sign-in and three unknown URLs without changing design/content.
- [x] Recheck www after DNS convergence: correct A record and valid hostname certificate; path/query preserved.
- [ ] Permanent HTTPS www redirect: hosting currently returns 302; requires an external permanent redirect rule or hosting support for 301/308.
- [ ] Genuine unknown-route 404: Lovable's production SPA fallback returns homepage HTML with 200; requires route-aware hosting/proxy support outside app code.

# Crawlable homepage FAQs and reviews
- [x] Keep existing FAQ answers mounted in collapsed accordions and wait for verified reviews before initial-page capture; no copy, policy or review-schema changes.
- [x] Verified prerender-equivalent captures through postbuild-seo: all 13 FAQ answers and three original attributed reviews in initial HTML; mobile accordion/keyboard/carousel and desktop cards work, eight existing tests passed, no browser errors; live verification awaits publication.

# Utility-route SEO
- [x] Emit route-specific anonymous initial HTML and noindex for booking and sign-in; preserve service indexing and sitemap exclusions.
- [x] Verified postbuild output via local HTTP (200, self canonicals, single noindex), rendered metadata, booking service selection, sign-up toggle and signed-out private-portal redirects; 15 tests and preview build passed. Live response verification awaits publication; no publication requested.

# Owner-only appointment hours
- [x] Allow owner/admin portal creation and editing outside customer hours without changing public settings.
- [x] Enforce outside-hours creation only for authenticated admins explicitly using the internal booking form; deployed create-booking.
- [x] Eleven scheduling/portal tests passed; signed-in owner selected 5 AM and 9 PM, and a public-style owner request was rejected with 409; no real appointment created; preview build OK.

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
