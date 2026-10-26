import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { CERAMIC_SEO, CERAMIC_TIERS, ceramicPageHtml, tierPrices } from "@/lib/ceramic-seo";
import { SERVICE_LANDING_BY_SLUG } from "@/data/serviceLandingPages";

const BANNED = /lifetime|most popular|most-installed|stops oxidation|color fade|hardness|scratch resist|resale|correction included|correction prep|deq\.|consumerreports|UV index|10\+|certif|warrant|mirror|longest-named|(?:about |full-day \()?8-hour/i;
const page = readFileSync("src/pages/CeramicCoatingBatonRougePage.tsx", "utf8");

describe("car ceramic coating page", () => {
  it("keeps 3/6/10 names on the legacy 5-year key and unchanged starting prices", () => {
    expect(CERAMIC_TIERS.map((t) => [t.key, t.name])).toEqual([
      ["3-year", "System X 3-Year"], ["10-year", "System X 10-Year"], ["5-year", "System X 6-Year"],
    ]);
    expect(tierPrices("3-year")).toEqual({ car: 850, suvTruck: 950 });
    expect(tierPrices("5-year")).toEqual({ car: 1300, suvTruck: 1400 });
    expect(tierPrices("10-year")).toEqual({ car: 1700, suvTruck: 1800 });
  });
  it("page, shared content and initial HTML carry no unsupported claims", () => {
    for (const t of [page, JSON.stringify(CERAMIC_TIERS), JSON.stringify(CERAMIC_SEO), ceramicPageHtml(), JSON.stringify(SERVICE_LANDING_BY_SLUG["ceramic-coating-baton-rouge"])])
      expect(t).not.toMatch(BANNED);
  });
  it("initial HTML lists every tier with car and SUV/truck prices and links paint correction + car hub", () => {
    const h = ceramicPageHtml();
    expect(h).toContain("System X 6-Year</strong> — from $1,300 (sedans &amp; coupes), from $1,400");
    expect(h).toContain('href="/paint-correction-baton-rouge"');
    expect(h).toContain('href="/car-detailing-baton-rouge"');
    expect(h).toMatch(/quoted separately/);
  });
  it("config metadata matches the page", () => {
    expect(SERVICE_LANDING_BY_SLUG["ceramic-coating-baton-rouge"].metaDescription).toBe(CERAMIC_SEO.description);
  });
});
