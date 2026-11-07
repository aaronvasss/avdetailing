import { CARE_GUIDES, GUIDES_INDEX, GUIDE_PUBLISH_DATE, type CareGuide } from "./guides";
import { SPANISH_PAGES } from "./language-pages";
import { escapeFaqHtml as esc } from "./page-faqs";
import { CAR_PAGE_DISPLAY_FROM, FALLBACK_PACKAGES } from "./pricing-fallback";
import { jobPairHtml } from "./page-extras-html";
import { JOB_GALLERY } from "./job-gallery";
export const EDITORIAL_ROUTES = [GUIDES_INDEX, ...CARE_GUIDES, ...SPANISH_PAGES];
const linksHtml = (links: { href: string; text: string }[]) => `<ul>${links.map(l => `<li><a href="${esc(l.href)}">${esc(l.text)}</a></li>`).join("")}</ul>`;
export function spanishPackagePrices(silver: number, gold: number) {
  const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
  return [{ name: "Basic", price: money(CAR_PAGE_DISPLAY_FROM.basic) }, { name: "Silver", price: money(silver) }, { name: "Gold", price: money(gold) }];
}
export function editorialHtml(path: string, assets: string[]) {
  if (path === GUIDES_INDEX.path) return `<h1>Car &amp; boat care guides</h1><p>${esc(GUIDES_INDEX.description)}</p>${CARE_GUIDES.map(g => `<article><h2><a href="${g.path}">${esc(g.h1)}</a></h2><p>${esc(g.description)}</p></article>`).join("")}`;
  const guide = CARE_GUIDES.find(g => g.path === path);
  const page = guide ?? SPANISH_PAGES.find(p => p.path === path);
  if (!page) return "";
  const job = JOB_GALLERY.find(j => j.key === (guide?.photo ?? "car"));
  const author = guide ? `<p>By AV Detailing · Published <time datetime="${GUIDE_PUBLISH_DATE}">November 7, 2026</time></p>` : "";
  const prices = path === SPANISH_PAGES[1].path ? `<h2>Precios iniciales para sedanes y cupés</h2><ul>${spanishPackagePrices(FALLBACK_PACKAGES.find(p => p.service === "car" && p.name === "Silver Package")?.price ?? 0, FALLBACK_PACKAGES.find(p => p.service === "car" && p.name === "Gold Package")?.price ?? 0).map(p => `<li>${p.name}: desde ${p.price}</li>`).join("")}</ul><p>El precio final depende del vehículo y de las selecciones al reservar.</p>` : "";
  return `<article lang="${guide ? "en" : "es"}"><h1>${esc(page.h1)}</h1>${author}<p>${esc(page.intro)}</p>${prices}${page.sections.map(s => `<section><h2>${esc(s.heading)}</h2>${s.paragraphs.map(p => `<p>${esc(p)}</p>`).join("")}</section>`).join("")}${linksHtml(page.links)}<p><a href="/book">${guide ? "Book a service" : "Reservar servicio (en inglés)"}</a></p>${guide ? `<h2>Further reading</h2>${linksHtml((guide as CareGuide).sources)}` : ""}${job ? jobPairHtml(job, assets) : ""}</article>`;
}