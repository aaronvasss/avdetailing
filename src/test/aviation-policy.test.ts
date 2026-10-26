import { describe, expect, it } from "vitest";
import { aviationPolicy } from "@/lib/aviation-policy";

describe("owner-confirmed public aviation policy (not payment enforcement)", () => {
  it("requires no deposit for aircraft bookings", () => {
    expect(aviationPolicy.depositRequired).toBe(false);
  });
  it("does not promise a response deadline", () => {
    expect(aviationPolicy.responseDeadlineHours).toBeNull();
  });
  it("covers airports throughout New Orleans without standing access", () => {
    expect(aviationPolicy.coverage.newOrleans).toEqual({ available: true, airportsThroughoutArea: true, establishedAirportAccess: false });
  });
  it("coordinates access and workspace for each job", () => {
    expect(aviationPolicy.coordinateAccessAndWorkspacePerJob).toBe(true);
  });
  it("preserves established Baton Rouge access", () => {
    expect(aviationPolicy.coverage.batonRouge).toEqual({ available: true, establishedAirportAccess: true });
  });
  it("preserves Lafayette coverage", () => {
    expect(aviationPolicy.coverage.lafayette.available).toBe(true);
  });
  it("keeps Lake Charles inquiry-only", () => {
    expect(aviationPolicy.coverage.lakeCharles.inquiryOnly).toBe(true);
  });
});