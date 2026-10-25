import { describe, expect, it } from "vitest";
import { bookingProgress } from "@/lib/booking-progress";
import { addMinutesTo12h } from "@/lib/time-format";

describe("existing booking screen progress", () => {
  it("counts preselected package links at the required vehicle screen", () => {
    expect(bookingProgress("car", 2)).toEqual({ current: 2, total: 7, remaining: 5, label: "Vehicle" });
  });
  it("updates remaining screens when going forward and Back", () => {
    expect(bookingProgress("car", 4).remaining).toBe(3);
    expect(bookingProgress("car", 3).remaining).toBe(4);
    expect(bookingProgress("car", 7).remaining).toBe(0);
  });
  it("excludes boat vehicle, extras and payment screens", () => {
    expect(bookingProgress("boat", 5)).toEqual({ current: 3, total: 4, remaining: 1, label: "Schedule" });
    expect(bookingProgress("boat", 7).current).toBe(4);
  });
  it("counts ceramic scheduling and quote-only aircraft correctly", () => {
    expect(bookingProgress("ceramic", 5).remaining).toBe(1);
    expect(bookingProgress("aircraft", 2).remaining).toBe(0);
    expect(bookingProgress("rv", 7).current).toBe(6);
  });
  it("shows service end without adding the inter-appointment buffer", () => {
    expect(addMinutesTo12h("09:00", 105)).toBe("10:45 AM");
    expect(addMinutesTo12h("16:00", 180)).toBe("7:00 PM");
  });
});