import { describe, it, expect } from "vitest";
import { generateTimeSlots } from "@/lib/scheduling";
const cfg = { capacity: 2 } as any;
describe("booking hours", () => {
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
