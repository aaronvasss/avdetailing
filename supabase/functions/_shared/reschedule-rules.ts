// Pure customer reschedule checks shared by the server function and tests.
export interface RescheduleSettings { open: number; close: number; latest: number; buffer: number; defaultDuration: number; capacity: number }
export interface DayBooking { scheduled_time: string; duration_minutes: number | null }

export const toMin = (t: string) => { const [h, m] = String(t).split(":").map(Number); return h * 60 + (m || 0); };

/** Returns an error message, or null when the requested slot may be booked. */
export function rescheduleProblem(args: {
  status: string; newDate: string; newTime: string; duration: number | null;
  todayChicago: string; blocked: boolean; settings: RescheduleSettings; dayBookings: DayBooking[];
}): string | null {
  const { status, newDate, newTime, settings: s } = args;
  if (!["pending", "confirmed"].includes(status)) return "This appointment can no longer be rescheduled online. Please call or text us.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate) || !/^\d{2}:\d{2}$/.test(newTime)) return "Please choose a valid date and time.";
  if (newDate <= args.todayChicago) return "Please choose a date at least one day from today.";
  if (args.blocked) return "That date is unavailable. Please choose another day.";
  const start = toMin(newTime);
  const dur = Math.min(args.duration || s.defaultDuration, s.close - s.open);
  if (start < s.open || start > s.latest || start + dur > s.close) return "That time is outside our booking hours. Please choose another time.";
  const end = start + dur + s.buffer;
  const overlaps = args.dayBookings.filter(b => {
    const bs = toMin(b.scheduled_time);
    return start < bs + (b.duration_minutes || s.defaultDuration) + s.buffer && end > bs;
  }).length;
  if (overlaps >= Math.max(1, s.capacity || 1)) return "That time was just taken. Please choose a different time.";
  return null;
}
