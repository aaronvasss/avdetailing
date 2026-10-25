import { describe, it, expect } from "vitest";
import { rescheduleProblem } from "../../supabase/functions/_shared/reschedule-rules";

const settings = { open: 360, close: 1200, latest: 1080, buffer: 30, defaultDuration: 135, capacity: 2 };
const base = { status: "confirmed", newDate: "2026-10-28", newTime: "09:00:00", duration: 135, todayChicago: "2026-10-25", blocked: false, settings, dayBookings: [] };

describe("customer reschedule rules", () => {
  it("allows an open slot inside hours", () => expect(rescheduleProblem(base)).toBeNull());
  it("rejects starts before 6 AM", () => expect(rescheduleProblem({ ...base, newTime: "05:30" })).toMatch(/outside/));
  it("rejects starts after 6 PM", () => expect(rescheduleProblem({ ...base, newTime: "18:30" })).toMatch(/outside/));
  it("rejects jobs ending after 8 PM", () => expect(rescheduleProblem({ ...base, newTime: "18:00", duration: 180 })).toMatch(/outside/));
  it("rejects same-day moves", () => expect(rescheduleProblem({ ...base, newDate: "2026-10-25" })).toMatch(/one day/));
  it("rejects blocked dates", () => expect(rescheduleProblem({ ...base, blocked: true })).toMatch(/unavailable/));
  it("rejects completed appointments", () => expect(rescheduleProblem({ ...base, status: "completed" })).toMatch(/no longer/));
  it("allows overlap while workers remain", () =>
    expect(rescheduleProblem({ ...base, dayBookings: [{ scheduled_time: "09:00:00", duration_minutes: 135 }] })).toBeNull());
  it("rejects when every worker is busy, counting buffer", () =>
    expect(rescheduleProblem({ ...base, newTime: "11:30", dayBookings: [
      { scheduled_time: "09:00:00", duration_minutes: 135 }, { scheduled_time: "10:00:00", duration_minutes: 135 },
    ] })).toMatch(/taken/));
});
