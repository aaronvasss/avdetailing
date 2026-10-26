import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { SERVICE_LANDING_PAGES } from "@/data/serviceLandingPages";
import { RV_EXTERIOR_WASH_FALLBACK_PRICE, RV_EXTERIOR_LINKS } from "@/lib/rv-seo";
import { buildPricing, FALLBACK_PACKAGES, FALLBACK_PLANS } from "@/lib/pricing";

const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

function build() {
  const temp = mkdtempSync(join(tmpdir(), "rv-seo-"));
  mkdirSync(join(temp, "dist"));
  copyFileSync(resolve("index.html"), join(temp, "dist/index.html"));
  execFileSync("npx", ["tsx", resolve("scripts/postbuild-seo.ts")], { cwd: temp, stdio: "pipe" });
  return temp;
}

describe("RV exterior-only SEO", () => {
  it("RV Exterior Wash stays $350 from the authoritative pricing source", () => {
    expect(RV_EXTERIOR_WASH_FALLBACK_PRICE).toBe(350);
    expect(buildPricing(FALLBACK_PACKAGES, FALLBACK_PLANS).packageFrom("rv", "RV Exterior Wash")).toBe(350);
  });

  it("no RV page promotes interior work except the unavailable page", () => {
    const rv = SERVICE_LANDING_PAGES.filter(p => p.slug.includes("rv-"));
    for (const p of rv.filter(p => !p.unavailable)) {
      expect(`${p.title} ${p.metaDescription} ${p.steps.join(" ")}`).not.toMatch(/interior|upholster/i);
    }
    expect(RV_EXTERIOR_LINKS.some(l => l.href.includes("interior"))).toBe(false);
  });

  it("initial HTML: hub and mobile pages are indexable; interior page is noindex,follow, self-canonical, no Service", () => {
    const temp = build();
    try {
      const hub = readFileSync(join(temp, "dist/rv-detailing-baton-rouge/index.html"), "utf8");
      expect(hub).toContain('<link rel="canonical" href="https://avdetailing.net/rv-detailing-baton-rouge" />');
      expect(hub).not.toMatch(/noindex/i);
      expect(hub).toContain("RV Exterior Wash from $350");
      expect(hub).not.toContain('href="/rv-interior-detailing-baton-rouge"');
      const mobile = readFileSync(join(temp, "dist/mobile-rv-detailing-baton-rouge/index.html"), "utf8");
      expect(mobile).not.toMatch(/noindex/i);
      expect(mobile).toContain('href="/rv-detailing-baton-rouge"');
      const interior = readFileSync(join(temp, "dist/rv-interior-detailing-baton-rouge/index.html"), "utf8");
      expect(count(interior, /name="robots"/g)).toBe(1);
      expect(interior).toContain('content="noindex, follow"');
      expect(count(interior, /rel="canonical"/g)).toBe(1);
      expect(interior).toContain('href="https://avdetailing.net/rv-interior-detailing-baton-rouge"');
      expect(interior).not.toMatch(/"@type":"(Service|Offer)"/);
      expect(interior).toContain('href="/rv-detailing-baton-rouge"');
    } finally { rmSync(temp, { recursive: true, force: true }); }
  }, 60000);

  it("sitemap excludes the unavailable RV interior page", () => {
    execFileSync("npx", ["tsx", resolve("scripts/generate-sitemap.ts")], { stdio: "pipe" });
    const xml = readFileSync(resolve("public/sitemap.xml"), "utf8");
    expect(xml).not.toContain("rv-interior-detailing");
    expect(xml).toContain("/rv-detailing-baton-rouge</loc>");
    expect(xml).toContain("/mobile-rv-detailing-baton-rouge</loc>");
  }, 60000);
});
