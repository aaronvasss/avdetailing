import { rescheduleProblem } from "../_shared/reschedule-rules.ts";
import type { RescheduleNotice } from "./owner-notification.ts";

export interface RescheduleInput { bookingId: string; newDate: string; newTime: string; expectedDate: string; expectedTime: string; manageToken?: string }
export interface RescheduleDependencies {
  db: any;
  authenticate: (authorization: string) => Promise<string | null>;
  parse: (body: unknown) => RescheduleInput | null;
  notify: (notice: RescheduleNotice) => Promise<void>;
  logFailure: (bookingId: string, message: string) => Promise<void>;
  now: () => Date;
  cors: Record<string, string>;
  verifyLink?: (bookingId: string, token: string) => Promise<boolean>;
}

/** Dependency-injected server flow: tests use only an in-memory database and intercepted senders. */
export function createRescheduleHandler(deps: RescheduleDependencies) {
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...deps.cors, "Content-Type": "application/json" } });
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: deps.cors });
    if (req.method !== "POST") return reply(405, { error: "Method not allowed." });
    try {
      const auth = req.headers.get("Authorization");
      const userId = auth?.startsWith("Bearer ") ? await deps.authenticate(auth) : null;
      let input: RescheduleInput | null;
      try { input = deps.parse(await req.json()); } catch { input = null; }
      if (!input) return reply(400, { error: "Please choose a valid appointment, date and time, then try again." });
      const { bookingId, newDate, newTime, expectedDate, expectedTime } = input;
      const linkVerified = Boolean(input.manageToken && deps.verifyLink && await deps.verifyLink(bookingId, input.manageToken));
      if (!userId && !linkVerified) return reply(401, { error: "This link is invalid or expired. Use your latest appointment email or sign in." });
      const db = deps.db;
      const { data: booking, error: bookingError } = await db.from("bookings")
        .select("id, user_id, status, duration_minutes, scheduled_date, scheduled_time, updated_at, guest_name, services(name)").eq("id", bookingId).maybeSingle();
      if (bookingError) throw bookingError;
      if (!booking || (!linkVerified && booking.user_id !== userId)) return reply(404, { error: "Appointment not found." });
      const sameTime = (a: string, b: string) => a.slice(0, 5) === b.slice(0, 5);
      // A retry after a lost success response must not send again or update pending status again.
      if (booking.scheduled_date === newDate && sameTime(booking.scheduled_time, newTime)) {
        return reply(200, { ok: true, unchanged: true, scheduled_date: newDate, scheduled_time: newTime });
      }
      if (booking.scheduled_date !== expectedDate || !sameTime(booking.scheduled_time, expectedTime)) {
        return reply(409, { error: "This appointment just changed. Please refresh and try again." });
      }
      const { data: settings, error: settingsError } = await db.from("business_settings").select("key, value")
        .in("key", ["business_hours_start", "business_hours_end", "buffer_minutes", "default_duration", "latest_start_time"]);
      if (settingsError) throw settingsError;
      const m: Record<string, string> = {};
      (settings || []).forEach((r: { key: string; value: string }) => { m[r.key] = r.value; });
      const toMin = (t: string) => { const [h, mm] = t.split(":").map(Number); return h * 60 + (mm || 0); };
      const [blockedResult, capacityResult, dayResult] = await Promise.all([
        db.from("blocked_dates").select("id").eq("blocked_date", newDate).limit(1),
        db.rpc("get_booking_capacity"),
        db.from("bookings").select("scheduled_time, duration_minutes").eq("scheduled_date", newDate).neq("id", bookingId).in("status", ["pending", "confirmed", "in_progress"]),
      ]);
      if (blockedResult.error || capacityResult.error || dayResult.error) throw new Error("Availability could not be verified.");
      const todayChicago = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(deps.now());
      const problem = rescheduleProblem({
        status: booking.status, newDate, newTime, duration: booking.duration_minutes, todayChicago,
        blocked: Boolean(blockedResult.data?.length), dayBookings: dayResult.data || [],
        settings: { open: toMin(m.business_hours_start || "06:00"), close: toMin(m.business_hours_end || "20:00"), latest: toMin(m.latest_start_time || "18:00"),
          buffer: parseInt(m.buffer_minutes || "30"), defaultDuration: parseInt(m.default_duration || "135"), capacity: Number(capacityResult.data) || 1 },
      });
      if (problem) return reply(409, { error: problem });

      // Capture fallback identity before saving; an identity lookup failure cannot mask a successful save.
      let customerName = booking.guest_name?.trim();
      if (!customerName && booking.user_id) {
        const { data: profile } = await db.from("profiles").select("full_name").eq("user_id", booking.user_id).maybeSingle();
        customerName = profile?.full_name || "Customer";
      }
      // Atomic compare-and-set: only one concurrent request wins and is allowed to notify.
      const { data: updated, error } = await db.from("bookings")
        .update({ scheduled_date: newDate, scheduled_time: newTime, status: "pending" })
        .eq("id", bookingId).eq("scheduled_date", booking.scheduled_date).eq("scheduled_time", booking.scheduled_time)
        .eq("status", booking.status).eq("updated_at", booking.updated_at).select("id, updated_at");
      if (error) throw error;
      if (!updated?.length) return reply(409, { error: "This appointment just changed. Please refresh and try again." });

      // Separate delivery from save errors: preserve the new time even if a provider or logger fails.
      try {
        await deps.notify({ bookingId, customerName: customerName || "Customer", serviceName: booking.services?.name || "Detailing Service",
          oldDate: booking.scheduled_date, oldTime: booking.scheduled_time, newDate, newTime,
          revision: updated[0].updated_at || booking.updated_at });
      } catch {
        await deps.logFailure(bookingId, "Owner notification failed after appointment was successfully rescheduled.").catch(() => undefined);
      }
      return reply(200, { ok: true, scheduled_date: newDate, scheduled_time: newTime });
    } catch {
      return reply(500, { error: "We couldn't reschedule right now. Your original appointment is unchanged." });
    }
  };
}