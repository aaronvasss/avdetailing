# Tracking / third-party script release audit — 2026-10-26 (read-only)

This review covers source only. No trackers were run, no Google or customer requests were sent, nothing was published, and no source logic changed. The live site's remote scripts were **not** fetched or executed, so their behavior is unverified.

## Owner-reported GA4 UI state (owner completed it with approval; the agency has not viewed it)
Property 443591828 / stream 8206634888 / G-YM2RWYQVNS, with stream URL https://avdetailing.net. Settings reported:
- Enhanced Measurement is OFF.
- `booking_submitted` and `generate_lead` are key events with no default value.
- The five event dimensions are saved.
- Default `purchase` is unchanged.
- Google Signals is OFF.
- Automatic user-data detection is OFF, and user-provided data collection is OFF.
- Ads personalization is allowed in 0 of 307 regions.
- These settings persisted after reload. Granular location/device settings are unchanged.

The source gates `releaseAuthorized` and `streamSettingsVerified` are still **false**.

## Inventory of what the source loads
| Owner/file | Script | Where it loads | Tied to GA consent? |
|---|---|---|---|
| `src/lib/analytics-runtime.ts` | `googletagmanager.com/gtag/js?id=G-YM2RWYQVNS&l=avAnalyticsLayer` | Only after both gates are open, plus consent, the canonical origin and an allowlisted public path. Currently never loads. | Yes |
| `index.html:59` | `reputationhub.site/reputation/assets/review-widget.js` (GHL review widget) | **Every route**, statically, before React: admin, account, worker, `/booking/manage`, `/cancel/:id`, `/rate/:id`, `/reset-password` | No |
| `src/components/GhlChatWidget.tsx` (mounted in `App.tsx:80`) | `beta.leadconnectorhq.com/loader.js` (GHL chat) | Any route not covered by EXCLUDED_PREFIXES. That includes `/`, `/get-started`, service pages, `/privacy-policy`, `/unauthorized`, `/.lovable/oauth/consent`, `/services/*` and unknown routes. | No |
| `src/components/forms/InquiryForm.tsx:44` | `link.msgsndr.com/js/external-tracking.js` (GHL external tracking, `tk_347c…`) | Any page showing the inquiry form: homepage InquirySection and `/get-started` (`/quote` redirects there) | No |
| `src/components/home/LocationMapSection.tsx` | Google Maps embed iframe | Homepage only, deferred until visible | No |
| Lovable hosting | Built-in visit analytics (not Google) | Published site | No |

## Prioritized findings
1. **Change needed (high): the review widget script loads on private and token pages.** `index.html:59` puts a remote script on every page. In-page scripts can read the full URL, including query strings and hashes. That covers manage/cancel/rate links and password-recovery hashes. `Referrer-Policy` only limits what the browser sends as the referrer; it does not stop an in-page script reading the URL. Current review cards come from `GoogleReviews`/`FeaturedReviewCards` (database plus link), and nothing in source uses the global script. **Proposed fix:** remove the script, or load it only on the public pages that need it. Verify the widget's appearance in preview first.
2. **Change needed (high): GHL external tracking runs on inquiry-form pages with no GA-style consent.** By its own name, this script tracks forms. Its remote code is unverified, so it may read the name, email, phone or message fields. The new GA4 preference does **not** control it. **Owner decision:** keep it (and disclose it), gate it, or remove it. Do not describe GA consent as covering it.
3. **Change likely needed (medium): the chat widget appears on pages that collect phone numbers and on utility pages.** The file's own A2P rule says pages that collect phone numbers must not show the chat. Yet the homepage and `/get-started` both render InquiryForm, which has a phone field, and the chat is not excluded there. `/.lovable/oauth/consent`, `/unauthorized` and unknown routes are not excluded either. **Proposed fix:** a public allowlist, like the one in analytics-policy, instead of a prefix denylist. This needs the owner to confirm the A2P intent for the homepage.
4. **Change needed (medium, wording only): the privacy policy does not mention optional analytics or the GHL chat, review and tracking scripts.** `src/pages/PrivacyPolicyPage.tsx` covers SMS and phone sharing only. It needs accurate wording:
   - Optional Google Analytics is staged and runs only with opt-in.
   - The chat, review and inquiry-tracking providers operate independently of that preference.
   - Withdrawing consent stops future GA collection only.

   The owner or a legal adviser should review the wording before activation. No compliance claim is made.
5. **No change needed:**
   - Navigation links: the footer links to `/privacy-policy` (`Footer.tsx:259`) and the analytics settings control (`Footer.tsx:265`).
   - GA4 route privacy: GA uses an exact public allowlist and never sends query strings, hashes or IDs.
   - Duplicate Google tags: source contains exactly one gtag loader, and none are injected by index.html, postbuild or headers. Whether the remote GHL scripts or the hosting inject a second Google tag is **unverified**; script names alone are not evidence of a duplicate. Check the live network log during the authorized release validation.
6. **Low (consistency):** `public/_headers` sends `X-Robots-Tag: noindex, nofollow` for `/book`, while the page metadata says `noindex, follow`. Crawl-safe either way. Align them only if the owner wants link-following signals.
7. **Low:** `index.html` preconnects to GHL hosts on every page, private ones included. This makes connections but sends no page data. Revisit it alongside finding 1.

## Release gates still open
- Owner decisions on findings 1–4.
- Privacy wording review.
- Authorized publication, then live Test installation, Realtime, DebugView and network-payload validation, including a duplicate-tag check.
- The full production build/prerender (manual builds remain prohibited).
- The live www 302, the soft-404 and the legacy stubs.

Both GA source gates stay false. This audit closes the inventory gap for measurement. It does not claim SEO or lead growth, or that the four-service SEO work is complete.

## Update: finding 1 resolved in source (2026-10-26, preview only)
- **What was searched:** all of `src/`, `public/` and `index.html` for `reputationhub`, `review-widget`, `review_widget`, `GOOGLE_REVIEWS_WIDGET_URL` and iframe/widget embeds.
- **What renders the reviews:** `ReviewsWidgetSection.tsx` (homepage and /reviews) uses `GoogleReviews.tsx`, which uses `loadFeaturedReviews`, `FeaturedReviewCards` and `FeaturedReviewCard`, plus Google Maps/g.page links. Admin uses `AdminGoogleReviews.tsx`. No component has an embed iframe or widget element. The only other reference is the unused exported constant `GOOGLE_REVIEWS_WIDGET_URL` in `src/lib/google-business.ts`, which was left unchanged.
- **What changed:** removed the global review-widget script and the reputationhub preconnect/dns-prefetch from `index.html`. Chat, external tracking, the other preconnects, the privacy policy and the GA4 gates are unchanged.
- **Evidence (agency-reported):**
  - The new `src/test/review-widget-script.test.ts` passed 3 of 3.
  - Preview /reviews ran with the featured-reviews data mocked and all outside traffic blocked. With 3 mock cards, the cards and Google links rendered at 1280, 375 and 390, and no reputationhub request was made.
  - The empty and error states still show the "Open Google Reviews" link.
- **Limitations:** this does not prove the remote script collected any data. The full production build is still unverified, and a live check is pending after an authorized release.

## Update: finding 3 partly resolved, chat route boundary (2026-10-26, source/preview only)
- **Allowlist:** `src/lib/chat-routes.ts` lists the routes where the chat may load:
  - `/`, `/get-started`, `/services`
  - the four section hubs, plus ceramic and paint correction
  - every `SERVICE_LANDING_PAGES` and `LOCATION_PAGES` slug, except the unavailable `/rv-interior-detailing-baton-rouge`
  - `/about`, `/gallery`, `/reviews`, `/service-areas`, `/privacy-policy`, `/terms-and-conditions`

  A trailing slash is normalized. `GhlChatWidget.tsx` now loads the chat only on these routes. Every other route runs the existing hide/remove cleanup.
- **Newly excluded:** these previously showed chat and now don't:
  - `/unauthorized` and `/.lovable/oauth/consent`
  - `/booking/success` and `/booking/canceled`
  - the legacy `/services/*` and `/terms` stubs, and `/quote` before its redirect
  - the unavailable RV interior page
  - any unknown path, such as `/manage-booking`
- **Still excluded as before:** book/booking, cancel, rate, contact, memberships, auth, reset-password, account, admin, worker and reschedule.
- **Credential-like links:** if the query string or hash contains a parameter named token, access_token, refresh_token, code, type, booking/bookingId, id, email, key, sig/signature, otp or state, the chat does not load, even on an allowed page. Values are never read or sent. Ordinary campaign tags such as `?utm_source=` still allow it.
- **Unchanged pending owner decision:** the homepage and `/get-started` still show both the chat and the inquiry form with its phone field. Whether to keep that overlap is your call. The inquiry-form tracker, the CRM, the privacy policy, prices and both GA gates are unchanged.
- **Limitation:** once the remote chat bundle has executed on an allowed page, client-side navigation to a private page removes the loader tag and widget elements, but it cannot unload the running code. This change does not establish that no data is collected after such a navigation. A direct load of a private page never injects the chat.
- **Evidence (agency-reported):**
  - `src/test/chat-routes.test.tsx`: 6 of 6 passed, using a fake loader with no network. It covers public, private and unknown routes, credential-like queries and hashes, direct loads, a single delayed injection, and cancellation when navigating public→private.
  - Full suite: 454 tests across 50 files. Three page-content tests first failed because two copies of a helper tool were installing at the same time. Rerun one at a time, all 11 tests in those files passed.
  - No browser layout check was needed, since nothing visible changed. The full production build is still unverified.
