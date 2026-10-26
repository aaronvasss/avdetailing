import { FALLBACK_PACKAGES } from "./pricing-fallback";

/**
 * One source for boat-section SEO: hub content, package scope (mirrors the
 * active boat packages' catalog descriptions), boat page links and inquiry
 * guidance. Rendered pages and postbuild initial HTML both read from here.
 * No marine product identity, certification, lifespan or warranty is stated.
 * Hull cleaning is owner-confirmed as trailer or lift only (never in-water).
 */
export const BOAT_HUB_PATH = "/boat-detailing-baton-rouge";
export const BOAT_AREAS = "Baton Rouge, Gonzales, Prairieville, Walker, Denham Springs, Central and nearby areas";

export const BOAT_HUB_SEO = {
  path: BOAT_HUB_PATH,
  title: "Boat Detailing in Baton Rouge, LA: Packages & Services | AV Detailing",
  description:
    "Mobile boat detailing in Baton Rouge: compare Boat Wash & Wax, Full Detail and Premium Detail, plus ceramic coating, gelcoat, hull and pontoon care quotes.",
  h1: "Boat Detailing in Baton Rouge, LA",
  intro:
    "AV Detailing is a mobile detailing service for boats in " + BOAT_AREAS + ". Compare our three boat packages below, or ask for an assessment for ceramic coating, gelcoat restoration, hull cleaning or pontoon care. Tell us about your boat, where it is kept and the work you want, and we will confirm the scope and price.",
};

export type BoatPackageName = "Boat Wash & Wax" | "Boat Full Detail" | "Boat Premium Detail";

/** Scope exactly as described in the active boat packages. */
export const BOAT_PACKAGES: { name: BoatPackageName; scope: string; duration: string }[] = [
  { name: "Boat Wash & Wax", scope: "Exterior wash, wax and vinyl cleaning.", duration: "2–3 hours" },
  { name: "Boat Full Detail", scope: "Complete interior and exterior detail with oxidation removal.", duration: "4–6 hours" },
  { name: "Boat Premium Detail", scope: "Everything in Full Detail plus compound polish and ceramic sealant.", duration: "6–8 hours" },
];

export const boatFallbackPrice = (name: BoatPackageName) =>
  FALLBACK_PACKAGES.find((p) => p.service === "boat" && p.name === name)?.price ?? null;

export interface BoatLink { href: string; text: string; description: string }

export const BOAT_LINKS: BoatLink[] = [
  { href: "/boat-ceramic-coating-baton-rouge", text: "Boat ceramic coating in Baton Rouge", description: "System X ceramic coating, a separate quoted service from the Premium Detail's ceramic sealant." },
  { href: "/gelcoat-restoration-baton-rouge", text: "Gelcoat restoration assessment", description: "For chalky, faded or oxidized finishes; we review condition before quoting." },
  { href: "/hull-cleaning-baton-rouge", text: "Boat hull cleaning assessment", description: "Waterline and hull staining; tell us how the hull can be reached." },
  { href: "/pontoon-cleaning-baton-rouge", text: "Pontoon boat cleaning and care", description: "Decks, vinyl seating and aluminum logs, matched to a package or quote." },
  { href: "/mobile-boat-detailing-baton-rouge", text: "How mobile boat detailing visits work", description: "Where we can work and what to send before a visit." },
];

export const relatedBoatLinks = (selfPath: string) => [
  ...(selfPath === BOAT_HUB_PATH ? [] : [{ href: BOAT_HUB_PATH, text: "Boat detailing packages and services", description: "" }]),
  ...BOAT_LINKS.filter((l) => l.href !== selfPath),
];

/** What owners should include in an inquiry. */
export const BOAT_INQUIRY_GUIDANCE = [
  "Boat type, year, make, model and length.",
  "Where the boat is kept, and for hull cleaning whether it will be on a trailer or lift (hull work is out of the water only).",
  "The work you want and current condition (oxidation, staining, previous coatings), with photos if you have them.",
  "Any marina or storage rules for washing or detailing on site, and your preferred dates.",
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const money = (n: number | null) => (n == null ? "Custom quote" : `$${Math.round(n).toLocaleString("en-US")}`);

export function boatPackagesHtml(priceOf: (name: BoatPackageName) => number | null = boatFallbackPrice): string {
  return `<h2>Boat detailing packages</h2><ul>${BOAT_PACKAGES.map((p) => `<li><strong>${esc(p.name)}</strong> from ${money(priceOf(p.name))} — ${esc(p.scope)} Typical time: ${esc(p.duration)}.</li>`).join("")}</ul>`;
}

export function boatLinksHtml(selfPath: string): string {
  return `<ul>${relatedBoatLinks(selfPath).map((l) => `<li><a href="${l.href}">${esc(l.text)}</a>${l.description ? ` — ${esc(l.description)}` : ""}</li>`).join("")}</ul>`;
}

export function boatGuidanceHtml(): string {
  return `<h2>What to include in your boat inquiry</h2><ul>${BOAT_INQUIRY_GUIDANCE.map((g) => `<li>${esc(g)}</li>`).join("")}</ul>`;
}

export function boatHubHtml(): string {
  return [
    `<nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/services">Services</a> / <span aria-current="page">Boat Detailing</span></nav>`,
    `<h1>${esc(BOAT_HUB_SEO.h1)}</h1>`,
    `<p>${esc(BOAT_HUB_SEO.intro)}</p>`,
    boatPackagesHtml(),
    `<h2>Boat services</h2>${boatLinksHtml(BOAT_HUB_PATH)}`,
    boatGuidanceHtml(),
    `<p>Call <a href="tel:2255216264">(225) 521-6264</a> or <a href="/book">book online</a>.</p>`,
  ].join("");
}
