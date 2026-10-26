import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { SERVICE_LANDING_BY_SLUG } from "@/data/serviceLandingPages";
import { CAR_INTERIOR_BY_PACKAGE, CAR_ACTIVE_ADD_ONS } from "@/lib/car-seo";
import { buildPricing, FALLBACK_PACKAGES, FALLBACK_PLANS, CAR_PAGE_DISPLAY_FROM } from "@/lib/pricing";

describe("car section SEO", () => {
  it("approved car and paint prices are unchanged", () => {
    const p = buildPricing(FALLBACK_PACKAGES, FALLBACK_PLANS);
    expect(CAR_PAGE_DISPLAY_FROM.basic).toBe(140);
    expect(p.packageFrom("car", "Silver Package")).toBe(259.17);
    expect(p.packageFrom("car", "Gold Package")).toBe(362.8);
    expect(p.packageFrom("paint", "1-Step Polish")).toBe(400);
    expect(p.packageFrom("paint", "3-Step Restoration")).toBe(650);
  });

  it("seat shampoo is only listed for Gold", () => {
    for (const pkg of CAR_INTERIOR_BY_PACKAGE) {
      const has = pkg.interior.some(i => /shampoo/i.test(i));
      expect(has).toBe(pkg.name === "Gold Package");
    }
    expect(CAR_ACTIVE_ADD_ONS).not.toContain("Odor Removal");
  });

  it("mobile and interior pages drop authority links and absolute claims", () => {
    for (const slug of ["mobile-car-detailing-baton-rouge", "interior-detailing-baton-rouge"]) {
      const c = SERVICE_LANDING_BY_SLUG[slug];
      expect(c.intro).not.toMatch(/\{\{l[12]\}\}|permanent|140°F|bacteria|self-contained/i);
      expect(c.link1.url).toBe("");
    }
  });

  it("initial HTML for hub, interior and paint pages carries matching content and no durations/guarantees", () => {
    const temp = mkdtempSync(join(tmpdir(), "car-seo-"));
    try {
      mkdirSync(join(temp, "dist"));
      copyFileSync(resolve("index.html"), join(temp, "dist/index.html"));
      execFileSync("npx", ["tsx", resolve("scripts/postbuild-seo.ts")], { cwd: temp, stdio: "pipe" });
      const read = (p: string) => readFileSync(join(temp, `dist/${p}/index.html`), "utf8");
      const hub = read("car-detailing-baton-rouge");
      expect(hub).toContain("Car Detailing in Baton Rouge, LA</h1>");
      expect(hub).toContain("Basic Package</a> from $140");
      expect(hub).toContain("Gold Package</a> from $363");
      expect(hub).not.toMatch(/\d+-year/i);
      const interior = read("interior-detailing-baton-rouge");
      expect(interior).toContain('href="/car-detailing-baton-rouge"');
      expect(interior).toMatch(/Gold Package<\/strong>:[^<]*Seat &amp; upholstery shampooing/);
      const paint = read("paint-correction-baton-rouge");
      expect(paint).toContain("1-Step Polish</strong> from $400");
      expect(paint).not.toMatch(/95%|guarantee|forever/i);
      expect(paint).not.toMatch(/noindex/i);
    } finally { rmSync(temp, { recursive: true, force: true }); }
  }, 60000);
});
