import { writeFileSync, existsSync, statSync } from "fs";
import { resolve } from "path";
import { execFileSync } from "child_process";
import { SERVICE_LANDING_PAGES } from "../src/data/serviceLandingPages.ts";
import { LOCATION_PAGES } from "../src/data/locationPages.ts";

const BASE_URL = "https://avdetailing.net";

/**
 * Real last-modification date (YYYY-MM-DD) for the source files that render a
 * page. Uses the git commit date when available and falls back to the file
 * mtime, so every URL gets its own page-specific <lastmod>.
 */
const lastmodCache = new Map<string, string>();

function fileLastmod(file: string): string | undefined {
  if (lastmodCache.has(file)) return lastmodCache.get(file);
  const abs = resolve(file);
  if (!existsSync(abs)) return undefined;

  let date: string | undefined;
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", file], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(out)) date = out;
  } catch {
    // git unavailable (e.g. fresh checkout) — fall back to mtime below
  }
  if (!date) date = statSync(abs).mtime.toISOString().slice(0, 10);

  lastmodCache.set(file, date);
  return date;
}

/** Most recent lastmod across the given source files. */
function sourcesLastmod(sources: string[] | undefined): string | undefined {
  const dates = (sources ?? []).map(fileLastmod).filter((d): d is string => Boolean(d));
  if (!dates.length) return undefined;
  return dates.sort().at(-1);
}

function pageFile(name: string) {
  return `src/pages/${name}.tsx`;
}

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
  /** Source files whose modification dates determine this page's <lastmod>. */
  sources?: string[];
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  // Homepage
  { path: "/", sources: [pageFile("Index"), "src/components/home"], changefreq: "weekly", priority: "1.0" },

  // Category pages
  { path: "/car-detailing-baton-rouge", sources: [pageFile("CarDetailingBatonRougePage")], changefreq: "monthly", priority: "0.95" },
  { path: "/rv-detailing-baton-rouge", sources: [pageFile("RVDetailingBatonRougePage")], changefreq: "monthly", priority: "0.90" },
  { path: "/boat-detailing-baton-rouge", sources: [pageFile("BoatDetailingBatonRougePage")], changefreq: "monthly", priority: "0.90" },
  { path: "/aircraft-detailing-baton-rouge", sources: [pageFile("AircraftDetailingBatonRougePage")], changefreq: "monthly", priority: "0.85" },

  // Supporting pages
  { path: "/services", sources: [pageFile("ServicesPage")], changefreq: "monthly", priority: "0.60" },
  { path: "/about", sources: [pageFile("AboutPage")], changefreq: "monthly", priority: "0.65" },
  { path: "/memberships", sources: [pageFile("MembershipsPage")], changefreq: "monthly", priority: "0.75" },
  { path: "/gallery", sources: [pageFile("GalleryPage")], changefreq: "weekly", priority: "0.70" },
  { path: "/reviews", sources: [pageFile("ReviewsPage")], changefreq: "weekly", priority: "0.70" },
  { path: "/contact", sources: [pageFile("ContactPage")], changefreq: "monthly", priority: "0.65" },
  { path: "/service-areas", sources: [pageFile("ServiceAreasPage")], changefreq: "monthly", priority: "0.65" },
  
  { path: "/privacy-policy", sources: [pageFile("PrivacyPolicyPage")], changefreq: "yearly", priority: "0.30" },
  { path: "/terms-and-conditions", sources: [pageFile("TermsAndConditionsPage")], changefreq: "yearly", priority: "0.30" },
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
    const lastmod = entry.lastmod ?? sourcesLastmod(entry.sources);
    return { ...entry, path, ...(lastmod ? { lastmod } : {}) };
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
    return {
      path: `/${p.slug}`,
      sources: ["src/data/serviceLandingPages.ts", pageFile("ServiceLandingPage")],
      changefreq: "monthly",
      priority,
    };
  }),
  // Location landing pages
  ...LOCATION_PAGES.map((p): SitemapEntry => {
    const priority =
      ["highland-road", "shenandoah", "gonzales", "prairieville", "denham-springs"]
        .some(k => p.slug.includes(k)) ? "0.80" : "0.75";
    return {
      path: `/${p.slug}`,
      sources: ["src/data/locationPages.ts", pageFile("LocationLandingPage")],
      changefreq: "monthly",
      priority,
    };
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
