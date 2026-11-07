import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { SERVICE_LANDING_PAGES } from "@/data/serviceLandingPages";
import { LOCATION_PAGES } from "@/data/locationPages";
import { STATIC_ROUTE_SEO } from "@/lib/static-route-seo";
import { CAR_HUB_SEO, PAINT_CORRECTION_SEO } from "@/lib/car-seo";
import { BOAT_HUB_SEO } from "@/lib/boat-seo";
import { RV_HUB_SEO, RV_INTERIOR_UNAVAILABLE } from "@/lib/rv-seo";
import { CERAMIC_SEO } from "@/lib/ceramic-seo";
import { AVIATION_OVERVIEW } from "@/lib/aviation-overview";
import { SERVICES_DIRECTORY_SEO } from "@/lib/services-directory-seo";
import { UTILITY_ROUTE_SEO } from "@/lib/utility-route-seo";
import { parseGoogleReviewSummary } from "@/lib/google-review-summary";
import { localBusinessSchema } from "@/components/seo/schema";
import { buildFaqs } from "@/components/home/FAQSection";
import { buildPricing, FALLBACK_PACKAGES, FALLBACK_PLANS, CAR_PAGE_DISPLAY_FROM } from "@/lib/pricing";
import { EDITORIAL_ROUTES } from "@/lib/editorial-html";

const metadata = [
  ...EDITORIAL_ROUTES,
  ...STATIC_ROUTE_SEO, ...UTILITY_ROUTE_SEO, CAR_HUB_SEO, PAINT_CORRECTION_SEO, BOAT_HUB_SEO,
  RV_HUB_SEO, RV_INTERIOR_UNAVAILABLE, CERAMIC_SEO, AVIATION_OVERVIEW, SERVICES_DIRECTORY_SEO,
  ...SERVICE_LANDING_PAGES.map(p => ({ path: `/${p.slug}`, title: p.seoTitle ?? `${p.title} | AV Detailing`, description: p.metaDescription })),
  ...LOCATION_PAGES.map(p => ({ path: `/${p.slug}`, title: `${p.titleTag} | AV Detailing`, description: p.metaDescription })),
];
describe("owner-approved SEO limits", () => {
  for (const page of metadata) {
    it(`${page.path} has a title no longer than 60 characters`, () => expect(page.title.length).toBeLessThanOrEqual(60));
    it(`${page.path} has a description no longer than 155 characters`, () => expect(page.description.length).toBeLessThanOrEqual(155));
  }
  it("homepage shell uses the shared homepage title", () => {
    const html = readFileSync("index.html", "utf8");
    expect(html.match(/<title>(.*?)<\/title>/)?.[1]).toBe(STATIC_ROUTE_SEO[0].title);
  });
});
describe("pricing and payment facts", () => {
  it("keeps the FAQ starting display at 140 without changing the payable price", () => {
    const p = buildPricing(FALLBACK_PACKAGES, FALLBACK_PLANS);
    expect(CAR_PAGE_DISPLAY_FROM.basic).toBe(140);
    expect(p.packageFrom("car", "Basic Package")).toBe(145.18);
    const faq = buildFaqs(p).find(f => f.question.startsWith("How much"));
    expect(faq?.answer).toContain("full interior + exterior details start at $140");
  });
  it("schema lists the exact accepted methods without aggregateRating", () => {
    const s = localBusinessSchema();
    expect(s.paymentAccepted).toBe("Credit Card, Debit Card");
    expect(s).not.toHaveProperty("aggregateRating");
  });
});
describe("verified Google metric validation", () => {
  it("accepts a complete valid pair", () => expect(parseGoogleReviewSummary('{"rating":4.8,"count":123}')).toEqual({ rating: 4.8, count: 123 }));
  for (const v of [undefined, "", "{}", '{"rating":5}', '{"rating":6,"count":10}', '{"rating":0,"count":10}', '{"rating":4.8,"count":0}', '{"rating":4.8,"count":1.5}', '{"rating":"5","count":10}', "broken"]) {
    it(`hides invalid or incomplete values: ${v}`, () => expect(parseGoogleReviewSummary(v)).toBeNull());
  }
});