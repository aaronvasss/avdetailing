/**
 * Shared content for the car ceramic coating page and its initial-HTML
 * fallback. Facts: System X coatings (owner-confirmed), tier names 3/6/10-year
 * (internal "5-year" key = 6-Year), prices from CERAMIC_BOOKING_PRICES.
 * No product line, certification, warranty, guaranteed lifespan or bundled
 * paint correction is claimed.
 */
import { CERAMIC_BOOKING_PRICES, CERAMIC_TIER_LABELS, type CeramicTier } from "./pricing";

export const CERAMIC_PATH = "/ceramic-coating-baton-rouge";

export const CERAMIC_SEO = {
  path: CERAMIC_PATH,
  h1: "Ceramic Coating in Baton Rouge, LA",
  title: "System X Ceramic Coating in Baton Rouge | 3, 6 & 10-Year Tiers | AV Detailing",
  description:
    "Compare System X ceramic coating tiers for cars, SUVs and trucks in Baton Rouge: 3-year, 6-year and 10-year starting prices, paint assessment first, mobile service.",
  intro:
    "AV Detailing applies System X ceramic coatings at your home or office in Baton Rouge in three tiers: 3-year, 6-year and 10-year. A coating adds a protective layer over clear coat that makes routine washing easier. Because it seals in whatever is underneath, we look at your paint first; swirls or scratches you want reduced are handled with paint correction, which is quoted separately.",
};

export interface CeramicTierContent {
  key: CeramicTier;
  name: string;
  label: string;
  summary: string;
  points: string[];
}

/** Display order matches the existing card layout (3 · 10 · 6). */
export const CERAMIC_TIERS: CeramicTierContent[] = [
  { key: "3-year", name: `System X ${CERAMIC_TIER_LABELS["3-year"].replace(" Protection", "")}`, label: "Shortest tier",
    summary: "The entry System X tier and the lowest starting price.",
    points: ["System X ceramic coating, 3-Year tier", "Paint assessment before coating", "Care instructions after install"] },
  { key: "10-year", name: `System X ${CERAMIC_TIER_LABELS["10-year"].replace(" Protection", "")}`, label: "Longest tier",
    summary: "The longest-named System X tier we offer.",
    points: ["System X ceramic coating, 10-Year tier", "Paint assessment before coating", "Care instructions after install"] },
  { key: "5-year", name: `System X ${CERAMIC_TIER_LABELS["5-year"].replace(" Protection", "")}`, label: "Middle tier",
    summary: "The middle System X tier between the 3-Year and 10-Year options.",
    points: ["System X ceramic coating, 6-Year tier", "Paint assessment before coating", "Care instructions after install"] },
];

export const tierPrices = (key: CeramicTier) => ({
  car: CERAMIC_BOOKING_PRICES.car[key],
  suvTruck: CERAMIC_BOOKING_PRICES["suv-truck"][key],
});

export const CERAMIC_STEPS = [
  "Book online and choose Ceramic Coating, your vehicle type and tier — or call to talk it through first.",
  "On arrival we check the paint condition with you.",
  "If swirls or defects should be addressed first, we recommend paint correction and confirm that scope and price before starting.",
  "We prepare the surface and apply the System X coating.",
  "We walk around the vehicle with you and go over care instructions.",
];

export const CERAMIC_BUYING_GUIDANCE = [
  "Starting prices depend on vehicle type: sedans and coupes, or SUVs and trucks.",
  "Paint correction is a separate service; see paint correction options and prices before you book.",
  "Tell us about previous coatings, recent paintwork or problem areas in your booking notes.",
  "Plan for a full-day (about 8-hour) appointment at your home or office.",
  "Ask us how to wash and maintain the coating; we go over care at the end of the visit.",
];

export const CERAMIC_LINKS = [
  { href: "/paint-correction-baton-rouge", text: "Paint correction in Baton Rouge" },
  { href: "/car-detailing-baton-rouge", text: "Car detailing packages" },
  { href: "/book", text: "Book ceramic coating online" },
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

export function ceramicPageHtml(): string {
  const tiers = CERAMIC_TIERS.map((t) => {
    const p = tierPrices(t.key);
    return `<li><strong>${esc(t.name)}</strong> — from ${usd(p.car)} (sedans &amp; coupes), from ${usd(p.suvTruck)} (SUVs &amp; trucks). ${esc(t.summary)}</li>`;
  }).join("");
  return [
    `<h1>${esc(CERAMIC_SEO.h1)}</h1>`,
    `<p>${esc(CERAMIC_SEO.intro)}</p>`,
    `<h2>System X Coating Tiers</h2><ul>${tiers}</ul>`,
    `<h2>How It Works</h2><ol>${CERAMIC_STEPS.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`,
    `<h2>Before You Book</h2><ul>${CERAMIC_BUYING_GUIDANCE.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>`,
    `<h2>Related services</h2><ul>${CERAMIC_LINKS.map((l) => `<li><a href="${l.href}">${esc(l.text)}</a></li>`).join("")}</ul>`,
    `<p>Call <a href="tel:2255216264">(225) 521-6264</a> with questions.</p>`,
  ].join("");
}
