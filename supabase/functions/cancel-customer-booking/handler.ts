import { cancellationProblem } from "../_shared/cancellation-rules.ts";
import type { CancellationNotice } from "./owner-notification.ts";

export interface CancellationInput { bookingId: string; expectedDate: string; expectedTime: string; reason?: string }
export interface CancellationDependencies {
  db: any; authenticate: (authorization: string) => Promise<string | null>;
  parse: (body: unknown) => CancellationInput | null;
  notify: (notice: CancellationNotice) => Promise<void>;
  logFailure: (bookingId: string, message: string) => Promise<void>;
  now: () => Date; cors: Record<string, string>;
}
export function createCancellationHandler(deps: CancellationDependencies) {
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...deps.cors, "Content-Type": "application/json" } });
  return async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: deps.cors });
    if (req.method !== "POST") return reply(405, { error: "Method not allowed." });
    try {
      const auth = req.headers.get("Authorization");
      if (!auth?.startsWith("Bearer ")) return reply(401, { error: "Please sign in again to cancel your appointment." });
      const userId = await deps.authenticate(auth);
      if (!userId) return reply(401, { error: "Please sign in again to cancel your appointment." });
      let input: CancellationInput | null;
      try { input = deps.parse(await req.json()); } catch { input = null; }
      if (!input) return reply(400, { error: "Please refresh the appointment and try again. Reasons must be 1,000 characters or fewer." });
      const { bookingId, expectedDate, expectedTime } = input;
      const { data: booking, error: readError } = await deps.db.from("bookings")
        .select("id, user_id, status, scheduled_date, scheduled_time, updated_at, customer_notes, deposit_amount, guest_name, vehicle_year, vehicle_make, vehicle_model, vehicle_type, services(name)")
        .eq("id", bookingId).maybeSingle();
      if (readError) throw readError;
      if (!booking || booking.user_id !== userId) return reply(404, { error: "Appointment not found in your account." });
      if (["cancelled", "canceled"].includes(booking.status)) return reply(200, { ok: true, unchanged: true });
      if (booking.scheduled_date !== expectedDate || booking.scheduled_time.slice(0, 5) !== expectedTime.slice(0, 5))
        return reply(409, { error: "This appointment has changed. Refresh your appointments before cancelling." });
      const todayChicago = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(deps.now());
      const problem = cancellationProblem(booking, todayChicago);
      if (problem) return reply(409, { error: problem });
      let customerName = booking.guest_name?.trim();
      if (!customerName) {
        const { data } = await deps.db.from("profiles").select("full_name").eq("user_id", userId).maybeSingle();
        customerName = data?.full_name || "Customer";
      }
      const reason = input.reason?.trim() || "";
      const note = reason ? `Cancellation reason: ${reason}` : "Customer cancelled";
      const { data: updated, error } = await deps.db.from("bookings")
        .update({ status: "cancelled", customer_notes: [booking.customer_notes, note].filter(Boolean).join("\n") })
        .eq("id", bookingId).eq("user_id", userId).eq("status", booking.status).eq("updated_at", booking.updated_at)
        .eq("scheduled_date", booking.scheduled_date).eq("scheduled_time", booking.scheduled_time).select("id, updated_at");
      if (error) throw error;
      if (!updated?.length) return reply(409, { error: "This appointment just changed. Refresh and try again." });
      // No payment writes, refunds or forfeiture action. Notification failures cannot undo cancellation.
      try {
        await deps.notify({ bookingId, customerName, serviceName: booking.services?.name || "Detailing Service",
          vehicle: [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(" ") || booking.vehicle_type || "Vehicle not listed",
          date: booking.scheduled_date, time: booking.scheduled_time, reason, revision: updated[0].updated_at });
      } catch {
        await deps.logFailure(bookingId, "Owner notification failed after appointment was successfully cancelled.").catch(() => undefined);
      }
      return reply(200, { ok: true });
    } catch {
      return reply(500, { error: "We couldn't cancel right now. Your appointment is unchanged. Try again or contact us." });
    }
  };
}