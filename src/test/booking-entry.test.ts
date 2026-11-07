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

import { parseBookingVehicle, serviceForVehicleType, bookHref } from "@/lib/booking-entry";
describe("portal booking links", () => {
  it.each(["car", "ceramic", "paint", "boat", "rv", "aircraft"])("accepts service=%s", s => expect(parseBookingEntry(`?service=${s}`)).toEqual({ service: s }));
  it("rejects services outside the allowlist", () => expect(parseBookingEntry("?service=helicopter")).toBeNull());
  it("accepts only well-formed saved vehicle ids", () => {
    expect(parseBookingVehicle("?vehicle=6F9619FF-8B86-4D11-B42D-00C04FC964FF")).toBe("6f9619ff-8b86-4d11-b42d-00c04fc964ff");
    expect(parseBookingVehicle("?vehicle=1 or 1=1")).toBeNull();
    expect(parseBookingVehicle("?service=car")).toBeNull();
  });
  it("maps saved vehicle types to services", () => {
    expect(serviceForVehicleType("boat")).toBe("boat");
    expect(serviceForVehicleType("rv")).toBe("rv");
    expect(serviceForVehicleType("car")).toBe("car");
    expect(serviceForVehicleType("spaceship")).toBeNull();
  });
  it("builds portal links", () => {
    expect(bookHref("ceramic")).toBe("/book?service=ceramic");
    expect(bookHref("boat", "abc")).toBe("/book?service=boat&vehicle=abc");
    expect(bookHref(null, "abc")).toBe("/book?vehicle=abc");
  });
});
