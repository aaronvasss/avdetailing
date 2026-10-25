import { describe, it, expect } from "vitest";
import { format } from "date-fns";
import { parseDateString, businessAppointmentInstant } from "@/lib/time-format";

describe("appointment dates", () => {
  it("a booking stored as 2026-10-28 displays October 28", () => {
    expect(format(parseDateString("2026-10-28"), "MMMM d, yyyy")).toBe("October 28, 2026");
  });
  it("9:00 AM Chicago on Oct 28 2026 (CDT) is 14:00 UTC", () => {
    expect(businessAppointmentInstant("2026-10-28", "09:00").toISOString()).toBe("2026-10-28T14:00:00.000Z");
  });
  it("9:00 AM Chicago on Nov 3 2026 (CST) is 15:00 UTC", () => {
    expect(businessAppointmentInstant("2026-11-03", "9:00 AM").toISOString()).toBe("2026-11-03T15:00:00.000Z");
  });
});
