import { writeFileSync } from "fs";
import { resolve } from "path";
import { SERVICE_LANDING_PAGES } from "../src/data/serviceLandingPages.ts";
import { LOCATION_PAGES } from "../src/data/locationPages.ts";

const BASE_URL = "https://avdetailing.net";
const LASTMOD = "2026-05-28";

const REDIRECT_PATHS = new Set([
  "/services/car-detailing",
  "/services/ceramic-coating",
  "/services/paint-correction",
  "/services/boat-detailing",
  "/services/rv-detailing",
  "/services/aircraft-detailing",
]);

const PRIVATE_OR_UTILITY_PREFIXES = [
  "/account",
  "/admin",
  "/auth",
  "/book",
  "/booking",
  "/cancel",
  "/rate",
  "/unauthorized",
  "/worker",
];

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  // Homepage
  { path: "/", changefreq: "weekly", priority: "1.0" },

  // Category pages
  { path: "/car-detailing-baton-rouge", changefreq: "monthly", priority: "0.95" },
  { path: "/rv-detailing-baton-rouge", changefreq: "monthly", priority: "0.90" },
  { path: "/boat-detailing-baton-rouge", changefreq: "monthly", priority: "0.90" },
  { path: "/aircraft-detailing-baton-rouge", changefreq: "monthly", priority: "0.85" },

  // Supporting pages
  { path: "/services", changefreq: "monthly", priority: "0.60" },
  { path: "/about", changefreq: "monthly", priority: "0.65" },
  { path: "/memberships", changefreq: "monthly", priority: "0.75" },
  { path: "/gallery", changefreq: "weekly", priority: "0.70" },
  { path: "/reviews", changefreq: "weekly", priority: "0.70" },
  { path: "/contact", changefreq: "monthly", priority: "0.65" },
  { path: "/service-areas", changefreq: "monthly", priority: "0.65" },
  
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.30" },
  { path: "/terms-and-conditions", changefreq: "yearly", priority: "0.30" },
];

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) => {
    const lines = [`  <url>`, `    <loc>${BASE_URL}${e.path}</loc>`];
    if (e.lastmod) lines.push(`    <lastmod>${e.lastmod}</lastmod>`);
    if (e.changefreq) lines.push(`    <changefreq>${e.changefreq}</changefreq>`);
    if (e.priority) lines.push(`    <priority>${e.priority}</priority>`);
    lines.push(`  </url>`);
    return lines.join("\n");
  });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    ``,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ``,
    ...urls.map((u) => u + "\n"),
    `</urlset>`,
    ``,
  ].join("\n");
}

function isPrivateOrUtilityPath(path: string) {
  return PRIVATE_OR_UTILITY_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function validateAndNormalize(entries: SitemapEntry[]) {
  const seen = new Set<string>();

  return entries.map((entry) => {
    const path = entry.path === "/" ? "/" : entry.path.replace(/\/$/, "");

    if (!path.startsWith("/")) throw new Error(`Sitemap path must start with /: ${path}`);
    if (path.includes(":")) throw new Error(`Sitemap cannot include dynamic route params: ${path}`);
    if (REDIRECT_PATHS.has(path)) throw new Error(`Sitemap cannot include redirect route: ${path}`);
    if (isPrivateOrUtilityPath(path)) throw new Error(`Sitemap cannot include private/utility route: ${path}`);
    if (seen.has(path)) throw new Error(`Duplicate sitemap path: ${path}`);

    const priority = Number(entry.priority ?? "0");
    if (!Number.isFinite(priority) || priority < 0 || priority > 1) {
      throw new Error(`Invalid sitemap priority for ${path}: ${entry.priority}`);
    }

    seen.add(path);
    return { ...entry, path, lastmod: entry.lastmod ?? LASTMOD };
  });
}

// Build full entry list from static + dynamic data
const allEntries: SitemapEntry[] = validateAndNormalize([
  ...staticEntries,
  // Service landing pages (SEO sub-pages for car, RV, boat, aircraft)
  ...SERVICE_LANDING_PAGES.map((p): SitemapEntry => {
    const cat = p.slug.split("-")[0];
    const priority =
      cat === "mobile" ? "0.85" :
      ["ceramic", "paint"].some(k => p.slug.includes(k)) ? "0.85" :
      ["interior", "exterior", "mobile-rv", "mobile-boat"].some(k => p.slug.includes(k)) ? "0.80" :
      "0.75";
    return { path: `/${p.slug}`, changefreq: "monthly", priority };
  }),
  // Location landing pages
  ...LOCATION_PAGES.map((p): SitemapEntry => {
    const priority =
      ["highland-road", "shenandoah", "gonzales", "prairieville", "denham-springs"]
        .some(k => p.slug.includes(k)) ? "0.80" : "0.75";
    return { path: `/${p.slug}`, changefreq: "monthly", priority };
  }),
]);

// Sort by priority descending, then alphabetically by path
allEntries.sort((a, b) => {
  const pa = parseFloat(a.priority || "0");
  const pb = parseFloat(b.priority || "0");
  if (pb !== pa) return pb - pa;
  return a.path.localeCompare(b.path);
});

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(allEntries));
console.log(`sitemap.xml written (${allEntries.length} entries)`);
