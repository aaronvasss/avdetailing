import type { ServiceKey } from "./pricing";

// One source for the /services directory: rendered page, initial HTML and head.
export const SERVICES_DIRECTORY_SEO = {
  path: "/services",
  title: "Mobile Detailing Services in Baton Rouge | AV Detailing",
  description:
    "Browse AV Detailing's Baton Rouge services: car detailing, ceramic coating, paint correction, exterior RV detailing, boat detailing and private-aircraft detailing.",
  h1: "Mobile Detailing Services in Baton Rouge",
};

export const SERVICES_DIRECTORY_ITEMS: { title: string; description: string; href: string; service: ServiceKey; tag: string }[] = [
  { title: "Car Detailing", description: "Complete interior and exterior detailing for sedans, SUVs, and trucks. From quick washes to full restorations.", href: "/car-detailing-baton-rouge", service: "car", tag: "Most Booked" },
  { title: "Ceramic Coating", description: "Paint protection with System X ceramic coating in tiered packages. See the ceramic coating page for current options.", href: "/ceramic-coating-baton-rouge", service: "ceramic", tag: "Premium" },
  { title: "Paint Correction", description: "Remove swirls, scratches, and oxidation to restore your paint's clarity and depth — 1, 2, and 3-step systems.", href: "/paint-correction-baton-rouge", service: "paint", tag: "Restoration" },
  { title: "Boat Detailing", description: "Mobile boat detailing where your boat is kept, including pontoon, hull, gelcoat and System X boat ceramic coating.", href: "/boat-detailing-baton-rouge", service: "boat", tag: "Mobile" },
  { title: "RV Detailing", description: "Exterior-only detailing for motorhomes, fifth wheels and travel trailers: wash, oxidation removal, ceramic coating and roof cleaning.", href: "/rv-detailing-baton-rouge", service: "rv", tag: "Mobile" },
  { title: "Aircraft Detailing", description: "Private-aircraft and private-jet interior deep cleaning, shampooing, polishing and ceramic coating. Scope and access coordinated per job.", href: "/aircraft-detailing-baton-rouge", service: "aircraft", tag: "Aviation" },
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function servicesDirectoryHtml(): string {
  const items = SERVICES_DIRECTORY_ITEMS.map(
    (s) => `<li><h2><a href="${s.href}">${esc(s.title)} in Baton Rouge</a></h2><p>${esc(s.description)}</p></li>`,
  ).join("");
  return `<h1>${esc(SERVICES_DIRECTORY_SEO.h1)}</h1><p>${esc(SERVICES_DIRECTORY_SEO.description)}</p><ul>${items}</ul><p>Call (225) 521-6264 or <a href="/book">book online</a>.</p>`;
}
