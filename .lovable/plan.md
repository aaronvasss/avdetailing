# Read-only SEO baseline and targeting audit: cars, RV/motorhomes, boats

This is a read-only audit. Nothing in the site's source, the database, prices, payment or booking will change, and nothing will be published or deployed. The aviation work stays as it is. The only thing I'll save is one audit document.

## 1. Collect the baseline (read-only)
- **Search Console** (the existing read-only connection, after confirming the verified property): clicks, impressions, CTR and average position for each page from July 25 to October 23, 2026, plus non-brand queries for each page.
  - Cars: car, ceramic, paint correction and interior pages
  - RV: RV and motorhome pages, including the indexed `rv-interior-detailing` page
  - Boats: boat, hull, pontoon and gelcoat pages
  - Directory: `/services`
- **Google's index:** check how Google currently stores the main page for each section, `rv-interior-detailing` and `/services`.
- **Semrush:** used only where it adds something, such as local phrases with no Search Console data. Each figure will be labeled as a Semrush estimate with its market (US). Missing data will be called unknown, not zero.

## 2. Compare three versions of each page
For every page in scope, I'll compare the source code, the live published HTML and the preview's prerendered HTML:
- title, description, H1 and headings
- canonical tag, robots directives and sitemap entry
- structured data: one business entity, plus Service and FAQ data only where it matches visible content
- internal links, and whether important content appears before scripts run

Each difference will be marked as "live", "preview-only" or "source-only".

## 3. Check claims against authoritative sources
- **Prices:** compare page prices with `src/lib/pricing.ts`, the active package and membership catalog (read-only) and saved owner policies.
- **Ceramic coating:** the pages disagree on a 5-year vs 6-year tier. I'll identify the authoritative existing source and leave any uncertain fact as an owner question.
- **RV:** service is exterior-only. The `rv-interior-detailing` page will be documented as conflicting legacy content (Search Console data, index state, links pointing to it, sitemap). I'll give recommendations only: no redirect, deletion or noindex.
- **Boats:** list any marine certification, product or guaranteed-result claims that need documentation. No claims will be invented.
- **Filler:** flag generic UV, traffic and authority-link wording where verified scope and actual customer decisions would serve better.

## 4. /services and links that lose the selected service
- **/services:** compare its current noindex/nofollow setting with its prerender, sitemap and internal-link role. Recommend one coherent treatment, either indexable directory or noindex but followable, with the tradeoffs.
- **Quote and booking links:** list every quote or booking link on car, RV and boat pages that opens booking without the service already selected, with its file and line.

## 5. Deliverable
I'll save `/mnt/documents/seo-audit-car-rv-boat-2026-10-26.md`, kept concise and source-backed, containing:
- a baseline table for each page, with data sources labeled
- the top five actionable improvements for each section, in priority order, covering intent and overlap, metadata, missing buying information, links and schema, and crawlability
- exact files for later fixes, such as `src/data/serviceLandingPages.ts`, `ServiceLandingTemplate.tsx`, `scripts/postbuild-seo.ts`, `scripts/generate-sitemap.ts` and the page files
- open owner questions (ceramic tiers, RV interior page, boat claims and inclusions)

Afterwards you'll get a short summary in chat. `roadmap.md` will not change, because this is read-only.

## Technical notes
- **Read-only tools only:** Search Console gateway GET/POST queries, URL Inspection, Semrush, website fetch, `rg`/view and read-only SQL.
- **No writes:** no messages, bookings, payments, new connections or production changes.
