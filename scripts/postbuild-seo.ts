/**
 * Post-build SEO step.
 *
 * For every public route, emits dist/<route>/index.html with a UNIQUE
 * <title>, <meta name="description">, <link rel="canonical">,
 * <meta property="og:title">, <meta property="og:description">,
 * <meta property="og:url"> and <meta name="twitter:*">.
 *
 * This is the source of truth for non-JS crawlers (Semrush, Ahrefs,
 * social previews). It runs whether or not vite-plugin-prerender
 * succeeded — if a prerendered file already exists for the route,
 * the meta tags are rewritten in place; otherwise the file is
 * created from dist/index.html as the shell.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { localBusinessSchema } from "../src/components/seo/schema";
import { SERVICE_LANDING_PAGES } from "../src/data/serviceLandingPages";
import { CAR_HUB_SEO, PAINT_CORRECTION_SEO, PAINT_OPTIONS, carHubHtml, paintCorrectionHtml, relatedCarLinks, interiorPackagesHtml, CAR_HUB_PATH } from "../src/lib/car-seo";
import { FALLBACK_PACKAGES, CAR_PAGE_DISPLAY_FROM } from "../src/lib/pricing-fallback";
import { RV_HUB_SEO, RV_HUB_PATH, RV_EXTERIOR_LINKS, RV_INTERIOR_UNAVAILABLE, rvHubHtml, rvInteriorUnavailableHtml } from "../src/lib/rv-seo";
import { LOCATION_PAGES } from "../src/data/locationPages";
import { UTILITY_ROUTE_SEO, rewriteUtilityHtml } from "../src/lib/utility-route-seo";
import { AVIATION_OVERVIEW, aviationOverviewHtml } from "../src/lib/aviation-overview";
import { AVIATION_COVERAGE_TEXT, AIRCRAFT_QUOTE_HREF } from "../src/lib/aviation-policy";
import { SERVICES_DIRECTORY_SEO, servicesDirectoryHtml } from "../src/lib/services-directory-seo";

const DIST = join(process.cwd(), "dist");
const SITE = "https://avdetailing.net";
const SHELL_PATH = join(DIST, "index.html");

if (!existsSync(SHELL_PATH)) {
  console.warn("[postbuild-seo] dist/index.html not found, skipping");
  process.exit(0);
}

interface RouteMeta {
  path: string;
  title: string;
  description: string;
  body?: string;
}

function stripTokens(s: string): string {
  return s.replace(/\{\{l1\}\}/g, "").replace(/\{\{l2\}\}/g, "").replace(/\s+/g, " ").trim();
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function bodyForLocation(p: (typeof LOCATION_PAGES)[number]): string {
  const services = p.services
    .map((s) => `<li><strong>${esc(s.name)}</strong> — ${esc(s.description)}</li>`)
    .join("");
  const why = p.whyChoose.map((w) => `<li>${esc(w)}</li>`).join("");
  return [
    `<h1>${esc(p.titleH1)}</h1>`,
    `<p>${esc(stripTokens(p.intro))}</p>`,
    `<h2>Detailing Services in ${esc(p.city)}</h2><ul>${services}</ul>`,
    `<h2>Why Choose AV Detailing</h2><ul>${why}</ul>`,
    `<h2>Neighborhoods We Serve</h2><p>${esc(p.neighborhoods)}</p>`,
    `<p>Call (225) 521-6264 to book mobile detailing in ${esc(p.city)}, Baton Rouge, LA.</p>`,
  ].join("");
}

const money = (n: number | undefined) => (n == null ? "Custom quote" : `$${Math.round(n).toLocaleString("en-US")}`);
const fallbackPrice = (service: string, name: string) => FALLBACK_PACKAGES.find(p => p.service === service && p.name === name)?.price;

function bodyForService(p: (typeof SERVICE_LANDING_PAGES)[number]): string {
  if (p.carPage) {
    return [
      `<nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="${CAR_HUB_PATH}">Car Detailing</a> / <span aria-current="page">${esc(p.title)}</span></nav>`,
      `<h1>${esc(p.title)}</h1>`,
      `<p>${esc(stripTokens(p.intro))}</p>`,
      `<h2>${esc(p.processHeading ?? "Our Process")}</h2><ol>${p.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`,
      `<h2>${esc(p.scopeHeading ?? "Before You Book")}</h2><ul>${p.whyChoose.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>`,
      ...(p.showInteriorPackages ? [interiorPackagesHtml()] : []),
      `<h2>Related car services &amp; service areas</h2><ul>${relatedCarLinks(`/${p.slug}`).map(l => `<li><a href="${l.href}">${esc(l.text)}</a></li>`).join("")}</ul>`,
      `<p>Call <a href="tel:2255216264">(225) 521-6264</a> or <a href="/book">book online</a>.</p>`,
    ].join("");
  }
  if (p.unavailable) return rvInteriorUnavailableHtml();
  if (p.rvPage) {
    const links = [{ href: RV_HUB_PATH, text: "Exterior RV detailing overview" }, ...RV_EXTERIOR_LINKS.filter(l => l.href !== `/${p.slug}`)];
    return [
      `<nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="${RV_HUB_PATH}">RV Detailing</a> / <span aria-current="page">${esc(p.title)}</span></nav>`,
      `<h1>${esc(p.title)}</h1>`,
      `<p>${esc(stripTokens(p.intro))}</p>`,
      `<h2>${esc(p.processHeading ?? "Our Process")}</h2><ol>${p.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`,
      `<h2>${esc(p.scopeHeading ?? "Before You Book")}</h2><ul>${p.whyChoose.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>`,
      `<h2>Related exterior RV services &amp; service areas</h2><p>Our RV service is exterior-only; we do not offer RV interior or upholstery cleaning.</p><ul>${links.map(l => `<li><a href="${l.href}">${esc(l.text)}</a></li>`).join("")}</ul>`,
      `<p>Call <a href="tel:2255216264">(225) 521-6264</a> or <a href="/book">book online</a>.</p>`,
    ].join("");
  }
  const aircraft = p.slug.startsWith("aircraft-");
  const steps = p.steps.map((s) => `<li>${esc(s)}</li>`).join("");
  const why = p.whyChoose.map((w) => `<li>${esc(w)}</li>`).join("");
  return [
    ...(aircraft ? [`<nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/services">Services</a> / <span aria-current="page">${esc(p.title)}</span></nav>`] : []),
    `<h1>${esc(p.title)}</h1>`,
    `<p>${esc(stripTokens(p.intro))}</p>`,
    `<h2>${esc(p.processHeading ?? "Our Process")}</h2><ol>${steps}</ol>`,
    `<h2>${esc(p.scopeHeading ?? "Why Choose AV Detailing")}</h2><ul>${why}</ul>`,
    aircraft
      ? `<h2>Related aircraft services &amp; location arrangements</h2><p>${esc(AVIATION_COVERAGE_TEXT)}</p><ul>${(p.relatedLinks ?? []).map(link => `<li><a href="${link.href}">${esc(link.text)}</a></li>`).join("")}</ul><p>Aircraft bookings do not require a deposit. Include aircraft make/model, location, requested work, condition, preferred dates and contact details. Photos are optional.</p><a href="${AIRCRAFT_QUOTE_HREF}">Request an Aircraft Quote</a>`
      : `<h2>Service Areas</h2><p>AV Detailing serves Greater Baton Rouge including Highland Road, Shenandoah, Gonzales, Prairieville, Central, Walker, Denham Springs, and Zachary, Louisiana. Call (225) 521-6264 to book.</p>`,
  ].join("");
}

function bodyForStatic(m: { title: string; description: string }): string {
  return [
    `<h1>${esc(m.title)}</h1>`,
    `<p>${esc(m.description)}</p>`,
    `<p>AV Detailing is Baton Rouge's premier mobile detailing service — bringing System X ceramic coating, paint correction, interior shampoo, RV, boat, and aircraft detailing directly to your driveway, office, or storage location. We proudly serve Highland Road, Shenandoah, Gonzales, Prairieville, Central, Walker, Denham Springs, and Zachary, Louisiana.</p>`,
    `<p>Call (225) 521-6264 or visit avdetailing.net/book to schedule. Fully insured. Family-owned and operated in Baton Rouge, LA.</p>`,
  ].join("");
}

const STATIC_ROUTES: RouteMeta[] = [
  {
    path: "/",
    title: "Car Detailing in Baton Rouge — AV Detailing",
    description:
      "Mobile car detailing in Baton Rouge. System X ceramic coating, paint correction, RV, boat & aircraft detailing. We come to you — (225) 521-6264.",
  },
  {
    path: "/about",
    title: "About AV Detailing | Baton Rouge Mobile Detailing",
    description:
      "Meet the family behind AV Detailing — a fully-insured mobile detailing crew serving Baton Rouge and the surrounding parishes.",
  },
  {
    path: "/services",
    title: SERVICES_DIRECTORY_SEO.title,
    description: SERVICES_DIRECTORY_SEO.description,
    body: servicesDirectoryHtml(),
  },
  {
    path: "/memberships",
    title: "Detailing Memberships | AV Detailing",
    description:
      "Monthly, bi-weekly, and weekly mobile detailing memberships in Baton Rouge. Keep your car, truck, or SUV showroom-fresh year-round and skip the booking line.",
  },
  {
    path: "/gallery",
    title: "Before & After Gallery | AV Detailing",
    description:
      "Real before-and-after photos from AV Detailing jobs — paint correction, ceramic coating, interior shampoo, boat and RV restorations across Baton Rouge, LA.",
  },
  {
    path: "/reviews",
    title: "Customer Reviews & Testimonials | AV Detailing Baton Rouge",
    description:
      "Read verified Google reviews from AV Detailing customers in Baton Rouge, LA — mobile car, RV, boat & aircraft detailing that comes to you.",
  },
  {
    path: "/contact",
    title: "Contact Us | AV Detailing",
    description:
      "Call (225) 521-6264 or message AV Detailing to book mobile car, RV, boat or aircraft detailing in Baton Rouge, Prairieville, Gonzales, Walker and Denham Springs.",
  },
  {
    path: "/service-areas",
    title: "Mobile Detailing Service Areas | AV Detailing",
    description:
      "AV Detailing mobile service areas — Baton Rouge, Highland Road, Shenandoah, Gonzales, Prairieville, Walker, Denham Springs, Zachary and Central, Louisiana.",
  },
  {
    path: "/privacy-policy",
    title: "Privacy Policy | AV Detailing",
    description:
      "How AV Detailing collects, uses and protects customer information, including phone numbers and SMS opt-in details for booking confirmations and reminders.",
  },
  {
    path: "/terms-and-conditions",
    title: "Terms & Conditions | AV Detailing",
    description:
      "AV Detailing booking terms, SMS consent disclosure, cancellation policy, deposits, refunds and service guarantees for mobile detailing in Baton Rouge, LA.",
  },
  {
    path: CAR_HUB_SEO.path,
    title: CAR_HUB_SEO.title,
    description: CAR_HUB_SEO.description,
    body: carHubHtml({
      basic: money(CAR_PAGE_DISPLAY_FROM.basic),
      silver: money(fallbackPrice("car", "Silver Package")),
      gold: money(fallbackPrice("car", "Gold Package")),
    }),
  },
  {
    path: RV_HUB_SEO.path,
    title: RV_HUB_SEO.title,
    description: RV_HUB_SEO.description,
    body: rvHubHtml(),
  },
  {
    path: "/boat-detailing-baton-rouge",
    title: "Boat Detailing in Baton Rouge, LA | AV Detailing",
    description:
      "Mobile boat detailing in Baton Rouge — ceramic coating, gelcoat restoration, hull cleaning and pontoon detailing at your marina, dock or driveway.",
  },
  {
    path: AVIATION_OVERVIEW.path,
    title: AVIATION_OVERVIEW.title,
    description: AVIATION_OVERVIEW.description,
    body: aviationOverviewHtml(),
  },
  {
    path: "/ceramic-coating-baton-rouge",
    title: "Ceramic Coating in Baton Rouge, LA | AV Detailing",
    description:
      "System X ceramic coating in Baton Rouge — 3-year, 6-year and 10-year tiers with paint correction. Mobile install at your home or office.",
  },
  {
    path: PAINT_CORRECTION_SEO.path,
    title: PAINT_CORRECTION_SEO.title,
    description: PAINT_CORRECTION_SEO.description,
    body: paintCorrectionHtml(PAINT_OPTIONS.map(o => ({ ...o, price: money(fallbackPrice("paint", o.name)) }))),
  },
];

const LEGAL_PATHS = new Set(["/privacy-policy", "/terms-and-conditions"]);

function bodyForLegal(m: { title: string; description: string }): string {
  return [
    `<h1>${esc(m.title.replace(/ \| AV Detailing$/, ""))}</h1>`,
    `<p>${esc(m.description)}</p>`,
    `<p>Questions about this policy? Call (225) 521-6264.</p>`,
  ].join("");
}

for (const r of STATIC_ROUTES) {
  if (!r.body) r.body = LEGAL_PATHS.has(r.path) ? bodyForLegal(r) : bodyForStatic(r);
  if (r.path === "/") {
    r.body += `<p>For private aircraft, explore <a href="/aircraft-detailing-baton-rouge">aircraft and private jet detailing in Baton Rouge</a>: interior deep cleaning, shampooing, polishing and ceramic coating, with scope and access coordinated per job.</p>`;
  }
}

const SERVICE_ROUTES: RouteMeta[] = SERVICE_LANDING_PAGES.map((p) => ({
  path: `/${p.slug}`,
  title: p.seoTitle ?? `${p.title} | AV Detailing`,
  description: p.metaDescription,
  body: bodyForService(p),
}));

const LOCATION_ROUTES: RouteMeta[] = LOCATION_PAGES.map((p) => ({
  path: `/${p.slug}`,
  title: `${p.titleTag} | AV Detailing`,
  description: p.metaDescription,
  body: bodyForLocation(p),
}));

const ALL_ROUTES: RouteMeta[] = [
  ...STATIC_ROUTES,
  ...SERVICE_ROUTES,
  ...LOCATION_ROUTES,
];

const SHELL = readFileSync(SHELL_PATH, "utf8");

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Keep only the first JSON-LD block that contains a LocalBusiness node. */
function dedupeLocalBusiness(html: string): string {
  let seenBusiness = false;
  return html.replace(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>\s*/gi,
    (full, json: string) => {
      if (!/"@type"\s*:\s*"LocalBusiness"/.test(json)) return full;
      if (seenBusiness) {
        // Strip the duplicate business node but keep other schemas in the block.
        try {
          const data = JSON.parse(json);
          if (Array.isArray(data)) {
            const rest = data.filter((d) => d?.["@type"] !== "LocalBusiness");
            return rest.length ? full.replace(json, JSON.stringify(rest)) : "";
          }
        } catch { /* fall through */ }
        return "";
      }
      seenBusiness = true;
      return full;
    },
  );
}

function rewrite(html: string, m: RouteMeta): string {
  const url = `${SITE}${m.path === "/" ? "/" : m.path}`;
  const t = escapeAttr(m.title);
  const d = escapeAttr(m.description);

  let out = html;
  // Aviation routes must not inherit homepage FAQ or unrelated Service nodes
  // from the fallback shell. Emit the same truthful business/service relation
  // as the page, with no new airport businesses or review claims.
  if (m.path.startsWith("/aircraft-")) {
    out = out.replace(/<meta\s+name=["']description["'][^>]*>/gi, "");
    out = out.replace(/<link\s+rel=["']canonical["'][^>]*>/gi, "");
    const config = SERVICE_LANDING_PAGES.find(p => `/${p.slug}` === m.path);
    const schemas = [localBusinessSchema(), {
      "@context": "https://schema.org",
      "@type": "Service",
      name: config?.title ?? AVIATION_OVERVIEW.h1,
      serviceType: config?.serviceType ?? "Aircraft and Private Jet Detailing",
      provider: { "@id": `${SITE}/#business` },
      areaServed: ["Baton Rouge", "Lafayette", "New Orleans"].map(name => ({ "@type": "City", name })),
      url,
    }, {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        ...(config ? [{ "@type": "ListItem", position: 2, name: "Services", item: `${SITE}/services` }] : []),
        { "@type": "ListItem", position: config ? 3 : 2, name: config?.title ?? AVIATION_OVERVIEW.h1, item: url },
      ],
    }];
    out = out.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, "");
    out = out.replace(/<\/head>/i, `<script type="application/ld+json">${JSON.stringify(schemas).replace(/</g, "\\u003c")}</script></head>`);
    out = out.replace(/<meta\s+name=["']robots["'][^>]*>/gi, "");
    out = out.replace(/<\/head>/i, `<meta name="robots" content="index, follow" /></head>`);
  }

  // The unavailable RV-interior page: noindex,follow and no Service/Offer claims.
  if (m.path === RV_INTERIOR_UNAVAILABLE.path) {
    const schemas = [localBusinessSchema(), {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "RV Detailing", item: `${SITE}${RV_HUB_PATH}` },
        { "@type": "ListItem", position: 3, name: "RV Interior", item: url },
      ],
    }];
    out = out.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, "");
    out = out.replace(/<\/head>/i, `<script type="application/ld+json">${JSON.stringify(schemas).replace(/</g, "\\u003c")}</script></head>`);
    out = out.replace(/<meta\s+name=["']robots["'][^>]*>/gi, "");
    out = out.replace(/<\/head>/i, `<meta name="robots" content="noindex, follow" /></head>`);
  }

  // <title>
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${t}</title>`);

  // meta name="description"
  if (/<meta\s+name=["']description["'][^>]*>/i.test(out)) {
    out = out.replace(
      /<meta\s+name=["']description["'][^>]*>/i,
      `<meta name="description" content="${d}" />`,
    );
  } else {
    out = out.replace(
      /<\/title>/i,
      `</title>\n    <meta name="description" content="${d}" />`,
    );
  }

  // canonical
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(out)) {
    out = out.replace(
      /<link\s+rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${url}" />`,
    );
  } else {
    out = out.replace(
      /<\/title>/i,
      `</title>\n    <link rel="canonical" href="${url}" />`,
    );
  }

  // og:title / og:description / og:url
  out = out.replace(
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${t}" />`,
  );
  out = out.replace(
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${d}" />`,
  );
  out = out.replace(
    /<meta\s+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${url}" />`,
  );

  // twitter
  out = out.replace(
    /<meta\s+name=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${t}" />`,
  );
  out = out.replace(
    /<meta\s+name=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${d}" />`,
  );

  // Structured data must exist in the initial HTML for crawlers that don't run
  // JS. Helmet-rendered JSON-LD isn't reliably captured by the prerenderer, so
  // inject the public LocalBusiness schema here when it's missing.
  out = dedupeLocalBusiness(out);
  if (!LEGAL_PATHS.has(m.path) && !/"@type":"LocalBusiness"/.test(out)) {
    out = out.replace(
      /<\/head>/i,
      `  <script type="application/ld+json">${JSON.stringify(localBusinessSchema()).replace(/</g, "\\u003c")}</script>\n  </head>`,
    );
  }

  // Keep the prerendered markup when it already contains real page content;
  // only fall back to the synthetic SEO body when prerendering produced an
  // empty shell.
  const bodyStart = out.search(/<div\s+id=["']root["'][^>]*>/i);
  const prerendered = bodyStart >= 0 ? out.slice(bodyStart) : "";
  const hasRealContent = prerendered.length > 5000 && /<h1[\s>]/i.test(prerendered);

  // Inject SEO body content inside #root (React will replace on hydration).
  if (m.body && !hasRealContent) {
    out = out.replace(
      /<div\s+id=["']root["'][^>]*>[\s\S]*?<\/div>/i,
      `<div id="root"><div data-seo-content>${m.body}</div></div>`,
    );
  }

  return out;
}

let written = 0;
const seen = new Set<string>();

for (const route of ALL_ROUTES) {
  if (seen.has(route.path)) continue;
  seen.add(route.path);

  const target =
    route.path === "/"
      ? SHELL_PATH
      : join(DIST, route.path.replace(/^\//, ""), "index.html");

  const base = existsSync(target) ? readFileSync(target, "utf8") : SHELL;
  const rewritten = rewrite(base, route);

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, rewritten);
  written++;
}

// Public utility routes deliberately use an anonymous shell, not a captured
// account session or homepage snapshot. React mounts the existing interactive UI.
for (const route of UTILITY_ROUTE_SEO) {
  const target = join(DIST, route.path.slice(1), "index.html");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, rewriteUtilityHtml(SHELL, route));
  written++;
}

// Legacy URLs → preferred keyword pages. Static hosting can't send a real 301,
// so each legacy path gets a noindex stub that points crawlers (canonical) and
// browsers (instant meta refresh + location.replace) to the preferred URL.
const LEGACY_REDIRECTS: Record<string, string> = {
  "/services/car-detailing": "/car-detailing-baton-rouge",
  "/services/ceramic-coating": "/ceramic-coating-baton-rouge",
  "/services/paint-correction": "/paint-correction-baton-rouge",
  "/services/boat-detailing": "/boat-detailing-baton-rouge",
  "/services/rv-detailing": "/rv-detailing-baton-rouge",
  "/services/aircraft-detailing": "/aircraft-detailing-baton-rouge",
  "/terms": "/terms-and-conditions",
};
for (const [from, to] of Object.entries(LEGACY_REDIRECTS)) {
  const url = `${SITE}${to}`;
  const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><title>Moved | AV Detailing</title><meta name="robots" content="noindex, follow" /><link rel="canonical" href="${url}" /><meta http-equiv="refresh" content="0; url=${url}" /><script>location.replace(${JSON.stringify(to)} + location.search + location.hash)</script></head><body><p>This page has moved to <a href="${url}">${url}</a>.</p></body></html>`;
  const target = join(DIST, from.replace(/^\//, ""), "index.html");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, html);
  written++;
}

console.log(`[postbuild-seo] wrote ${written} route HTML files`);
