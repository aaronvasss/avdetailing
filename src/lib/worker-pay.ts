import { supabase } from "@/integrations/supabase/client";

/** Company default hourly rate ($/hr) used when a worker has no rate set. */
export const DEFAULT_HOURLY_RATE = 18;

export interface WorkerProfileLike {
  pay_rate?: number | string | null;
  pay_type?: string | null;
}

export interface BookingPayLike {
  worker_pay_rate?: number | string | null;
  worker_pay_type?: string | null;
  actual_duration_minutes?: number | null;
  duration_minutes?: number | null;
}

/** Worker's default hourly rate, falling back to the company default. */
export function hourlyRateFor(profile: WorkerProfileLike | null | undefined): number {
  const rate = Number(profile?.pay_rate);
  return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_HOURLY_RATE;
}

/** Per-booking hourly override, when an admin set one. */
export function bookingHourlyRate(
  booking: BookingPayLike | null | undefined,
  profile: WorkerProfileLike | null | undefined,
): number {
  const override = Number(booking?.worker_pay_rate);
  if (booking?.worker_pay_rate != null && Number.isFinite(override) && override > 0) {
    return override;
  }
  return hourlyRateFor(profile);
}

export function hasHourlyOverride(booking: BookingPayLike | null | undefined): boolean {
  const override = Number(booking?.worker_pay_rate);
  return booking?.worker_pay_rate != null && Number.isFinite(override) && override > 0;
}

/** Pay for a number of minutes worked at a given hourly rate. */
export function payForMinutes(minutes: number, hourlyRate: number): number {
  if (!minutes || minutes <= 0) return 0;
  return (minutes / 60) * hourlyRate;
}

/** Minutes logged on a single job (clock in/out on the job, else scheduled duration). */
export function jobMinutes(booking: BookingPayLike | null | undefined): number {
  const actual = Number(booking?.actual_duration_minutes);
  if (Number.isFinite(actual) && actual > 0) return actual;
  return 0;
}

/** Estimated pay for one job, based on the time logged on that job. */
export function jobPay(
  booking: BookingPayLike | null | undefined,
  profile: WorkerProfileLike | null | undefined,
): number {
  return payForMinutes(jobMinutes(booking), bookingHourlyRate(booking, profile));
}

export function formatHours(minutes: number): string {
  const h = Math.floor(Math.max(0, minutes) / 60);
  const m = Math.round(Math.max(0, minutes) % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatDecimalHours(minutes: number): string {
  return (Math.max(0, minutes) / 60).toFixed(2);
}

/**
 * Parse admin-typed hours into minutes.
 * Accepts `7.5`, `7:30`, `7h 30m`, `7h`, `45m`.
 * Returns null when the input can't be understood.
 */
export function parseHoursInput(input: string): number | null {
  const raw = (input || "").trim().toLowerCase();
  if (!raw) return null;

  // 7:30
  const colon = raw.match(/^(\d{1,3}):([0-5]?\d)$/);
  if (colon) return Number(colon[1]) * 60 + Number(colon[2]);

  // 7h 30m / 7h / 30m
  const hm = raw.match(/^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+(?:\.\d+)?)\s*m)?$/);
  if (hm && (hm[1] || hm[2])) {
    return Math.round(Number(hm[1] || 0) * 60 + Number(hm[2] || 0));
  }

  // 7.5
  const dec = Number(raw);
  if (Number.isFinite(dec) && dec >= 0) return Math.round(dec * 60);

  return null;
}

/** Round-trip minutes back into an hours input value (e.g. 450 -> "7.5"). */
export function minutesToHoursInput(minutes: number | null | undefined): string {
  const m = Number(minutes);
  if (!Number.isFinite(m) || m <= 0) return "";
  const hours = m / 60;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}


export function formatMoney(amount: number): string {
  return `$${(Number.isFinite(amount) ? amount : 0).toFixed(2)}`;
}

export type ShiftApprovalStatus = "pending" | "approved" | "rejected";

export interface ShiftRecord {
  id: string;
  user_id: string;
  clock_in_at: string;
  clock_out_at: string | null;
  total_minutes: number | null;
  approval_status?: ShiftApprovalStatus | string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  approval_note?: string | null;
}

export const SHIFT_APPROVAL_LABELS: Record<ShiftApprovalStatus, string> = {
  pending: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
};

/** Normalized approval status of a shift (defaults to pending). */
export function shiftApprovalStatus(shift: ShiftRecord | { approval_status?: string | null } | null | undefined): ShiftApprovalStatus {
  const status = shift?.approval_status;
  return status === "approved" || status === "rejected" ? status : "pending";
}

export function isApprovedShift(shift: ShiftRecord): boolean {
  return shiftApprovalStatus(shift) === "approved";
}

/** Only approved shifts count toward payroll totals. */
export function approvedShifts(shifts: ShiftRecord[]): ShiftRecord[] {
  return shifts.filter(isApprovedShift);
}

export function pendingShifts(shifts: ShiftRecord[]): ShiftRecord[] {
  return shifts.filter((s) => shiftApprovalStatus(s) === "pending");
}

/** Total paid minutes from clock-in/clock-out shifts (open shifts counted live). */
export function shiftMinutes(shift: ShiftRecord): number {
  if (shift.total_minutes != null) return Number(shift.total_minutes) || 0;
  if (!shift.clock_out_at) {
    const started = new Date(shift.clock_in_at).getTime();
    if (!Number.isFinite(started)) return 0;
    return Math.max(0, Math.round((Date.now() - started) / 60000));
  }
  return 0;
}

export function sumShiftMinutes(shifts: ShiftRecord[]): number {
  return shifts.reduce((sum, s) => sum + shiftMinutes(s), 0);
}

/** Payable minutes: approved shifts only. */
export function sumApprovedShiftMinutes(shifts: ShiftRecord[]): number {
  return sumShiftMinutes(approvedShifts(shifts));
}

export function sumPendingShiftMinutes(shifts: ShiftRecord[]): number {
  return sumShiftMinutes(pendingShifts(shifts));
}

/**
 * Fetch shifts for a worker (or everyone, for admins) inside an inclusive date range.
 * Dates are `yyyy-MM-dd` strings in local business time.
 */
export async function fetchShiftsResult(opts: {
  userId?: string | null;
  fromDate?: string;
  toDate?: string;
}): Promise<{ data: ShiftRecord[]; error: string | null }> {
  let query = supabase
    .from("worker_shifts")
    .select("id, user_id, clock_in_at, clock_out_at, total_minutes, approval_status, approved_at, approved_by, approval_note")
    .order("clock_in_at", { ascending: false });

  if (opts.userId) query = query.eq("user_id", opts.userId);
  if (opts.fromDate) query = query.gte("clock_in_at", `${opts.fromDate}T00:00:00`);
  if (opts.toDate) query = query.lte("clock_in_at", `${opts.toDate}T23:59:59`);

  const { data, error } = await query;
  return { data: (data as ShiftRecord[]) || [], error: error?.message || null };
}

export async function fetchShifts(opts: {
  userId?: string | null;
  fromDate?: string;
  toDate?: string;
}): Promise<ShiftRecord[]> {
  const { data } = await fetchShiftsResult(opts);
  return data;
}


/**
 * Admin action: approve or reject shifts so they count (or stop counting) toward payroll.
 * Only admins can change these fields — enforced by a database trigger.
 */
export async function setShiftApproval(
  shiftIds: string[],
  status: ShiftApprovalStatus,
  note?: string | null,
): Promise<{ error: string | null; count: number }> {
  if (shiftIds.length === 0) return { error: null, count: 0 };
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("worker_shifts")
    .update({
      approval_status: status,
      approved_by: status === "pending" ? null : user?.id ?? null,
      approved_at: status === "pending" ? null : new Date().toISOString(),
      approval_note: note ?? null,
    })
    .in("id", shiftIds);
  return { error: error?.message ?? null, count: shiftIds.length };
}

function shortDayLabel(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Admin action: set the total hours worked on one day for one worker.
 * - No hours yet -> inserts an 8:00am shift of that length.
 * - Existing shifts -> applies the new total to the last shift, earlier shifts untouched.
 * - Zero/blank target -> deletes the day's shifts.
 * Entered time is approved immediately. Throws on failure.
 */
export async function saveDayHours(opts: {
  userId: string;
  dateKey: string;
  targetMinutes: number;
  existingShifts: ShiftRecord[];
}): Promise<void> {
  const { userId, dateKey, targetMinutes } = opts;
  const existing = [...opts.existingShifts].sort((a, b) =>
    a.clock_in_at < b.clock_in_at ? -1 : 1,
  );

  if (targetMinutes <= 0) {
    if (existing.length === 0) return;
    const { error } = await supabase
      .from("worker_shifts")
      .delete()
      .in("id", existing.map((s) => s.id));
    if (error) throw new Error(error.message);
    return;
  }

  if (existing.length === 0) {
    const clockIn = new Date(`${dateKey}T08:00:00`);
    const clockOut = new Date(clockIn.getTime() + targetMinutes * 60000);
    const { data, error } = await supabase
      .from("worker_shifts")
      .insert({
        user_id: userId,
        clock_in_at: clockIn.toISOString(),
        clock_out_at: clockOut.toISOString(),
        total_minutes: targetMinutes,
        notes: `Hours entered by admin: ${formatHours(targetMinutes)}`,
      })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data?.id) await setShiftApproval([data.id], "approved", "Hours entered by admin");
    return;
  }

  const last = existing[existing.length - 1];
  const others = sumShiftMinutes(existing.slice(0, -1));
  const forLast = targetMinutes - others;
  if (forLast <= 0) {
    throw new Error(
      `${shortDayLabel(dateKey)}: earlier shifts already total ${formatHours(others)}`,
    );
  }
  const prevMinutes = sumShiftMinutes(existing);
  const clockIn = new Date(last.clock_in_at);
  const { error } = await supabase
    .from("worker_shifts")
    .update({
      clock_in_at: clockIn.toISOString(),
      clock_out_at: new Date(clockIn.getTime() + forLast * 60000).toISOString(),
      total_minutes: forLast,
      notes: `Admin set hours: ${formatHours(prevMinutes)} → ${formatHours(targetMinutes)}`,
    })
    .eq("id", last.id);
  if (error) throw new Error(error.message);
  await setShiftApproval([last.id], "approved", "Hours entered by admin");
}
