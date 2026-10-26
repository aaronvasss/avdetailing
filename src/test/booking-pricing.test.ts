import { describe, it, expect } from "vitest";
import { authoritativePackagePrice, bookingAmounts, bookingCheckoutCents } from "../../supabase/functions/_shared/booking-pricing";

const packages = {
  basic: { sedan: 145.18, "suv-5": 145.18, "suv-8": 155.54, truck: 155.54 },
  silver: { sedan: 259.17, "suv-5": 259.17, "suv-8": 274.72, truck: 274.72 },
  gold: { sedan: 362.80, "suv-5": 362.80, "suv-8": 378.34, truck: 378.34 },
};
const payableCases = [
  { slug: "basic", small: [145.18, 191.81, 466.53], large: [155.54, 202.17, 476.89] },
  { slug: "silver", small: [259.17, 305.80, 580.52], large: [274.72, 321.35, 596.07] },
  { slug: "gold", small: [362.80, 409.43, 684.15], large: [378.34, 424.97, 699.69] },
] as const;
const addOnCases = [[], [46.63], [46.63, 62.18, 67.36, 72.59, 72.59]];
describe("authoritative booking prices", () => {
  for (const row of payableCases) {
    for (const vehicle of ["sedan", "suv-5", "suv-8", "truck"] as const) {
      for (const method of ["in_person", "online"] as const) {
        addOnCases.forEach((addOns, index) => {
          const expected = (vehicle === "sedan" || vehicle === "suv-5" ? row.small : row.large)[index];
          it(`${row.slug} ${vehicle} ${method} with ${addOns.length} add-ons preserves the payable total ${expected}`, () => {
            const price = authoritativePackagePrice(packages[row.slug], vehicle, 0);
            const amounts = bookingAmounts(price, addOns);
            // Model the persisted record without invoking booking or Stripe services.
            const savedBooking = { ...amounts, total_price: amounts.total, payment_method: method };
            expect(amounts.total).toBe(expected);
            expect(savedBooking.total_price).toBe(expected);
            expect(bookingCheckoutCents(savedBooking.total_price)).toBe(Math.round(expected * 100));
          });
        });
      }
    }
  }
  it("prefers exact vehicle rows before generic SUV and all-vehicle prices", () => {
    const prices = { "suv-8": 155.54, "suv-5": 145.18, suv: 999, all: 800 };
    expect(authoritativePackagePrice(prices, "suv-8", 0)).toBe(155.54);
    expect(authoritativePackagePrice(prices, "suv-5", 0)).toBe(145.18);
  });
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
  for (const method of ["in_person", "online"] as const) {
    it(`RV Exterior Wash ${method} selection, saved payable and checkout stay $350 without another fee`, () => {
      const price = authoritativePackagePrice({ rv: 350 }, "rv", 350);
      const amounts = bookingAmounts(price, []);
      const savedBooking = { total_price: amounts.total, payment_method: method };
      expect(price).toBe(350);
      expect(amounts).toEqual({ subtotal: 350, addOnsTotal: 0, total: 350 });
      expect(savedBooking.total_price).toBe(350);
      expect(bookingCheckoutCents(savedBooking.total_price)).toBe(35000);
      expect(bookingAmounts(price, [46.63]).total).toBe(396.63);
      expect(bookingCheckoutCents(396.63)).toBe(39663);
    });
  }
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