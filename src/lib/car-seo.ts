/**
 * One source for car-section SEO: hub, mobile, interior and paint-correction
 * metadata, package inclusion facts and related links. Rendered pages and the
 * postbuild initial HTML both read from here. Inclusions mirror the active
 * car packages (Basic / Silver / Gold) and active add-ons; prices come only
 * from pricing.ts. Ceramic durations are intentionally absent here.
 */
export const CAR_HUB_PATH = "/car-detailing-baton-rouge";
export const CAR_AREAS = "Baton Rouge, Prairieville, Gonzales, Denham Springs, Walker, Central, Zachary and nearby areas";

export const CAR_HUB_SEO = {
  path: CAR_HUB_PATH,
  title: "Car Detailing in Baton Rouge, LA: Packages & Prices | AV Detailing",
  description:
    "Compare AV Detailing's Basic, Silver and Gold car detailing packages in Baton Rouge. See what each includes and starting prices, then book mobile service at your location.",
  h1: "Car Detailing in Baton Rouge, LA",
  intro:
    "Compare our Basic, Silver and Gold car detailing packages, see what each one includes and pick the right level for your vehicle. We come to your home or office in " + CAR_AREAS + ".",
};

export const MOBILE_CAR_SEO = {
  slug: "mobile-car-detailing-baton-rouge",
  title: "Mobile Car Detailing in Baton Rouge: How Our Visits Work",
  seoTitle: "Mobile Car Detailing in Baton Rouge | How Visits Work | AV Detailing",
  description:
    "How AV Detailing's mobile car detailing works in Baton Rouge: booking, the 30-minute arrival window, appointment hours and what to have ready at your home or office.",
};

export const INTERIOR_CAR_SEO = {
  slug: "interior-detailing-baton-rouge",
  title: "Interior Car Detailing & Seat Shampoo in Baton Rouge",
  seoTitle: "Interior Car Detailing & Seat Shampoo in Baton Rouge | AV Detailing",
  description:
    "Interior car detailing in Baton Rouge: see which package covers vacuuming, wipe-downs, seat and upholstery shampoo and carpet deep cleaning. Seat shampoo is in Gold.",
};

export const PAINT_CORRECTION_SEO = {
  path: "/paint-correction-baton-rouge",
  title: "Paint Correction in Baton Rouge, LA | AV Detailing",
  description:
    "Paint correction in Baton Rouge: we assess your paint, then recommend a 1-step, 2-step or 3-step option. Results depend on paint condition and clear coat. Mobile service.",
  h1: "Paint Correction in Baton Rouge, LA",
  intro:
    "Swirls, water spots, haze and light scratches can often be reduced or removed with machine polishing. We start by assessing your paint, test a small area, and recommend a 1-step, 2-step or 3-step option. How much improvement is possible depends on the depth of each defect and how much clear coat is available, so some marks may remain. Correction is also the usual preparation before ceramic coating.",
};

/** Interior work by package, as shown on the car hub's package cards. */
export const CAR_INTERIOR_BY_PACKAGE: { name: "Basic Package" | "Silver Package" | "Gold Package"; slug: string; interior: string[]; excludes?: string }[] = [
  { name: "Basic Package", slug: "basic", interior: ["Light interior vacuum", "Interior wipe down — dashboard, console, door panels"], excludes: "No seat shampoo or carpet deep clean." },
  { name: "Silver Package", slug: "silver", interior: ["Deep vacuum — seats, carpets, mats, trunk", "Console, cup holders & door panel detail", "Dashboard & trim cleaning"], excludes: "Seat shampoo not included — upgrade to Gold." },
  { name: "Gold Package", slug: "gold", interior: ["Everything in Silver", "Seat & upholstery shampooing", "Leather cleaning & conditioning", "Carpet deep clean"] },
];

/**
 * Add-ons customers can currently select at the booking add-ons step. BookingPage
 * lists every active service_add_ons row (no service filter) and create-booking
 * accepts any active add-on id, so all five are selectable for car bookings.
 * Names only; prices always come from the catalog at booking time.
 */
export const CAR_ACTIVE_ADD_ONS = ["Clay Bar Treatment", "Engine Bay Cleaning", "Headlight Restoration", "Odor Elimination", "Pet Hair Removal"];

export const CAR_RELATED_LINKS = [
  { href: CAR_HUB_PATH, text: "Compare car detailing packages in Baton Rouge" },
  { href: "/mobile-car-detailing-baton-rouge", text: "How mobile car detailing visits work" },
  { href: "/interior-detailing-baton-rouge", text: "Interior car detailing and seat shampoo" },
  { href: "/paint-correction-baton-rouge", text: "Paint correction assessment and options" },
  { href: "/ceramic-coating-baton-rouge", text: "Ceramic coating options" },
  { href: "/exterior-detailing-baton-rouge", text: "Exterior car detailing choices" },
  { href: "/headlight-restoration-baton-rouge", text: "Headlight restoration add-on" },
  { href: "/engine-bay-cleaning-baton-rouge", text: "Engine bay cleaning add-on" },
  { href: "/odor-removal-baton-rouge", text: "Car odor removal" },
  { href: "/pet-hair-removal-baton-rouge", text: "Pet hair removal for cars" },
];

export const relatedCarLinks = (selfPath: string) => CAR_RELATED_LINKS.filter((l) => l.href !== selfPath);

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const linkList = (selfPath: string) =>
  `<ul>${relatedCarLinks(selfPath).map((l) => `<li><a href="${l.href}">${esc(l.text)}</a></li>`).join("")}</ul>`;

export function interiorPackagesHtml(): string {
  return `<h2>Which package includes the interior work you need</h2><ul>${CAR_INTERIOR_BY_PACKAGE.map(
    (p) => `<li><strong>${esc(p.name)}</strong>: ${esc(p.interior.join("; "))}.${p.excludes ? ` ${esc(p.excludes)}` : ""}</li>`,
  ).join("")}</ul><p>Available add-ons: ${esc(CAR_ACTIVE_ADD_ONS.join(", "))}.</p>`;
}

/** Initial HTML for the car hub; package prices come from the caller (pricing.ts). */
export function carHubHtml(prices: { basic: string; silver: string; gold: string }): string {
  const priceBy: Record<string, string> = { "Basic Package": prices.basic, "Silver Package": prices.silver, "Gold Package": prices.gold };
  return [
    `<nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/services">Services</a> / <span aria-current="page">Car Detailing</span></nav>`,
    `<h1>${esc(CAR_HUB_SEO.h1)}</h1>`,
    `<p>${esc(CAR_HUB_SEO.intro)}</p>`,
    `<h2>Detailing Packages</h2><ul>${CAR_INTERIOR_BY_PACKAGE.map((p) => `<li><a href="/book?service=car&amp;package=${p.slug}">${esc(p.name)}</a> from ${esc(priceBy[p.name])} (sedans &amp; coupes)</li>`).join("")}</ul>`,
    interiorPackagesHtml(),
    `<h2>Related car services</h2>${linkList(CAR_HUB_PATH)}`,
    `<p>Call <a href="tel:2255216264">(225) 521-6264</a> or <a href="/book">book online</a>.</p>`,
  ].join("");
}

export function paintCorrectionHtml(tiers: { name: string; price: string; duration: string; description: string }[]): string {
  return [
    `<nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="${CAR_HUB_PATH}">Car Detailing</a> / <span aria-current="page">Paint Correction</span></nav>`,
    `<h1>${esc(PAINT_CORRECTION_SEO.h1)}</h1>`,
    `<p>${esc(PAINT_CORRECTION_SEO.intro)}</p>`,
    `<h2>Correction options</h2><ul>${tiers.map((t) => `<li><strong>${esc(t.name)}</strong> from ${esc(t.price)} — ${esc(t.description)} Typical time: ${esc(t.duration)}.</li>`).join("")}</ul>`,
    `<h2>Related car services</h2>${linkList(PAINT_CORRECTION_SEO.path)}`,
    `<p>Call <a href="tel:2255216264">(225) 521-6264</a> or <a href="/book">book online</a>.</p>`,
  ].join("");
}

/** Paint options mirror the active paint packages (name, duration, description). */
export const PAINT_OPTIONS = [
  { name: "1-Step Polish", duration: "4–6 hours", description: "Light correction for minor swirls and haze." },
  { name: "2-Step Correction", duration: "6–8 hours", description: "Moderate correction for swirls and water spots." },
  { name: "3-Step Restoration", duration: "8–12 hours", description: "Our most intensive option for heavier damage." },
];
