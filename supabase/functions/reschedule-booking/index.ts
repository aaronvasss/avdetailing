import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rescheduleProblem } from "../_shared/reschedule-rules.ts";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return reply(401, { error: "Please sign in again." });
    const { data: u } = await createClient(URL_, ANON, { global: { headers: { Authorization: auth } } }).auth.getUser();
    if (!u?.user) return reply(401, { error: "Please sign in again." });
    const { bookingId, newDate, newTime } = await req.json();
    if (typeof bookingId !== "string") return reply(400, { error: "Missing appointment." });

    const db = createClient(URL_, SERVICE);
    const { data: booking } = await db.from("bookings").select("id, user_id, status, duration_minutes, scheduled_date, scheduled_time").eq("id", bookingId).maybeSingle();
    if (!booking || booking.user_id !== u.user.id) return reply(404, { error: "Appointment not found." });

    const { data: settings } = await db.from("business_settings").select("key, value")
      .in("key", ["business_hours_start", "business_hours_end", "buffer_minutes", "default_duration", "latest_start_time"]);
    const m: Record<string, string> = {};
    (settings || []).forEach((r: any) => { m[r.key] = r.value; });
    const toMin = (t: string) => { const [h, mm] = t.split(":").map(Number); return h * 60 + (mm || 0); };
    const [{ data: blocked }, { data: cap }, { data: day }] = await Promise.all([
      db.from("blocked_dates").select("id").eq("blocked_date", newDate).limit(1),
      db.rpc("get_booking_capacity"),
      db.from("bookings").select("scheduled_time, duration_minutes").eq("scheduled_date", newDate).neq("id", bookingId).in("status", ["pending", "confirmed", "in_progress"]),
    ]);
    const todayChicago = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const problem = rescheduleProblem({
      status: booking.status, newDate, newTime, duration: booking.duration_minutes, todayChicago,
      blocked: Boolean(blocked?.length), dayBookings: (day || []).map((b: any) => ({ scheduled_time: String(b.scheduled_time), duration_minutes: b.duration_minutes })),
      settings: { open: toMin(m.business_hours_start || "06:00"), close: toMin(m.business_hours_end || "20:00"), latest: toMin(m.latest_start_time || "18:00"),
        buffer: parseInt(m.buffer_minutes || "30"), defaultDuration: parseInt(m.default_duration || "135"), capacity: Number(cap) || 1 },
    });
    if (problem) return reply(409, { error: problem });

    // Only move the booking if it is still at the time the customer saw.
    const { data: updated, error } = await db.from("bookings")
      .update({ scheduled_date: newDate, scheduled_time: newTime, status: "pending" })
      .eq("id", bookingId).eq("scheduled_date", booking.scheduled_date).eq("scheduled_time", booking.scheduled_time).select("id");
    if (error) throw error;
    if (!updated?.length) return reply(409, { error: "This appointment just changed. Please refresh and try again." });
    return reply(200, { ok: true, scheduled_date: newDate, scheduled_time: newTime });
  } catch (e) {
    console.error("reschedule-booking", e);
    return reply(500, { error: "We couldn't reschedule right now. Your original appointment is unchanged." });
  }
});
