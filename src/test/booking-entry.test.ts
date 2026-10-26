import { describe, expect, it } from "vitest";
import { parseBookingEntry } from "@/lib/booking-entry";
import { AIRCRAFT_QUOTE_HREF } from "@/lib/aviation-policy";
import { AVIATION_OVERVIEW } from "@/lib/aviation-overview";

describe("booking deep links", () => {
  it("opens the aircraft quote branch from service=aircraft", () => {
    expect(parseBookingEntry("?service=aircraft")).toEqual({ service: "aircraft" });
  });
  it("ignores price or deposit values in the URL", () => {
    expect(parseBookingEntry("?service=aircraft&price=1&deposit=500")).toEqual({ service: "aircraft" });
  });
  it("keeps car package links", () => {
    expect(parseBookingEntry("?service=car&package=gold")).toEqual({ service: "car", package: "gold" });
  });
  it("rejects unknown services and packages", () => {
    expect(parseBookingEntry("?service=jet")).toBeNull();
    expect(parseBookingEntry("?service=car&package=platinum")).toBeNull();
    expect(parseBookingEntry("?repeat=abc")).toBeNull();
  });
  it("aviation quote buttons point to the aircraft quote form", () => {
    expect(AIRCRAFT_QUOTE_HREF).toBe("/book?service=aircraft");
    expect(AVIATION_OVERVIEW.quoteHref).toBe(AIRCRAFT_QUOTE_HREF);
  });
});
