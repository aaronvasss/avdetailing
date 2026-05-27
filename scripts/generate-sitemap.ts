import { writeFileSync } from "fs";
import { resolve } from "path";
import { SERVICE_LANDING_PAGES } from "../src/data/serviceLandingPages.ts";
import { LOCATION_PAGES } from "../src/data/locationPages.ts";

const BASE_URL = "https://avdetailing.net";

interface SitemapEntry {
  path: string;
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

// Build full entry list from static + dynamic data
const allEntries: SitemapEntry[] = [
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
];

// Sort by priority descending, then alphabetically by path
allEntries.sort((a, b) => {
  const pa = parseFloat(a.priority || "0");
  const pb = parseFloat(b.priority || "0");
  if (pb !== pa) return pb - pa;
  return a.path.localeCompare(b.path);
});

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(allEntries));
console.log(`sitemap.xml written (${allEntries.length} entries)`);
