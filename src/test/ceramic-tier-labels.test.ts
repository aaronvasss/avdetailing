import { describe, it, expect } from "vitest";
import { CERAMIC_TIER_LABELS, CERAMIC_BOOKING_PRICES } from "@/lib/pricing";

describe("ceramic tiers (owner-confirmed 3/6/10 years)", () => {
  it("shows the legacy 5-year key to customers as 6-Year", () => {
    expect(CERAMIC_TIER_LABELS["5-year"]).toBe("6-Year Protection");
    expect(Object.values(CERAMIC_TIER_LABELS).join(" ")).not.toMatch(/5-Year/);
  });
  it("keeps the existing prices on the same keys", () => {
    expect(CERAMIC_BOOKING_PRICES.car).toEqual({ "3-year": 850, "5-year": 1300, "10-year": 1700 });
    expect(CERAMIC_BOOKING_PRICES["suv-truck"]).toEqual({ "3-year": 950, "5-year": 1400, "10-year": 1800 });
  });
});
