import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { UTILITY_ROUTE_SEO, rewriteUtilityHtml } from "@/lib/utility-route-seo";

describe("public utility search policy", () => {
  const shell = '<html><head><title>Homepage</title><meta name="robots" content="index, follow"><link rel="canonical" href="https://avdetailing.net/"><script type="application/ld+json">{"@type":"LocalBusiness"}</script></head><body><div id="root"><div><h1>Homepage</h1><div>Home content</div></div></div><script type="module" src="/assets/app.js"></script></body></html>';
  for (const route of UTILITY_ROUTE_SEO) {
    it(`${route.path} is noindex with a self canonical, never the homepage`, () => {
      const html = rewriteUtilityHtml(shell, route);
      const doc = new DOMParser().parseFromString(html, "text/html");
      expect(doc.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex, nofollow");
      expect(doc.querySelectorAll('meta[name="robots"]')).toHaveLength(1);
      expect(doc.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`https://avdetailing.net${route.path}`);
      expect(doc.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
      expect(doc.querySelector('script[type="application/ld+json"]')).toBeNull();
      expect(doc.querySelector('script[type="module"]')?.getAttribute("src")).toBe("/assets/app.js");
      expect(doc.querySelector("#root")?.textContent).not.toContain("Homepage");
    });
    it(`${route.path} is crawlable but absent from the sitemap`, () => {
      const robots = readFileSync("public/robots.txt", "utf8");
      const disallows = robots.split("\n").filter((line) => line.startsWith("Disallow:")).map((line) => line.slice(9).trim());
      expect(disallows.some((prefix) => route.path.startsWith(prefix))).toBe(false);
      const xml = readFileSync("public/sitemap.xml", "utf8");
      expect(xml).not.toContain(`<loc>https://avdetailing.net${route.path}</loc>`);
      expect(xml).toContain("<loc>https://avdetailing.net/car-detailing-baton-rouge</loc>");
    });
  }
});