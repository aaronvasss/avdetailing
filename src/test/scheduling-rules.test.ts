import { describe, it, expect } from "vitest";
import { generateTimeSlots } from "@/lib/scheduling";
import { canOverrideBookingHours } from "../../supabase/functions/_shared/admin-booking-hours";
const cfg = { capacity: 2 } as any;
describe("booking hours", () => {
  it("owner scheduling includes 5 AM and 9 PM, even when the job ends after 8 PM", () => {
    const slots = generateTimeSlots(135, [], cfg, { allowOutsideHours: true });
    expect(slots).toContain("05:00:00");
    expect(slots).toContain("21:00:00");
  });
  it("customer slots exclude early and late starts and jobs ending after 8 PM", () => {
    const slots = generateTimeSlots(135, [], cfg);
    expect(slots).not.toContain("05:00:00");
    expect(slots).not.toContain("21:00:00");
    expect(slots).not.toContain("18:00:00");
  });
  it("only an admin explicitly requesting internal booking can override hours", () => {
    expect(canOverrideBookingHours(["admin"], true)).toBe(true);
    expect(canOverrideBookingHours(["admin"], false)).toBe(false);
    expect(canOverrideBookingHours(["admin"], undefined)).toBe(false);
    for (const roles of [[], ["customer"], ["staff"], ["manager"]]) {
      expect(canOverrideBookingHours(roles, true)).toBe(false);
    }
    expect(canOverrideBookingHours(["admin"], "true")).toBe(false);
  });
  it("owner outside-hours slots still honor capacity and buffer", () => {
    const slots = generateTimeSlots(135, [{ scheduled_time: "21:00:00", duration_minutes: 135 }], { capacity: 1 }, { allowOutsideHours: true });
    expect(slots).not.toContain("21:00:00");
    expect(slots).not.toContain("23:30:00");
  });
  it("never starts before 6:00 AM", () => expect(generateTimeSlots(135, [], cfg)[0]).toMatch(/^6:00 AM|^06:00/));
  it("a 4-hour service cannot start after 4:00 PM (must finish by 8 PM)", () => {
    const s = generateTimeSlots(240, [], cfg);
    expect(s.some(t => /4:30 PM|16:30/.test(t))).toBe(false);
    expect(s.some(t => /4:00 PM|16:00/.test(t))).toBe(true);
  });
  it("one booking does not block the slot when a second worker is free", () => {
    const s = generateTimeSlots(135, [{ scheduled_time: "09:00:00", duration_minutes: 135 }], cfg);
    expect(s.some(t => /^9:00 AM|^09:00/.test(t))).toBe(true);
  });
  it("blocks the slot when every worker is busy", () => {
    const s = generateTimeSlots(135, [{ scheduled_time: "09:00:00", duration_minutes: 135 }], { capacity: 1 } as any);
    expect(s.some(t => /^9:00 AM|^09:00/.test(t))).toBe(false);
  });
});
