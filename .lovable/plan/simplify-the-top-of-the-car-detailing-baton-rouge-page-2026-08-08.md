# Simplify the top of the Car Detailing Baton Rouge page

## Goal
Tighten the hero/top section of `/car-detailing-baton-rouge` so it immediately shows the H1 and service-area text, then jumps straight into the Detailing Packages section. Preserve SEO metadata and all package content.

## Changes

### Hero section (`src/pages/CarDetailingBatonRougePage.tsx`, lines 127–185)

1. **Keep the breadcrumb** (lines 115–125) unchanged.
2. **Remove the badge** at lines 131–134: the `Mobile Detailing • Baton Rouge, LA` pill with the car icon.
3. **Replace the H1** at line 135 with:  
   `Car Detailing Baton Rouge, LA`  
   Reduce mobile font size so it is strong but not oversized (e.g., `text-3xl` on mobile, `md:text-4xl`, `lg:text-5xl`).
4. **Replace the long paragraph** at lines 138–155 with the short service-area text:  
   `Serving Baton Rouge, Prairieville, Gonzales, Denham Springs, Walker, Central and nearby areas.`  
   Keep it compact with comfortable line spacing and a max-width that keeps it to roughly three lines on a normal phone.
5. **Remove the CTA buttons** at lines 157–167: the `Book Online` button and the telephone button.
6. **Remove the Consumer Reports link** that is inside the current paragraph.
7. **Remove the service-area chips** at lines 169–183 (the `Serving:` list of pills) because the new service-area sentence already covers this.
8. **Reduce vertical padding** in the hero section (currently `py-14 md:py-20`) to remove unnecessary empty space, e.g., `py-8 md:py-12`.

### Detailing Packages section (lines 187–280)

9. **Place the Detailing Packages section immediately after** the new service-area text. No extra content between them. The existing section header and all three package cards remain unchanged.

### Guardrails

- Do not use hyphens, en dashes or em dashes anywhere in the visible hero text (H1, service-area sentence, or package section header text is already clean, but verify the hero copy uses only commas and spaces).
- Preserve the `<SEOHead>` title, description, canonical path, and all `<JsonLd>` structured data exactly as they are.
- Preserve the existing package cards, pricing, and content.
- Preserve the rest of the page below the Detailing Packages section unchanged.

## Verification
- Visually confirm the page on mobile that the H1 is not oversized, the service-area text is compact, and the first package card appears immediately below.
- Confirm the page title, meta description, canonical URL, and JSON-LD are unchanged.
