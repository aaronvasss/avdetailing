import { FALLBACK_PACKAGES } from "./pricing-fallback";

/**
 * One source for RV/motorhome SEO content: the /rv-detailing-baton-rouge hub,
 * the exterior RV supporting pages and the unavailable RV-interior page.
 * Rendered pages and postbuild initial HTML both read from here.
 * RV service is exterior-only (owner policy); never advertise interior work.
 */
export const RV_HUB_PATH = "/rv-detailing-baton-rouge";
export const RV_INTERIOR_PATH = "/rv-interior-detailing-baton-rouge";
export const RV_EXTERIOR_WASH_NAME = "RV Exterior Wash";

/** Fallback price for initial HTML; the rendered page reads live pricing. */
export const RV_EXTERIOR_WASH_FALLBACK_PRICE =
  FALLBACK_PACKAGES.find((p) => p.service === "rv" && p.name === RV_EXTERIOR_WASH_NAME)?.price ?? null;

export const RV_HUB_SEO = {
  path: RV_HUB_PATH,
  title: "Exterior RV Detailing in Baton Rouge, LA | AV Detailing",
  description:
    "Exterior-only RV and motorhome detailing in Baton Rouge: RV exterior wash, oxidation removal, ceramic coating and roof cleaning. Tell us your RV, condition and location for a plan.",
  h1: "Exterior RV & Motorhome Detailing in Baton Rouge, LA",
  intro:
    "AV Detailing provides exterior-only detailing for motorhomes, fifth wheels and travel trailers in Baton Rouge and surrounding areas. Choose an RV exterior wash, oxidation removal, ceramic coating or roof cleaning, and we confirm the right scope after reviewing your RV, its condition and where it is parked. We do not offer RV interior or upholstery cleaning.",
};

export interface RvLink { href: string; text: string; description: string }

/** Exterior RV pages, linked from the hub and from each other. */
export const RV_EXTERIOR_LINKS: RvLink[] = [
  { href: "/mobile-rv-detailing-baton-rouge", text: "Mobile RV detailing logistics", description: "How on-site service works at your home, storage lot or campground, and what we need to plan the visit." },
  { href: "/rv-oxidation-removal-baton-rouge", text: "RV oxidation removal", description: "Compounding and polishing for chalky or faded fiberglass, assessed on a test area first." },
  { href: "/rv-ceramic-coating-baton-rouge", text: "RV ceramic coating", description: "Exterior surface protection applied after washing and any needed polishing." },
  { href: "/rv-roof-cleaning-baton-rouge", text: "RV roof cleaning", description: "Roof cleaning, quoted after we review roof material, condition and access." },
];

/** What customers should send so the exterior scope can be confirmed. */
export const RV_BUYING_GUIDANCE: string[] = [
  "Your RV type, year, make and model (motorhome, fifth wheel or travel trailer).",
  "The exterior work you want: wash, oxidation removal, ceramic coating, roof cleaning or a combination.",
  "Current condition — oxidation, black streaks, water spots or previous coatings — with photos if you have them.",
  "Where the RV is parked (home, storage lot or campground) and any site rules for washing.",
  "Your preferred dates and the best phone number or email to reach you.",
];

export const RV_HUB_FAQ_NOTE =
  "Final pricing for oxidation removal and ceramic coating depends on the RV and its condition, so we confirm it with you before work begins.";

export function rvExteriorWashPriceLabel(price: number | null) {
  return price == null ? null : `${RV_EXTERIOR_WASH_NAME} from $${Math.round(price).toLocaleString("en-US")}`;
}

export const RV_INTERIOR_UNAVAILABLE = {
  path: RV_INTERIOR_PATH,
  title: "RV Interior Detailing Not Offered | AV Detailing",
  description:
    "AV Detailing does not offer RV interior detailing. See our exterior RV services in Baton Rouge: exterior wash, oxidation removal, ceramic coating and roof cleaning.",
  h1: "RV Interior Detailing Is Not Offered",
  message:
    "AV Detailing does not provide RV or motorhome interior, upholstery or carpet cleaning. Our RV service is exterior-only. If your RV needs exterior care, these options are available in Baton Rouge and surrounding areas.",
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const linksHtml = (links: RvLink[]) =>
  `<ul>${links.map((l) => `<li><a href="${l.href}">${esc(l.text)}</a> — ${esc(l.description)}</li>`).join("")}</ul>`;

export function rvHubHtml(price = RV_EXTERIOR_WASH_FALLBACK_PRICE): string {
  const priceLabel = rvExteriorWashPriceLabel(price);
  return [
    `<nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/services">Services</a> / <span aria-current="page">RV Detailing</span></nav>`,
    `<h1>${esc(RV_HUB_SEO.h1)}</h1>`,
    `<p>${esc(RV_HUB_SEO.intro)}</p>`,
    `<h2>Exterior RV services</h2>`,
    priceLabel ? `<p>${esc(priceLabel)}. ${esc(RV_HUB_FAQ_NOTE)}</p>` : `<p>${esc(RV_HUB_FAQ_NOTE)}</p>`,
    linksHtml(RV_EXTERIOR_LINKS),
    `<h2>What to tell us about your RV</h2><ul>${RV_BUYING_GUIDANCE.map((g) => `<li>${esc(g)}</li>`).join("")}</ul>`,
    `<p>Call <a href="tel:2255216264">(225) 521-6264</a> or <a href="/book">book online</a>.</p>`,
  ].join("");
}

export function rvInteriorUnavailableHtml(): string {
  return [
    `<nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="${RV_HUB_PATH}">RV Detailing</a> / <span aria-current="page">RV Interior</span></nav>`,
    `<h1>${esc(RV_INTERIOR_UNAVAILABLE.h1)}</h1>`,
    `<p>${esc(RV_INTERIOR_UNAVAILABLE.message)}</p>`,
    `<h2>Exterior RV options</h2>`,
    linksHtml([{ href: RV_HUB_PATH, text: "Exterior RV detailing overview", description: "All exterior RV services and what to send us." }, ...RV_EXTERIOR_LINKS]),
    `<p>Questions? Call <a href="tel:2255216264">(225) 521-6264</a>.</p>`,
  ].join("");
}
