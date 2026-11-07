import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { customerBookingPaymentMethod, customerPaymentLabel, PAY_LATER_LABEL, CHECKOUT_UNAVAILABLE_MESSAGE } from "@/lib/card-only-booking";
import { bookingProgress } from "@/lib/booking-progress";
import { getFriendlyBookingError } from "@/lib/booking-errors";

const booking = readFileSync("src/pages/BookingPage.tsx", "utf8");
const success = readFileSync("src/pages/BookingSuccessPage.tsx", "utf8");
const terms = readFileSync("src/pages/TermsAndConditionsPage.tsx", "utf8");

describe("card-only booking", () => {
  it.each(["car", "rv"])("%s bookings pay by card at booking", s => expect(customerBookingPaymentMethod(s)).toBe("online"));
  it.each(["ceramic", "boat"])("%s bookings are saved to pay later by card", s => expect(customerBookingPaymentMethod(s)).toBe("in_person"));
  it("legacy in_person records show the pay-later card label", () => expect(customerPaymentLabel("in_person", "unpaid")).toBe(PAY_LATER_LABEL));
  it("unpaid card bookings after checkout failure show the pay-later label", () => expect(customerPaymentLabel("online", "unpaid")).toBe(PAY_LATER_LABEL));
  it("checkout failure message never asks for in-person payment", () => {
    expect(CHECKOUT_UNAVAILABLE_MESSAGE).toMatch(/saved as unpaid/);
    expect(getFriendlyBookingError(new Error("stripe checkout failed")).description).not.toMatch(/in person/i);
  });
  it("no payment-choice screen for car or RV", () => {
    expect(bookingProgress("car", 7).total).toBe(6);
    expect(bookingProgress("rv", 7).total).toBe(5);
  });
  it("booking page no longer offers or cancels for pay in person", () => {
    expect(booking).not.toMatch(/Pay in Person|Cash • Venmo/);
    expect(booking).not.toMatch(/status: "cancelled", payment_status: "failed"/);
  });
  it("success page labels in_person as pay later by card", () => expect(success).toContain(`in_person: "${PAY_LATER_LABEL}"`));
  it("terms payment section is card-only without the 3.5% fee", () => {
    expect(terms).toContain("credit and debit cards only");
    expect(terms).not.toMatch(/3\.5%|We accept cash/);
    expect(terms).toContain("Last updated: November 7, 2026");
  });
});
