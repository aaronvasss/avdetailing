import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { SERVICE_LANDING_PAGES } from "@/data/serviceLandingPages";
import { buildPricing, FALLBACK_PACKAGES, FALLBACK_PLANS } from "@/lib/pricing";

const BOAT_SLUGS = ["mobile-boat-detailing-baton-rouge", "boat-ceramic-coating-baton-rouge", "gelcoat-restoration-baton-rouge", "hull-cleaning-baton-rouge", "pontoon-cleaning-baton-rouge"];
const BANNED = /System X (certif|approv)|certif|warrant|uscg|\.gov|mirror|permanent|resale|diver|underwater|in-water service|\d+-year/i;

describe("boat section SEO", () => {
  it("boat package prices are unchanged", () => {
    const p = buildPricing(FALLBACK_PACKAGES, FALLBACK_PLANS);
    expect(p.packageFrom("boat", "Boat Wash & Wax")).toBe(199);
    expect(p.packageFrom("boat", "Boat Full Detail")).toBe(399);
    expect(p.packageFrom("boat", "Boat Premium Detail")).toBe(649);
  });

  it("boat page configs have no unsupported claims or authority links", () => {
    for (const slug of BOAT_SLUGS) {
      const c = SERVICE_LANDING_PAGES.find(p => p.slug === slug)!;
      expect(c.boatPage).toBe(true);
      expect([c.title, c.metaDescription, c.intro, ...c.steps, ...c.whyChoose].join(" ")).not.toMatch(BANNED);
      expect(c.link1.url).toBe("");
    }
  });

  it("initial HTML: hub and boat pages link each other, carry prices, and stay indexable", () => {
    const temp = mkdtempSync(join(tmpdir(), "boat-seo-"));
    try {
      mkdirSync(join(temp, "dist"));
      copyFileSync(resolve("index.html"), join(temp, "dist/index.html"));
      execFileSync("npx", ["tsx", resolve("scripts/postbuild-seo.ts")], { cwd: temp, stdio: "pipe" });
      const read = (p: string) => readFileSync(join(temp, `dist/${p}/index.html`), "utf8");
      const hub = read("boat-detailing-baton-rouge");
      expect(hub).toContain("Boat Premium Detail</strong> from $649");
      for (const slug of BOAT_SLUGS) expect(hub).toContain(`href="/${slug}"`);
      const coat = read("boat-ceramic-coating-baton-rouge");
      expect(coat).toContain("<title>Boat Ceramic Coating in Baton Rouge | Quotes &amp; Assessment | AV Detailing</title>");
      expect(coat).toContain('href="/boat-detailing-baton-rouge"');
      expect(coat).toContain('href="/gelcoat-restoration-baton-rouge"');
      expect(coat).not.toMatch(/noindex/i);
      expect(coat.match(/"@type":"LocalBusiness"/g)?.length).toBe(1);
      const hull = read("hull-cleaning-baton-rouge");
      // Owner-confirmed: hull cleaning on a trailer or lift only, never in-water.
      expect(hull).toMatch(/trailer or (a )?lift/);
      expect(hull).not.toMatch(/slip or afloat|in a slip|afloat/i);
      expect(hull).toMatch(/do not offer in-water cleaning/);
      expect(hull.slice(hull.indexOf('id="root"'))).not.toMatch(BANNED);
    } finally { rmSync(temp, { recursive: true, force: true }); }
  }, 60000);
});
