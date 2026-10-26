import { describe, it, expect } from "vitest";
import { bookingAmounts, bookingCheckoutCents } from "../../supabase/functions/_shared/booking-pricing";
import { CAR_ACTIVE_ADD_ONS } from "@/lib/car-seo";

// Mock catalog rows mirroring the active service_add_ons prices (read-only).
const CATALOG: Record<string, number> = {
  "Clay Bar Treatment": 72.59, "Engine Bay Cleaning": 62.18, "Headlight Restoration": 72.59,
  "Odor Elimination": 67.36, "Pet Hair Removal": 46.63,
};

describe("car add-on payable totals", () => {
  it("every advertised add-on exists in the catalog mock", () => {
    for (const n of CAR_ACTIVE_ADD_ONS) expect(CATALOG[n]).toBeGreaterThan(0);
  });
  it.each([
    [["Odor Elimination"], 259.17 + 67.36],
    [["Pet Hair Removal"], 259.17 + 46.63],
    [["Odor Elimination", "Pet Hair Removal"], 259.17 + 67.36 + 46.63],
  ])("Silver sedan + %j totals package + catalog add-on prices only", (names, expected) => {
    const a = bookingAmounts(259.17, (names as string[]).map((n) => CATALOG[n]));
    expect(a.total).toBeCloseTo(expected, 2);
    expect(bookingCheckoutCents(a.total)).toBe(Math.round(expected * 100));
  });
});
