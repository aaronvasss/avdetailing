# Local SEO expansion — November 7, 2026

## Results
- One genuinely new route: `/car-detailing-brusly-la`. Existing `/car-detailing-baker-la`, `/car-detailing-port-allen-la` and `/car-detailing-perkins-road-baton-rouge` refreshed rather than duplicated. Twelve location pages total.
- Baker copy uses East Baton Rouge Parish. Port Allen and Brusly use West Baton Rouge Parish, across the Mississippi River from Baton Rouge. Perkins page lists Southdowns, LSU Lakes, Country Club of Louisiana and Mira Vista as owner-confirmed served areas; it does not assert they all lie directly on Perkins Road. New/refreshed entries have unique H1/title/description/intro/neighborhoods and online/call/text guidance.
- Bocage was already explicitly present in Highland Road intro, description and neighborhoods; retained without an unnecessary edit.
- Homepage Service Areas grid, footer Detailing by City and /service-areas use NEW_LOCATION_AREAS, so all four requested entries appear automatically. Every location page has three geographically nearby public service links, shared with initial HTML. Owner full area list appears in footer, homepage FAQ and llms.txt.
- One business node with `@type: ["AutoWash", "LocalBusiness"]`, stable `@id`, legalName AV Detailing LLC and founder Aaron Vasquez. Existing service geography retained; Southdowns/Perkins Road/LSU Lakes added as Place without invented coordinates. Postbuild recognizes both string and array types, removes duplicate businesses and refreshes legacy captured nodes to the current identity. Fixed top-level Service detection so nested OfferCatalog services cannot suppress route Service areaServed.
- Requested payment method list is cash, credit cards, debit cards, Cash App and Venmo; schema exact value `Cash, Credit Card, Debit Card, Cash App, Venmo`. FAQ retains online/service-time choices and a recurring-membership billing sentence. FAQ schema comes from the same answer data. No payment enforcement or existing payment destination removed.
- New excluded-services FAQ: mechanical repair, windshield repair/replacement, body work, paint repair, dent repair, oil changes, tire services; professional detailing only. Paint correction remains an established distinct detailing service.
- Owner-confirmed text-only “110+ five-star Google reviews” links to existing CID at hero badges and Google review heading. Live review data/attribution/empty handling untouched; no aggregateRating or Review schema.
- Homepage title is `Mobile Car Detailing Baton Rouge | AV Detailing` in shared route metadata/static title/social fallback; description unchanged. Removed global keywords. Homepage images already had alt attributes; the decorative polisher icon already had alt="", now also aria-hidden="true".
- Unknown client routes render Page not found with SEOHead noindex,follow and no canonical/og:url pointing to home; recovery links Home/Services/Service Areas/Book. Postbuild emits optional standalone `404.html` with visible missing-page content, noindex,follow, no canonical and matching links.
- llms.txt removes unavailable RV interior URL, states exterior-only RV scope, adds requested area entries/full areas/legal identity/owner trust/booking/payment methods/exclusions and directs price questions to service pages. Removed existing misleading boat/aircraft/RV link descriptions while preserving public destinations.

## Withheld and unverified
**No universal “no extra processing fees” promise added.** Read-only source review found TermsAndConditionsPage still states online payments include a 3.5% processing fee; card-wallet states processing fees already included, and checkout uses saved total without adding another fee. That supports no second fee on the approved total, not a universally fee-free policy. Owner forbids changing payments/totals: existing logic and terms are unchanged. FAQ/schema/llms list requested methods without the conflicting promise. Reconciliation remains open; no fee policy inferred or changed.

**True HTTP 404 remains unverified.** Source hosting config only establishes headers, not status/fallback handling. `404.html` is prepared but no host setting changed and no live publication occurred. Its presence is not proof the static host uses it for unknown paths or returns HTTP404; the current live soft-404 is not claimed fixed.

## Checks
- Lovable-run full suite: **678 tests / 62 files passed**. New tests cover exact routes, all unique location titles/H1/descriptions, strict metadata limits, nearby targets, sitemap/prerender membership, exact legal identity/methods, FAQ/schema parity, llms links only to sitemap-indexable routes, multi-type duplicate normalization, location Service areaServed, initial FAQ facts and noindex NotFound/404 fallback.
- Source/preview browser checks: all four locations at **1280×1800**, **375×812 DPR2**, **390×844 DPR3**; no horizontal overflow or page errors. Port Allen → Brusly nearby link; homepage title/all four links/trust text/image alt presence; FAQ buttons; unknown route robots/no canonical; NotFound → Service Areas/all four links passed. External requests blocked, no forms or customer actions.
- Screenshots inspected: mobile Brusly nearby block, mobile NotFound and desktop homepage FAQ region. Review provider content was not fetched in blocked-network browser checks; review heading trust placement verified in source. No new live review claim beyond owner's authorized static line.
- Automatic preview validation: **build OK**. Isolated postbuild tests exercise initial HTML with fixture assets, not a manual production build. Full production build/prerender and live deployment not independently verified.
- No price/package/booking/payment/scheduling/backend/contact/analytics gate changes, publishing or deployment. Existing derived public analytics/chat lists automatically include Brusly from location data; no tracker activation/new measurement code, and both analytics gates remain false. Analytics route-count regression updated to reflect existing derivation.

## Changed files
New:
- src/lib/local-expansion.ts
- src/lib/not-found-seo.ts
- src/lib/schema-node.ts
- src/test/local-expansion.test.tsx
- docs/local-seo-expansion-2026-11-07.md

Updated:
- AGENTS.md
- roadmap.md
- index.html
- vite.config.ts
- public/sitemap.xml
- public/llms.txt
- scripts/postbuild-seo.ts
- src/data/locationPages.ts
- src/components/locations/LocationLandingTemplate.tsx
- src/components/seo/schema.ts
- src/lib/public-business-facts.ts
- src/lib/static-route-seo.ts
- src/components/layout/Footer.tsx
- src/components/home/FAQSection.tsx
- src/components/home/HeroSection.tsx
- src/components/home/ServicesSection.tsx
- src/components/reviews/GoogleReviews.tsx
- src/pages/NotFound.tsx
- src/test/location-pages.test.ts
- src/test/seo-batch-one.test.tsx
- src/test/seo-batch-four-b.test.tsx
- src/test/seo-batch-two.test.ts
- src/test/public-hours.test.ts
- src/test/boat-seo.test.ts
- src/test/analytics-runtime.test.ts

No edit required in sitemap generator (already derives location entries), homepage ServiceAreasSection or ServiceAreasPage (already derive the shared four entries), SEOHead (already supports follow and omitted canonical), or robots.txt (indexing policy unchanged).