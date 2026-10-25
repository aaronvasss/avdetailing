export const APPOINTMENT_ORIGIN = "https://avdetailing.net";
export type AppointmentAction = "manage" | "cancel" | "reschedule";
export function appointmentLinks(booking: { id: string; manage_token?: string | null }) {
  const url = (action: AppointmentAction) => {
    const params = new URLSearchParams({ booking: booking.id, action });
    if (booking.manage_token) params.set("token", booking.manage_token);
    return `${APPOINTMENT_ORIGIN}/booking/manage?${params}`;
  };
  return { manage: url("manage"), cancel: url("cancel"), reschedule: url("reschedule") };
}

/** Existing 256-bit random capabilities remain valid until 30 days after the appointment.
 * A changed/revoked token stops working immediately. No booking ID grants guest access. */
export function appointmentLinkValid(booking: { manage_token?: string | null; scheduled_date: string }, token: unknown, now: Date): boolean {
  if (typeof token !== "string" || !/^(?:[a-f0-9]{64}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.test(token)) return false;
  if (booking.manage_token !== token) return false;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const expiry = new Date(`${booking.scheduled_date}T12:00:00Z`);
  expiry.setUTCDate(expiry.getUTCDate() + 30);
  return Number.isFinite(expiry.getTime()) && today <= expiry.toISOString().slice(0, 10);
}

export async function verifyAppointmentLink(db: any, bookingId: string, token: unknown, now: Date): Promise<boolean> {
  const { data, error } = await db.from("bookings").select("manage_token, scheduled_date").eq("id", bookingId).maybeSingle();
  return !error && Boolean(data && appointmentLinkValid(data, token, now));
}