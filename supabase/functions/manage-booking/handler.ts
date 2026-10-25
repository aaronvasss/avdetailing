import { appointmentLinkValid } from "../_shared/appointment-links.ts";
import { rescheduleProblem } from "../_shared/reschedule-rules.ts";

export function createManageHandler(deps: { db: any; cors: Record<string, string>; now: () => Date; authenticate: (header: string) => Promise<string | null> }) {
  const reply = (status: number, data: unknown) => new Response(JSON.stringify(data), { status, headers: { ...deps.cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
  return async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: deps.cors });
    if (req.method !== "POST") return reply(405, { error: "Method not allowed." });
    try {
      const input = await req.json();
      const { token, bookingId, action, date } = input;
      if (!["get", "slots"].includes(action)) return reply(409, { error: "Please reopen your appointment link and review the change before confirming." });
      if (token !== undefined && (typeof token !== "string" || token.length < 32 || token.length > 100)) return reply(400, { error: "This appointment link is invalid or expired. Use your latest email or contact us." });
      if (bookingId !== undefined && (typeof bookingId !== "string" || !/^[a-f0-9-]{36}$/i.test(bookingId))) return reply(400, { error: "Invalid appointment link." });
      if (!token && !bookingId) return reply(401, { error: "This older link is missing its security token. Use your latest appointment email or your account." });
      let query = deps.db.from("bookings").select("id, user_id, manage_token, scheduled_date, scheduled_time, duration_minutes, status, deposit_amount, total_price, service_address, service_city, service_state, vehicle_year, vehicle_make, vehicle_model, vehicle_type, services(name, slug)");
      query = bookingId ? query.eq("id", bookingId) : query.eq("manage_token", token);
      const { data: booking, error } = await query.maybeSingle();
      if (error) throw error;
      const linkVerified = booking && appointmentLinkValid(booking, token, deps.now());
      const header = req.headers.get("Authorization");
      const uid = !linkVerified && header?.startsWith("Bearer ") ? await deps.authenticate(header) : null;
      if (!booking || (!linkVerified && (!uid || uid !== booking.user_id))) return reply(401, { error: "This appointment link is invalid or expired. Use your latest email, sign in to your account, or contact us." });
      if (action === "get") {
        const { manage_token: _secret, user_id: _owner, ...safeBooking } = booking;
        return reply(200, { booking: safeBooking });
      }
      if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date) return reply(400, { error: "Choose a valid date." });
      const [settings, blocked, capacity, bookings] = await Promise.all([
        deps.db.from("business_settings").select("key, value").in("key", ["business_hours_start", "business_hours_end", "latest_start_time", "buffer_minutes", "default_duration"]),
        deps.db.from("blocked_dates").select("id").eq("blocked_date", date).limit(1),
        deps.db.rpc("get_booking_capacity"),
        deps.db.from("bookings").select("scheduled_time, duration_minutes").eq("scheduled_date", date).neq("id", booking.id).in("status", ["pending", "confirmed", "in_progress"]),
      ]);
      if (settings.error || blocked.error || capacity.error || bookings.error) throw new Error("Availability unavailable");
      const values = Object.fromEntries((settings.data || []).map((r: any) => [r.key, r.value]));
      const minutes = (value: string) => { const [h, m] = value.split(":").map(Number); return h * 60 + m; };
      const config = { open: Math.max(360, minutes(values.business_hours_start || "06:00")), close: Math.min(1200, minutes(values.business_hours_end || "20:00")), latest: Math.min(1080, minutes(values.latest_start_time || "18:00")), buffer: Number(values.buffer_minutes || 30), defaultDuration: Number(values.default_duration || 135), capacity: Number(capacity.data) || 1 };
      const todayChicago = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(deps.now());
      const slots: string[] = [];
      for (let start = config.open; start <= config.latest; start += 30) {
        const time = `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`;
        if (!rescheduleProblem({ status: booking.status, newDate: date, newTime: time, todayChicago, duration: booking.duration_minutes, blocked: Boolean(blocked.data?.length), settings: config, dayBookings: bookings.data || [] })) slots.push(time);
      }
      return reply(200, { slots });
    } catch { return reply(503, { error: "We couldn't load your appointment or availability. Please retry or contact us." }); }
  };
}