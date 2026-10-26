# Final SEO implementation and verification report — 2026-10-26

Preview only. Nothing was published or deployed, and no customer records, submissions, messages, charges or production settings changed. The live site at https://avdetailing.net still shows the last published build.

Baseline commit: `6adda90`. This pass adds the next preview commit on top of it.

## Baseline (Search Console, Jul 25 – Oct 23 2026)
- mobile-rv-detailing: 11 clicks / 3,511 impressions, average position 36.3
- boat-ceramic-coating: 0 / 1,118, position 14.7 ("boat ceramic coating near me": 989, position 13)
- hull-cleaning: 1,091 impressions, position 43.1
- Some boat pages also showed a few car-related queries in the partial Search Console rows; this is not evidence of a majority or of cannibalization.
- Full audit: `/mnt/documents/seo-audit-car-rv-boat-2026-10-26.md`

## Changes in this pass
| Item | Files |
|---|---|
| Removed the "Specialized aviation-safe products" quote bullet. The exterior/interior scope bullet now names the confirmed services. | `src/pages/BookingPage.tsx` |
| Aircraft-cleaning intro is now inquiry guidance. It no longer mentions an "unconfirmed standalone wash package". | `src/data/serviceLandingPages.ts` |
| Business schema: `hasMap` now uses the business's Google Maps listing (`GOOGLE_REVIEWS_URL`, cid). Removed the business `geo`, which was the Baton Rouge centroid. City and service-area geography are kept. Email: aaronvasquez@avdetailingg.com (restored; see correction below). | `src/components/seo/schema.ts` |
| REVERSED: an earlier pass wrongly changed the customer email to `@avdetailing.com`. The owner-confirmed address `aaronvasquez@avdetailingg.com` (double g, not a typo) is restored | schema.ts, Footer, Contact, Privacy, Terms, BookingDetailsDialog, tests |
| Homepage RV sentence no longer promotes interior deep cleaning | `src/components/home/ServiceContentSection.tsx` |
| Prerender now waits for the page's own head tags, so page Service/Breadcrumb schema is captured | `vite.config.ts` |
| Postbuild keeps exactly one title, description, canonical, og and twitter tag, and the page's own robots tag. Service pages built from the empty shell get a minimal Service node. | `scripts/postbuild-seo.ts` |
| Every page now sets its own canonical and og:url during in-app navigation. Before this, only aviation, RV and /services pages did. | `src/components/seo/SEOHead.tsx` |
| New test | `src/test/local-business-schema.test.ts` |

## Full production build (sandbox, not a deployment)
`npm run build` = sitemap generation → `vite build` → prerender of 44 routes → postbuild-seo, which wrote 54 HTML files. Exit code 0, "All routes rendered successfully".

The first full build found real failures, and all were fixed:
- Duplicate meta description on the boat hub, Central LA, ceramic, privacy, reviews and terms pages.
- Service schema missing from the captured HTML of most car, RV and boat pages, because capture ran before the page's head tags were written.
- The homepage RV "interior deep clean" promotion.

Final audit, run on both the captured `dist` and an empty-shell fallback built from the raw Vite shell:
- Every public route has one title, one description, one canonical (self) and one H1. There is at most one LocalBusiness per page, and no preview-domain links appear in any page or in the sitemap.
- Indexable service, location and hub pages carry Service schema in both versions. The legacy RV-interior page carries no Service schema.
- `/services` is index,follow, self-canonical and in the sitemap.
- `/book`, `/auth` and `/reset-password` are noindex,nofollow and not in the sitemap. The legacy `/services/*` and `/terms` stubs are noindex,follow and canonical to their target pages.
- `/rv-interior-detailing-baton-rouge` is noindex,follow, self-canonical, not in the sitemap and not linked from any other page.
- Aircraft quote CTAs point to `/book?service=aircraft` on all four aviation pages. The captured pages also contain the site-wide header "Book Now" link to `/book`.
- The sitemap has 43 URLs and no lastmod values.
- Internal links resolve to built routes.
- Note: empty-shell versions of the generic pages (about, contact, gallery, memberships, reviews, service areas, legal, ceramic) are short summaries. The captured versions have the full content.

## Regression checks
- 279 automated tests passed (32 existing files plus the new schema test file).
- The automatic preview build was OK. That check is separate from the full build above.
- Mocked signed-in browser checks at 1280px, with every write blocked:
  - Repeat booking shows "Gold Detail — Previous appointment: $259.00. Choose a current package…" and keeps the SUV (5) vehicle type.
  - Membership entry with no prior booking falls back to "Membership Maintenance".
  - `service=car&package=gold` opens Vehicle step 2.
  - `service=aircraft` opens the quote form.
  - Adding `deposit`/`price` to the URL is ignored and no $500 appears.
- Minor existing quirk: the summary shows the package key as "gold" in lower case.

## Status by section
- **Cars — done:** distinct hub, mobile, interior and paint-correction intent; duration lists removed from teasers; ceramic tiers confirmed 3/6/10. **Pending:** which tier is "most popular"; whether Gold includes wax or a 2-month sealant; footer badge backing; System X for cars; odor and pet-hair handling; SUV and truck prices.
- **RV — done:** exterior-only hub and logistics pages; interior page is unavailable (noindex,follow); RV Exterior Wash shows $350. **Pending:** whether roof cleaning is offered; RV classes and lengths; water, power and site rules; RV coating product; a `service=rv` booking entry.
- **Aviation — done:** overview and three supporting intents; no-deposit wording; quote entry link; aviation-safe product claim removed. **Pending:** product names, exact inclusions, airport and workspace requirements, standalone cleaning scope; the legacy $500 admin metadata and $100 checkout path need separate authorization.
- **Boats — done:** hub and five supporting intents; certification and absolute claims removed; hull cleaning confirmed trailer/lift only. **Pending:** maximum length; coating product, lifespan and warranty; standalone coating price; aluminum or pontoon inclusions; water, power and marina permission.
- **Technical foundation — done:** /services is an indexable directory; one business entity; per-page canonicals; prerender/postbuild agreement; sitemap. **Pending:** current Google indexing after publish; www redirect and real 404 status (static hosting).

## Release dependencies (unchanged gate)
Publishing must be authorized by the owner. The backend, UI and email senders must be released together. Hosted safeguards, alerts, and payment and availability checks still need verification. The private scheduler credential is still needed for retries. Staged migrations live outside managed history (`scripts/pending-migrations/`). Changes to head tags reach the live site only on the next publish.

## Owner clarifications applied (follow-up, same day)
- **Car ceramic tiers are 3/6/10 years.** Booking now labels the internal legacy `5-year` key as "6-Year Protection" (shared `CERAMIC_TIER_LABELS` in `src/lib/pricing.ts`). Keys, prices ($850/$1,300/$1,700 car; $950/$1,400/$1,800 SUV/truck), fees and historical records are unchanged. New bookings save the service name "Ceramic Coating 6-Year Protection"; existing bookings are not rewritten. The ceramic config (`src/data/serviceLandingPages.ts`) now says 3/6/10 and no longer says "permanent" or calls the 5-year tier "most popular". The bespoke page (`CeramicCoatingBatonRougePage.tsx`) no longer says "Permanent". Still open: which tier is "most popular" (the page currently marks the 10-year).
- **Boat hull cleaning is trailer or lift only, never in-water.** The hull page title area, description, intro, steps and checklist; the boat hub inquiry card; and the shared boat inquiry guidance (`src/lib/boat-seo.ts`, `BoatDetailingBatonRougePage.tsx`) all ask for trailer/lift status, location and hull access. No water/power requirements were added.
- **Tests:** 281 passed, including the new `ceramic-tier-labels.test.ts` and the updated hull assertions in `boat-seo.test.ts`.
- **Full build after these changes:** `npm run build` exit 0, all 44 routes prerendered, 54 HTML files written. Re-audit: no failures. No "5-year", "afloat" or "in a slip" text appears in any generated page. The hull page states "do not offer in-water cleaning", and the ceramic page shows the 6-Year tier.

## Shared metadata owner fix (follow-up)
- **Defect:** before this fix, SEOHead removed static fallback tags and later restored them when leaving a page. Helmet omitted robots on indexable pages, so after a direct load of a prerendered noindex page (the RV interior page), the static `noindex, follow` came back on the next pages: the RV hub, /services and ceramic. The first post-fix test against the production build caught this.
- **Fix (`src/components/seo/SEOHead.tsx`):** SEOHead now owns the head tags on every route. On mount it permanently removes static (non-Helmet) description, robots, og:title/description and twitter title/description tags. It keeps exactly one canonical and one og:url, set to the route path without query or hash. Helmet now always emits robots: the full index directive for public pages, `noindex, nofollow` for utility pages and `noindex, follow` for unavailable pages. Prerendered body content is untouched.
- **Tests:** new `src/test/seo-head-navigation.test.tsx` walks RV interior → RV hub → car → /book → boat. All 34 test files passed.
- **Browser navigation checks**, on both the full production build and the preview, with saves blocked: 11 of 11 steps passed in each. The sequences were direct / → car → boat → aircraft → /book?service=aircraft → hull page with `?utm_source=x#faq`, and direct RV interior → RV hub → /auth → /services → ceramic. Each step had one title, description, canonical, og:url, og:title and twitter:description, plus the correct robots value.
- **Full build after all follow-ups** (3/6/10 tiers, trailer/lift hull cleaning, metadata owner): exit 0, 44 routes prerendered, 54 files written. The static audit shows no failures, and no "5-year", "afloat" or "in a slip" text appears in any page.

## Unresolved production HTTP issues (not fixable in page code; checked on the live site 2026-10-26)
- `https://www.avdetailing.net/` returns **302** to the apex domain. That redirect is temporary; it should be a 301, which is a hosting/domain setting.
- Unknown URLs such as `/this-page-does-not-exist` return **200** with the app shell (soft 404). Static single-page hosting cannot send a 404 status today.
- Legacy `/services/*` and `/terms` remain noindex canonical and meta-refresh stubs, not real 301s.

## Car supporting pages (later pass)
- **Pages:** exterior, headlight restoration, odor removal, pet hair removal and engine bay cleaning (`src/data/serviceLandingPages.ts`). All five are now car pages, so they get the car-hub breadcrumb, related car links and matching initial HTML. Each has a distinct Baton Rouge title, description and H1.
- **Removed:** EPA, DEQ, NHTSA, OMV, American Lung Association and city-site filler links; "permanent" odor elimination; ozone, enzyme and HEPA equipment claims; allergen and health claims; "up to 80%" and "full brightness" headlight claims, plus the fixed headlight process; "safe for modern electronics" and steam claims; "clay bar in every exterior detail".
- **Exterior:** explains Exterior Only (hand wash and dry, wheels and tires, tire shine, exterior windows), clay bar as a separate add-on, the packages, and that Gold adds paint sealant.
- **Headlight / engine bay:** add-on chosen at the booking add-ons step. We check the condition on arrival and the customer notes cracks, moisture, leaks or repairs.
- **Odor / pet hair:** (superseded) now presented as the existing Odor Elimination and Pet Hair Removal add-ons at the booking add-ons step, with condition notes; see correction below.
- **Teasers:** odor, headlight and pet-hair/odor teasers updated in `CarDetailingBatonRougePage.tsx` and `locationPages.ts`. `src/lib/car-seo.ts` now links all five pages.
- **Checks:** new `src/test/car-supporting-pages.test.ts`; 35 test files, all passing. Full build: exit 0, 44 routes prerendered. The audit shows no failures, with car breadcrumb schema and no banned claims in the built HTML. 11 of 11 navigation checks passed on the build.
- **Add-on availability (corrected):** BookingPage lists every active add-on (no service filter) and create-booking accepts any active add-on id, so all five catalog add-ons — Clay Bar Treatment, Engine Bay Cleaning, Headlight Restoration, Odor Elimination, Pet Hair Removal — are selectable today. The earlier conclusion that only engine bay and headlight were available came from a service-filtered query and was wrong for real customer booking. Existing availability is preserved; no owner decision needed. Catalog wording (e.g. "ozone") is not used in marketing because it does not verify the physical method.

## Pass: local car-page consistency (8 existing city pages, no new pages)
Files: src/data/locationPages.ts, src/components/locations/LocationLandingTemplate.tsx, scripts/postbuild-seo.ts (city services now link to their pages), new src/test/location-pages.test.ts.
- Shared service list now mirrors active packages/add-ons and the corrected car pages, each item linked to its page: exterior = hand wash/dry, wheels/tires, tire shine, windows; clay bar is a separate add-on; Gold adds sealant. Headlight = add-on with on-arrival lens check, no safety outcome. Pet hair/odor = describe + photos, scope confirmed before booking (no ozone/extraction).
- Removed: "System X" in every city meta/why list, luxury/affluent/demographic and "experienced with X vehicles" claims, resale-value/safer-roads lines, Consumer Reports and brla.gov filler links, "built into every exterior service" decontamination, self-contained water/power claims, "7 day scheduling", lifted-truck pricing claim, "regularly service".
- Kept: all 8 URLs, coordinates, neighborhoods/roads, Denham Springs FAQs (rewritten to match facts; FAQPage still matches visible text), 6 AM–8 PM Central and 30-minute arrival window, breadcrumbs Home → Service Areas → city.
- Built HTML (all 8): one H1/canonical/description, breadcrumb + Service schema, one business entity, 0 banned phrases, links to service pages present.

## Measurement audit (read-only)
- Instrumentation: no GA/GTM/Meta pixel/web-vitals code in the site; only Lovable's built-in visit analytics plus an internal error logger. Admin "Revenue Analytics" reads bookings, not visits.
- Built-in analytics, Sep 26 – Oct 25 2026: 486 visits, 1,199 pageviews, 41% bounce, 347 mobile / 138 desktop; search channel 120 visits; /book 98 sessions, /booking/success 6 sessions (search channel). These are visits, not leads.
- Original baseline could not distinguish car/RV/boat submissions from pageviews. A visit to /booking/success does not prove payment. Booking records count saved booking requests, not necessarily completed/paid jobs; aircraft quotes call send-contact-email and create no bookings record. That function can log business-mail failure while returning customer success, so neither durable aircraft quote counts nor owner-inbox delivery are established. No record-to-landing/source attribution was present.
- At baseline, submission and contact-click events were missing. GA4 parts 1–2 below prepare them inactive with no database columns, landing-page persistence, tracker activation or delivery changes.
- Performance: no stored Lighthouse/CrUX/Core Web Vitals data in the project or tools; field data was not available here, so no score is reported. Measuring needs PageSpeed Insights/Search Console Core Web Vitals on the published site after release.
- Final full build after these copy fixes: exit 0, all routes prerendered, postbuild wrote 54 HTML files, sitemap 43 URLs, no lastmod. Tests: 36 files / 286 passed.

## Pass: owner confirmations (System X car + boat coatings; RV roof cleaning offered)
Files: src/pages/CeramicCoatingBatonRougePage.tsx, src/data/serviceLandingPages.ts (car ceramic, boat ceramic, RV roof configs), src/lib/{boat-seo,rv-seo,services-directory-seo}.ts, src/pages/BoatDetailingBatonRougePage.tsx, src/components/home/ServiceContentSection.tsx, tests src/test/owner-confirmed-coatings-roof.test.ts and boat-seo.test.ts (rule now bans System X certification/approval instead of the name).
- Car ceramic: "uses System X ceramic coatings" in 3/6/10-year tiers; removed "System X Certified" badge text, "exclusively/industry-leading/most respected", "semi-permanent", controlled-environment and 24-hour-cure steps, "prep included" claim, Consumer Reports/DEQ links. Prices, tier keys (internal 5-year → 6-Year label) unchanged. "Most popular" (10-year) still open.
- Boat ceramic: System X coating stated as a separate quote-based service from the Premium Detail's ceramic sealant; no price; links to gelcoat restoration/hub kept. Hull cleaning still trailer/lift only.
- RV roof: now offered; page asks for RV, roof material/condition and access, scope and price confirmed first; hub, directory and homepage list roof cleaning. No seal repair, method or inclusion claims.
- Not added anywhere: System X on aviation pages, product line, warranty, lifespan beyond tier names.
- Evidence: 38 test files / 302 tests passed; full build exit 0, 54 HTML files, 43 sitemap URLs; System X appears only on home, contact, /services, car ceramic, boat hub and boat ceramic built pages; zero matches for "System X Certified", "industry-leading", "case by case" or the removed authority links.
- Resolved owner questions: System X for car coatings; boat coating product; RV roof cleaning offered.

## Correction: customer email restored
The shared SEO pass changed the customer email domain without authorization. Restored `aaronvasquez@avdetailingg.com` (owner-confirmed Oct 22 2026) in business schema, Footer, Contact, Privacy, Terms and BookingDetailsDialog; admin login and email sender settings untouched. New src/test/contact-details.test.ts checks the exact email and phone in schema and every public contact file, and that `@avdetailing.com` customer addresses never return. Maps/geo and build fixes kept. The earlier "boat pages ranked mostly for car searches" statement was removed as unsupported.

## Pass: car ceramic coating page scope correction
Files: new src/lib/ceramic-seo.ts (shared head, intro, tiers, steps, buying guidance, links, initial-HTML builder); src/pages/CeramicCoatingBatonRougePage.tsx; ceramic config in src/data/serviceLandingPages.ts; scripts/postbuild-seo.ts (ceramic body now from the shared builder); src/lib/pricing-fallback.ts now holds the ceramic tier labels/prices (moved unchanged and re-exported from pricing.ts so build scripts can read them); new src/test/ceramic-page.test.ts.
- Removed: "Lifetime Tier", "★ Most Popular"/"most popular"/"most-installed", "Stops oxidation and color fade", "10+ UV index", hardness/scratch resistance, "mirror-deep gloss", resale-value, "mandatory/multi-step correction included" claims, chemical/fallout/swirl protection cards, DEQ/Consumer Reports links.
- Now: System X 3-Year / 6-Year (legacy 5-year key) / 10-Year cards with the same layout and colors; neutral labels (Shortest/Middle/Longest tier; the gold card's badge reads "Longest Tier"); starting prices unchanged for sedans and coupes ($850/$1,300/$1,700) plus SUV/truck ($950/$1,400/$1,800); paint assessment first, paint correction quoted separately; booking/assessment steps; "Before You Book" guidance; links to paint correction, car hub and booking. Breadcrumb now Home → Car Detailing → page in visible and schema.
- Limitation: booking has no ceramic deep link (only car packages and aircraft), so coating CTAs open /book where the customer picks Ceramic Coating; adding one would change the booking flow and was not done.
- Evidence (Lovable sandbox): 40 test files / 313 tests passed; full build exit 0, 54 HTML files, 43 sitemap URLs; built ceramic page has one H1, title, description, canonical and breadcrumb, all six starting prices, and zero matches for lifetime/most popular/resale/hardness/UV index; customer email remains aaronvasquez@avdetailingg.com.

## Correction: car add-on availability
Source review (BookingPage fetches all active add-ons without a service filter; create-booking accepts any active add-on id) shows five selectable add-ons, not two. Updated src/lib/car-seo.ts (CAR_ACTIVE_ADD_ONS = all five, comment explains why), odor and pet-hair page configs (book a package, then add Odor Elimination / Pet Hair Removal at the add-ons step; condition goes in booking notes; separate add-ons, not part of any package), car hub teasers, the shared city-page service item, and tests (car-seo, car-supporting-pages, new car-add-on-totals). Catalog, prices, service tags and eligibility logic unchanged. Mocked totals: Silver sedan $259.17 + Odor Elimination $67.36 = $326.53; + Pet Hair Removal $46.63 = $305.80; both = $373.16 — package plus catalog add-on prices only, no extra fee. Removed the earlier owner request about keeping these add-ons bookable. Ozone/HEPA/enzyme/health/permanent claims stay out of marketing.

## GA4 preparation part 1 (later pass; inactive)
One source integration for owner-supplied `G-YM2RWYQVNS`, optional analytics consent/settings and sanitized allowlisted manual public pageviews prepared. Both release and stream-verification gates remain false, so no tag or collection in production or preview. Stream Enhanced Measurement must be verified OFF (including history/form/search/outbound); `send_page_view:false` is not enough. No real Google events/settings changes. See `docs/ga4-preparation-2026-10-26.md` for exact files, official sources, mocked/browser evidence and activation prerequisites. Automatic preview build OK is distinct from the **unverified final production-form build/prerender** after this pass; the full-build release gate remains. Earlier SEO build evidence above does not verify these new changes. Prices, contacts, completed SEO and release safeguards are unchanged; live www 302/soft-404 issues remain separate. Measurement correction: aircraft requests are email-only, not durable bookings records, and success-page visits do not prove payment. This pass adds no conversion/delivery logic.

## GA4 part 2 — measurement dictionary, inactive source preparation
Exact files: `src/lib/analytics-events.ts` (new allowlisted builders), `src/lib/analytics-runtime.ts`, `src/lib/analytics-policy.ts`, `src/components/analytics/AnalyticsConsent.tsx`, `src/pages/BookingPage.tsx`, `src/components/forms/InquiryForm.tsx`, `src/pages/ContactPage.tsx`, tests `analytics-leads.test.ts`, `analytics-inquiry-outcomes.test.tsx`, `analytics-runtime.test.ts`; architecture/memory/roadmap and this report. Same tag/adapter/ID, no second integration; release/settings gates still **false**.

| Event | Exact trigger | Allowed additional parameters | Meaning / NOT measured |
|---|---|---|---|
| `page_view` | One manual public pathname transition after opt-in/loading/gates | static `page_path`, canonical `page_location`, static `page_title`, safe public `page_referrer` | Visits only. `/book` now uses a generic fixed title/path, never its query/hash/form title; `/get-started` allows its existing public inquiry form. Utility SEO remains noindex. 45 exact public measurement paths (not a sitemap/indexability policy). |
| `booking_submitted` | create-booking returned nonempty saved `booking.id`, no API error, before referral/checkout work | `service_type`: car/rv/boat/paint/ceramic; `payment_method`: online/in_person; `submission_state`: pending for online, received for in_person | Saved booking request, never payment, completed job or revenue. Uses existing effective payment choice (boat/ceramic remain in-person-only). ID is used only to validate the saved response and is NOT transmitted. |
| `generate_lead` | send-contact-email explicitly returned `success:true`, no API error; public Contact/Inquiry forms also await their existing contacts insert first | `service_type`: above + aircraft/other; `quote_category`: aircraft_quote/coating_quote/service_inquiry; `submission_state`: received | Accepted quote/inquiry API response. NOT guaranteed owner-inbox delivery or durable aircraft quote count. Unknown/free-text service context becomes other; no parsing of messages. |
| `contact_click` | Captured click on an actual public business tel/sms link | `method`: call/text | Click only, not a completed call/message or lead/booking conversion. No phone number/href transmitted. Custom handler is distinct from Google automatic outbound tracking, which must stay OFF. |

All events rebuild params from enums and add only the static safe page context. No raw URLs, search/hash, fields, contact data, booking/payment/session IDs, tokens, notes, values/currency or purchase events. Optional cross-session landing attribution intentionally omitted (no database columns or storage of browsing intent). Current page/referrer context is public and sanitized. No hooks added to private admin/worker email senders, receipts or success URLs. Existing prices, fees, historical IDs, scheduling, submission validation, payment/deposit behavior and email providers untouched. Double-g email and no-photo restriction preserved.

### Deduplication and privacy evidence
- Runtime WeakSet keyed by local object occurrence, never identifiers. Booking/booking-page quote refs survive rerenders; mounted quote-flow repeated success handling counts once. Inquiry/Contact capture the occurrence before awaiting, so concurrent callbacks share one key; after successful handling a fresh deliberate form request gets a fresh local occurrence. This prevents duplicate **events**, not duplicate backend requests; no submission/eligibility refactor was made.
- Events received while private, declined/revoked, preview/noncanonical, gate-closed or script-not-ready are dropped, never queued or replayed after consent/navigation. Tradeoff: a very fast accepted submission before tag load is not counted; this is deliberate privacy fail-closed behavior. No backfill/durable reconciliation. Exceptions in measurement cannot block successful customer actions.
- **Final Lovable-run regression evidence: 46 files / 400 tests passed**, including 42 new event tests, six actual fully mocked InquiryForm outcome tests and existing adapter/consent/navigation/pricing/contact/initial-HTML/sitemap coverage. Enum outcome matrix exercises all five booking service types × both payment methods; this is adapter coverage, not authorization of online boat/ceramic booking. Actual booking policy remains unchanged. Seven quote services/categories tested; failures/missing saved IDs/false quote success emit no conversion. Payload assertions prove no identifiers/PII/revenue; calls/texts remain separate; private/origin/consent/preload tests prove no replay; duplicate success uses one event occurrence.
- **Browser with all external requests intercepted**, 1280×1800, 375×1800 and 390×1800: existing car package → extras → synthetic availability → in-person → synthetic customer details → mocked create-booking response → visible confirmation. Accept preference first, then footer revoke; existing aircraft quote form → synthetic request → mocked `success:true` → visible acceptance toast even while declined. Six mock outcomes total, zero Google scripts/request attempts, no page errors or overflow. No real customer reads/writes, bookings, emails, analytics or charges. Screenshots of success and notices inspected under `/tmp/browser/ga4-part2/`.
- Actual online checkout/charges, RV/boat/paint/ceramic full UI submissions and live Google execution were not exercised; only the service/payment outcome matrix is mocked. Do not equate that matrix with production end-to-end payment verification.
- Automatic preview check reports **build OK** after source edits. **Final production build/prerender still unverified**: session rules prohibit manual project builds/typechecks and only automatic preview verification is exposed. No authorized full-pipeline run or fresh dist artifact; prior SEO build success is not new GA4 evidence. Retain full sitemap→Vite/prerender→postbuild release gate and inspect generated HTML/no Google capture traffic through the authorized build workflow.
- Independent source finding: `InquiryForm` already injects GoHighLevel `external-tracking.js` and existing widgets have separate behavior. Those scripts were blocked in browser tests and are not governed by this GA4 preference; no site-wide consent-compliance claim. They were not removed or reconfigured in this scoped task. Before release, review them for unwanted collection or additional Google injection.

### GA4 UI configuration — still pending, NO settings changed
1. **Admin → Data streams → select web stream**, verify Measurement ID `G-YM2RWYQVNS`/canonical website and no duplicate hosted tag. In **Enhanced measurement → settings**, turn Enhanced Measurement OFF entirely and explicitly verify pageview advanced option **Page changes based on browser history events** OFF, form interactions/site search/outbound clicks OFF (also scroll/video/download). `send_page_view:false` alone cannot stop history measurement. Verify Google Signals/ad personalization and user-provided-data/automatic collection settings as in part 1; keep both source gates closed until verified and release separately authorized.
2. **Admin → Data display → Events**: mark the exact names `booking_submitted` and `generate_lead` as key events (star/mark control on recent events, or add the exact name ahead of incoming collection using the key-event controls available for the property). Key events count saved/accepted requests, NOT paid sales. Do not mark `contact_click` or page_view as booking conversions. Do not create a second derived event from /booking/success or a page_view; source already emits these names exactly once. No purchase/Ads conversion import/default monetary value is configured by this task.
3. **Admin → Data display → Custom definitions → Create custom dimension**: Event scope, exact event parameter for each `service_type`, `payment_method`, `submission_state`, `quote_category`, and `method` (contact method). Use readable names but keep parameter spelling exact; no user-scoped/contact/ID dimensions. Registration reports only future collected parameters, does not manufacture events. Allow 24–48h for normal reports/dimensions after collection.
4. **Only after separately authorized publication, verified settings and gate release**: web-stream **View tag instructions → Test installation** (where offered) for `https://avdetailing.net`; recognize basic mode requires opting in and an automated unsigned/declined check may report no tag. This action can load Google—do not run now. Then **Reports → Realtime** plus an explicitly authorized synthetic submission/network check on canonical production with opt-in. Validate one sanitized pageview, saved request/accepted quote once, failed actions none, call/text separate, private transitions/withdrawal no subsequent collection, and no raw URLs/form data/IDs in automatic session/engagement or event payloads. No real customer or payment actions without separate authorization. Keep gated if privacy behavior cannot be verified.
5. Quotes remain API acknowledgements, not owner delivery receipts. Consent/ad blockers/network/preload drops and local-only deduplication mean these are neither exhaustive durable counts nor proof of growth; compare like analytics windows only. Live HTTP www 302, SPA soft404 and other staged release dependencies remain unresolved independently.

Official references: [Recommended events](https://support.google.com/analytics/answer/9267735), [Mark key events](https://support.google.com/analytics/answer/13128484), [Event-scoped custom dimensions](https://support.google.com/analytics/answer/14239696), [Enhanced measurement](https://support.google.com/analytics/answer/9216061), [Tag setup troubleshooting](https://support.google.com/analytics/answer/9311124), [Confirm collection / Realtime](https://support.google.com/analytics/answer/9333790), [Manual pageviews](https://developers.google.com/analytics/devguides/collection/ga4/views), [Basic consent](https://developers.google.com/tag-platform/security/guides/consent).
