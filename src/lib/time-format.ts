/**
 * Canonical time & date handling for booking / scheduling.
 *
 * RULES
 *  - Database storage: always 24-hour "HH:mm" (Postgres `time` accepts it).
 *  - User/admin display: always friendly 12-hour, e.g. "9:00 AM".
 *  - Business timezone: America/Chicago. Dates are handled as plain
 *    calendar strings (yyyy-MM-dd) so UTC conversion can never shift a day.
 */

export const BUSINESS_TIMEZONE = "America/Chicago";

/** Parse any mixed legacy value ("9:00 AM", "09:00:00", "9:00") to minutes from midnight. */
export function parseTimeToMinutes(input?: string | null): number | null {
  if (!input) return null;
  const value = String(input).trim();

  const m12 = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp])\.?[Mm]\.?$/);
  if (m12) {
    let h = parseInt(m12[1], 10) % 12;
    if (m12[4].toLowerCase() === "p") h += 12;
    const min = parseInt(m12[2], 10);
    if (min > 59) return null;
    return h * 60 + min;
  }

  const m24 = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m24) {
    const h = parseInt(m24[1], 10);
    const min = parseInt(m24[2], 10);
    if (h > 23 || min > 59) return null;
    return h * 60 + min;
  }

  return null;
}

/** Minutes from midnight -> "HH:mm" (database format). */
export function minutesToDbTime(minutes: number): string {
  const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Minutes from midnight -> "9:00 AM" (display format). */
export function minutesTo12h(minutes: number): string {
  const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h24 = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Normalize any value to the canonical database format "HH:mm". Returns null when unparseable. */
export function toDbTime(input?: string | null): string | null {
  const minutes = parseTimeToMinutes(input);
  return minutes === null ? null : minutesToDbTime(minutes);
}

/** Normalize any value for display: "9:00 AM". Falls back to the raw string. */
export function formatTime12h(input?: string | null): string {
  const minutes = parseTimeToMinutes(input);
  if (minutes === null) return input ? String(input) : "";
  return minutesTo12h(minutes);
}

/** Add minutes to a time value and return the display format ("ends at ..."). */
export function addMinutesTo12h(input: string | null | undefined, minutesToAdd: number): string {
  const start = parseTimeToMinutes(input);
  if (start === null) return "";
  return minutesTo12h(start + minutesToAdd);
}

/** Morning / Afternoon / Evening grouping for slot pickers. */
export type SlotPeriod = "Morning" | "Afternoon" | "Evening";

export function periodForTime(input: string): SlotPeriod {
  const minutes = parseTimeToMinutes(input) ?? 0;
  if (minutes < 12 * 60) return "Morning";
  if (minutes < 17 * 60) return "Afternoon";
  return "Evening";
}

export function groupSlotsByPeriod(slots: string[]): Array<{ period: SlotPeriod; slots: string[] }> {
  const order: SlotPeriod[] = ["Morning", "Afternoon", "Evening"];
  return order
    .map((period) => ({ period, slots: slots.filter((s) => periodForTime(s) === period) }))
    .filter((g) => g.slots.length > 0);
}

// ============ DATE (calendar-day) HELPERS — timezone safe ============

/** Format a Date as a plain calendar date string using its LOCAL parts (never UTC). */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse "yyyy-MM-dd" into a local Date at midnight (no UTC shift). */
export function parseDateString(value: string): Date {
  const [y, m, d] = value.split("T")[0].split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

/** Combine a calendar date + stored time into a local Date object. */
export function combineDateAndTime(dateStr: string, timeStr?: string | null): Date {
  const base = parseDateString(dateStr);
  const minutes = parseTimeToMinutes(timeStr) ?? 0;
  base.setMinutes(minutes);
  return base;
}

/** Today's calendar date in the business timezone (America/Chicago). */
export function businessToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Current minutes-from-midnight in the business timezone. */
export function businessNowMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  return parseTimeToMinutes(parts.replace("24:", "00:")) ?? 0;
}

/** True when the given date string is the business-timezone "today". */
export function isBusinessToday(dateStr: string): boolean {
  return dateStr.split("T")[0] === businessToday();
}
