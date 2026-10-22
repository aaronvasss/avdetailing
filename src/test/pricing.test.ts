import { describe, it, expect } from "vitest";
import { buildPricing, FALLBACK_PACKAGES, FALLBACK_PLANS, ceramicFrom } from "@/lib/pricing";

const p = buildPricing(FALLBACK_PACKAGES, FALLBACK_PLANS);
describe("shared pricing", () => {
  it("uses booking package prices for car tiers", () => {
    expect(p.label(p.packageFrom("car", "Basic Package"))).toBe("$145");
    expect(p.label(p.packageFrom("car", "Gold Package"))).toBe("$363");
  });
  it("ceramic starts at the booked 3-year car price", () => expect(ceramicFrom("3-year")).toBe(850));
  it("aircraft has no public price", () => expect(p.label(p.startingAt("aircraft"), "By Quote")).toBe("By Quote"));
  it("bi-weekly membership totals two visits a month", () => expect(p.planMonthly("bi-weekly")).toBe(260));
});
