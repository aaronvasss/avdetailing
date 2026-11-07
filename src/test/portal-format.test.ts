import { describe, it, expect } from "vitest";
import { centralGreeting, displayFirstName, initialsOf, joinAddress } from "@/components/portal/portal-format";

describe("customer portal display helpers", () => {
  it("capitalizes the first name for the greeting", () => {
    expect(displayFirstName("bob smith", "x@y.com")).toBe("Bob");
    expect(displayFirstName(null, "jane@example.com")).toBe("Jane");
  });
  it("builds initials", () => {
    expect(initialsOf("bob smith", null)).toBe("BS");
    expect(initialsOf(null, "zed@x.com")).toBe("Z");
  });
  it("greets by Central Time", () => {
    expect(centralGreeting(new Date("2026-11-07T03:00:00Z"))).toBe("Good evening"); // 9 PM Chicago
    expect(centralGreeting(new Date("2026-11-07T15:00:00Z"))).toBe("Good morning"); // 9 AM Chicago
  });
  it("drops stored null placeholders from addresses", () => {
    expect(joinAddress(["3154 college drive, suite H", "null", "", "70810"])).toBe("3154 college drive, suite H, 70810");
  });
});
