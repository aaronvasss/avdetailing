import { describe, it, expect } from "vitest";
import { authoritativePackagePrice, bookingAmounts, bookingCheckoutCents } from "../../supabase/functions/_shared/booking-pricing";

const packages = {
  basic: { sedan: 145.18, "suv-5": 145.18, "suv-8": 155.54, truck: 155.54 },
  silver: { sedan: 259.17, "suv-5": 259.17, "suv-8": 274.72, truck: 274.72 },
  gold: { sedan: 362.80, "suv-5": 362.80, "suv-8": 378.34, truck: 378.34 },
};
describe("authoritative booking prices", () => {
  for (const [slug, prices] of Object.entries(packages)) {
    for (const [vehicle, expected] of Object.entries(prices)) {
      it(`${slug} ${vehicle} displays and submits ${expected} for either payment method`, () => {
        const price = authoritativePackagePrice(prices, vehicle, 0);
        expect(price).toBe(expected);
        const amounts = bookingAmounts(price, []);
        expect(amounts.total).toBe(expected);
        expect(bookingCheckoutCents(amounts.total)).toBe(Math.round(expected * 100));
      });
    }
  }
  it("uses all-vehicle prices for flat-priced packages", () => expect(authoritativePackagePrice({ all: 400 }, "sedan", 0)).toBe(400));
  it("adds exact authoritative add-ons without another processing fee", () => {
    expect(bookingAmounts(145.18, [46.63, 62.18, 67.36, 72.59, 72.59])).toEqual({ subtotal: 145.18, addOnsTotal: 321.35, total: 466.53 });
    expect(bookingCheckoutCents(466.53)).toBe(46653);
  });
  it("recalculates vehicle, package and add-on changes from the current selections", () => {
    expect(bookingAmounts(authoritativePackagePrice(packages.basic, "sedan", 0), [46.63]).total).toBe(191.81);
    expect(bookingAmounts(authoritativePackagePrice(packages.basic, "truck", 0), [46.63]).total).toBe(202.17);
    expect(bookingAmounts(authoritativePackagePrice(packages.gold, "truck", 0), [46.63]).total).toBe(424.97);
    expect(bookingAmounts(authoritativePackagePrice(packages.gold, "truck", 0), []).total).toBe(378.34);
  });
  it("checkout retains the saved total even when catalog or selected add-ons change", () => expect(bookingCheckoutCents(191.81)).toBe(19181));
  it("does not permit invalid payable amounts", () => expect(() => bookingCheckoutCents(-1)).toThrow());
});