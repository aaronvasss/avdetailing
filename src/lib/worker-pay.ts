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
export async function fetchShifts(opts: {
  userId?: string | null;
  fromDate?: string;
  toDate?: string;
}): Promise<ShiftRecord[]> {
  let query = supabase
    .from("worker_shifts")
    .select("id, user_id, clock_in_at, clock_out_at, total_minutes, approval_status, approved_at, approved_by, approval_note")
    .order("clock_in_at", { ascending: false });

  if (opts.userId) query = query.eq("user_id", opts.userId);
  if (opts.fromDate) query = query.gte("clock_in_at", `${opts.fromDate}T00:00:00`);
  if (opts.toDate) query = query.lte("clock_in_at", `${opts.toDate}T23:59:59`);

  const { data } = await query;
  return (data as ShiftRecord[]) || [];
}
