# GA4 preparation part 1
- [ ] Audit existing tags/consent and official Google guidance; prepare one gated production-only integration and optional analytics controls.
- [ ] Verify mocked collection/privacy/consent and desktop/375/390 controls; report build evidence and activation prerequisites without release or real Google traffic.

# Aviation SEO part 2
- [x] Refined supporting intents: cleaning assessment only (no exterior package), private-aircraft cabin deep cleaning/shampooing, polishing/coating explicitly not repainting. Updated distinct metadata, quote scope and contextual links; aviation visible/schema breadcrumbs use /services and access guidance uses aviation-policy. Main overview, booking/payment enforcement and other service content unchanged.
- [x] 24 desktop/375/390 page checks (three supporting pages, overview, car/RV/boat and boat polishing), nine intercepted quote-entry checks, six captured/empty-root initial-HTML checks and 106 regression tests passed. Single business/provider, accurate coverage, unique metadata/self-canonicals, initial content/links and sitemap verified. Screenshots inspected; automatic preview build OK. No inquiries, release or data changes. Full production build/plugin capture and current external search evidence remain unverified; standalone cleaning scope confirmation or later consolidation awaits owner decision.

# Aviation discovery verification
- [x] Strengthened homepage/directory and main-to-supporting contextual links, removed unsupported aviation approval/helicopter wording and repaired conflicting aviation descriptions/self-canonicals; initial aviation schemas now reference one existing business and the scoped service.
- [x] All four live URLs returned 200 on direct recheck (research fetch initially received three 403s); live metadata remains older publication. 18 desktop/375/390 checks and four quote flows per viewport passed with writes blocked, 112 tests passed, captured/fallback initial HTML verified and automatic preview build OK. Sitemap contains all four aviation routes, omits noindex /services and inferred lastmod. No publication, deployment, messages or settings changes; current Google indexing, external keyword opportunities and full production-build capture remain unverified.

# Aviation supporting-page targeting
- [x] Differentiated exterior inquiries, interior deep cleaning/shampooing, and polishing/coating with unique metadata, scope questions and related links; removed unsupported claims, retained URLs and existing quote flow.
- [x] Nine desktop/375/390 page-to-quote checks passed with blocked writes, no overflow or runtime errors; screenshots inspected, captured initial HTML and empty-shell fallback verified, 13 regression tests passed and preview build OK. No messages, bookings, publishing or deployment; live changes await authorized publication.

# Main aviation SEO overview
- [x] Updated only the main aviation overview with confirmed services, coverage, quote questions and shared initial HTML; supporting URLs and quote/payment functionality preserved.
- [x] Desktop/375/390 screenshots and existing aircraft quote entry passed with writes blocked; captured initial HTML and empty-shell fallback checked, 13 regression tests passed and preview build OK. No publishing, deployment, bookings or messages; live HTML remains unchanged until an authorized publish.

# RV Exterior Wash price
- [x] Updated only the owner-authorized shared RV Exterior Wash catalog row from $180 to $350 and aligned the public fallback; other packages and fee rules unchanged. Shared live/preview data change explicitly authorized; no historical bookings changed.
- [x] Verified package, Back, running/final summaries and both payment methods at 1280/375/390px with mocked availability and blocked writes; 103 focused tests passed, including modeled saved totals and checkout cents ($350 / 35000 cents). Screenshots inspected and preview build OK; real save/Stripe deliberately untested, no bookings/charges, publish or deploy.

# Aviation quote wording
- [x] Update aircraft no-deposit wording, job-specific New Orleans access/coverage and remove unconfirmed quote deadlines without changing design or payment logic.
- [x] Inspect and report legacy $500 admin metadata and separate $100 specialty checkout; 107 tests and desktop/390px aviation/FAQ/quote checks passed, no writes or release. See aviation-deposit-inspection.md; legacy payment logic and hosted email sender remain unchanged pending separate authorization.

# Durable owner alerts
- [x] Stage transactional outbox and lease/retry safeguards outside managed migrations; production untouched.
- [x] Wire shared customer writers to atomic change/enqueue and a private recoverable email/SMS dispatcher with wake-on-enqueue and drain disarming.
- [x] 24 isolated PostgreSQL/mocked-provider checks and 246 regression tests passed; report release order, scheduler configuration and uncertain SMS/provider duplicate limitations in owner-alert-outbox-verification.md. No real records/messages or release; hosted scheduler/provider delivery unverified.

# Owner-alert sign-in destination
- [x] Preserve the internal admin appointment destination through login, retain role enforcement and show an unavailable-appointment fallback.
- [x] Fifteen mocked browser checks passed at desktop/375px/390px for signed-out/signed-in admin, non-admin, unsafe return and missing appointment; no private reads before authorization, no overflow/runtime errors, 255 regression tests passed. No real records/messages, deployment or publication; live authentication remains unverified.

# Appointment date/time completion
- [x] Use the Central calendar day for client classification without changing each view's status policies.
- [x] Share timezone-aware conversion across Add to Calendar, download-ics and calendar-feed; retain durations and stored values, emit UTC instants with valid line folding.
- [x] 236 regression tests, 24 focused Tokyo-time tests and eight mocked Chicago/Tokyo browser+download checks passed; initial/live imported calendar apps remain unverified, no release or real records.

# Payment safeguard correction
- [x] Stage corrective SQL outside managed migration history; client/wallet/reservation share the locked ledger balance and reject legacy fee-added responses.
- [x] Thirty isolated PostgreSQL checks passed for $145.18, verified/unpaid deposits, partials, stale approvals, simultaneous requests, audit and ledger guards; desktop/375px/390px verified amount/review screens passed with intercepted requests.
- [x] Report staged migration, release order and live-service limitations; no production migration, deployment, publication or real transactions.

# Customer-space layout
- [x] Put next appointment before preparation guidance, simplify customer header and primary actions, remove duplicate next-appointment card and expose history/receipts.
- [x] Nine mocked account flows passed at desktop/375px/390px: next appointment before prep, no duplicate next card, saved $145.18/October 28/Central Time, Details and Keep appointment, history and printable receipt access, past-only/empty states; screenshots inspected, no overflow/runtime errors. All 226 regression tests passed; preview build OK.
- [x] Preview-only layout change; existing cancellation/rescheduling, payment calculations, email links and recovery logic untouched. No real customer records, messages, publication or deployment. Live account and receipt delivery intentionally untested.

# Customer password recovery
- [x] Add neutral email request and public recovery screen using existing authentication, without new profiles or custom email senders.
- [x] 226 regression tests and 15 intercepted browser cases passed at desktop/375px/390px: email request, replacement success, mismatch rejection, expired/invalid links, request/save failures and preserved account return; screenshots inspected, no overflow/page errors.
- [x] Confirm existing production Site URL and allowed redirects cover /reset-password; frontend publication only when requested, existing auth email template unchanged. No real emails/password changes, deployment or publication. Live delivery/password validation remains untested.

# Appointment email links
- [x] Audit appointment confirmation/resend/update, reminder, legacy cancellation/reschedule, review and owner senders; unify customer action links on avdetailing.net.
- [x] Reuse customer writers with appointment-specific capability checks, read-only management/slots and legacy-route compatibility; retire legacy mutation endpoints and redact URL secrets.
- [x] 211 regression tests and 21 signed-out desktop/375px/390px browser cases passed; actual confirmation HTML links generated locally, failed mutations intercepted, Back preserved selection, Central dates/invalid/cancelled/missing-token states verified. No real data/messages/deployment/publication.
- [ ] Release only on request: deploy manage-booking, cancel-customer-booking, reschedule-booking, cancel-booking-public together, publish matching pages, then deploy process-booking-notifications and send-reminder-sms. Existing secrets reused; live delivery/capacity remain untested. See appointment-email-links-verification.md for legacy and concurrency limits.

# Customer cancellation
- [x] Clarify customer actions and confirmation with service, vehicle, Central Time, optional reason, Keep appointment and existing advisory deposit consequences.
- [x] Add authenticated ownership/policy checks, atomic cancellation and post-save owner alerts with duplicate/failure protections; preserve notes and all financial fields.
- [x] Verify mocked allowed/restricted requests, failed saves/notifications and double-clicks at desktop/375px/390px: six browser flows, 198 regression tests and clean preview passed; no real changes, financial actions, messages, deployment or publication.
- [ ] Activate only on request: deploy cancel-customer-booking before publishing the matching dialog. Shared owner delivery also changes reschedule-booking source; deploy it when releasing that pending feature. Existing Resend/Twilio settings are reused; real delivery is untested and failures require manual follow-up. No migration or refund integration is needed.

# Owner reschedule notification
- [x] Reuse existing owner email/SMS recipients after saved customer reschedules, with Central times, pending status and protected admin appointment link.
- [x] Verify intercepted notification delivery, concurrent submissions, lost-response retries, unavailable/save-failed requests and failure logging with mocks only: 183 tests passed; desktop/375px/390px customer flow and desktop/375px owner link passed; no deployment, publication or real changes/messages.
- [ ] Activate only when requested: deploy reschedule-booking before publishing the matching customer request/admin-link changes; existing Resend/Twilio secret names are present, but live delivery remains intentionally untested. Failed sends require manual follow-up; no automatic SMS retry or transactional outbox was added.

# Booking progress visibility
- [x] Add accurate branch-aware step counts, current selections and authoritative running total; label Central Time/end time and optional-extras action.
- [x] Desktop/375px/390px preview passed: all three package links, Back, vehicle/package/extras changes, 18 payment-choice/final-screen checks, long extras and labels fit; 114 regression tests passed, build OK, no runtime errors, bookings, payment sessions, charges, deployment or publication.

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

- [x] Aircraft quote buttons open the aircraft quote form directly (/book?service=aircraft)
- [x] /services indexable directory with shared initial/rendered head and sitemap entry

# Final shared SEO cleanup + full build
- [x] Aviation quote/product wording, business Maps listing/no centroid geo, email typo, homepage RV interior line.
- [x] Full production build + prerender ran (exit 0); captured and empty-shell HTML audited; duplicate descriptions and missing Service schema fixed. 279 tests and mocked signed-in repeat/membership checks passed. Report: docs/seo-final-report-2026-10-26.md. Publishing still waits on owner authorization and the existing release gate.
- [x] Single metadata owner for all routes (SEOHead); navigation regression test + browser transition checks on build and preview; rebuilt. Live www 302 and soft-404 remain hosting issues.
- [x] Car supporting pages (exterior/headlight/odor/pet hair/engine) rewritten as car pages; rebuilt and audited. Open: owner decision on active Odor Elimination/Pet Hair add-ons and ozone wording.
