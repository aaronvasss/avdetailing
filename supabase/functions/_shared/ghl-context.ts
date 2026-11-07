// Loads the minimum data GHL needs for one queued event. Never selects notes, card data, pay or staff fields.
import type { SyncBooking, SyncContext, Links } from "./ghl-sync.ts";

const BOOKING_COLS = "id,user_id,status,payment_status,scheduled_date,scheduled_time,total_price,manage_token,membership_id,guest_name,guest_email,guest_phone,vehicle_type,vehicle_year,vehicle_make,vehicle_model,boat_brand,boat_length,aircraft_type,service_city,services(slug,name)";

export const chicagoToday = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);

function toBooking(r: any, rated: Set<string>): SyncBooking {
  return { ...r, service_slug: r.services?.slug ?? null, service_name: r.services?.name ?? null, package_name: null, has_rating: rated.has(r.id) };
}

export type QueueItem = { id: string; kind: string; booking_id: string | null; contact_id: string | null; membership_id: string | null; payment_record_id: string | null; payload: any; lease_id: string };

async function person(db: any, booking: any | null, userId: string | null) {
  let p = { email: booking?.guest_email ?? null, phone: booking?.guest_phone ?? null, name: booking?.guest_name ?? null };
  const guest = !!(booking?.guest_email || booking?.guest_phone);
  if ((!p.email || !p.phone || !p.name) && userId && !guest) {
    const { data } = await db.from("profiles").select("email,phone,full_name").eq("user_id", userId).maybeSingle();
    p = { email: p.email || data?.email || null, phone: p.phone || data?.phone || null, name: p.name || data?.full_name || null };
  }
  return p;
}

export async function loadContext(db: any, item: QueueItem, now = new Date()): Promise<SyncContext | "skip"> {
  let booking: any = null; let userId: string | null = null; let inquiry = false; let fullRefund = false;
  let p: { email: string | null; phone: string | null; name: string | null } = { email: null, phone: null, name: null };
  if (item.contact_id) {
    const { data, error } = await db.from("contacts").select("name,email,phone").eq("id", item.contact_id).maybeSingle();
    if (error) throw error; if (!data) return "skip";
    p = { email: data.email, phone: data.phone, name: data.name }; inquiry = true;
  } else if (item.membership_id) {
    const { data, error } = await db.from("customer_memberships").select("user_id").eq("id", item.membership_id).maybeSingle();
    if (error) throw error; if (!data) return "skip";
    userId = data.user_id; p = await person(db, null, userId);
  }
  if (item.booking_id) {
    const { data, error } = await db.from("bookings").select(BOOKING_COLS).eq("id", item.booking_id).maybeSingle();
    if (error) throw error; if (!data) return "skip";
    booking = data; userId = data.user_id; p = await person(db, data, userId);
  }
  if (item.kind === "refund") fullRefund = !!item.payload?.full;
  if (!p.email && !p.phone) return "skip";
  // History: this person's bookings by account or by the same booking email.
  const filters = [userId ? `user_id.eq.${userId}` : null, p.email ? `guest_email.ilike.${String(p.email).replace(/[%_,()]/g, "")}` : null].filter(Boolean).join(",");
  const { data: rows, error: hErr } = filters ? await db.from("bookings").select(BOOKING_COLS).or(filters).limit(500) : { data: [], error: null };
  if (hErr) throw hErr;
  const ids = [...new Set([...(rows ?? []).map((r: any) => r.id), booking?.id].filter(Boolean))];
  const { data: ratings } = ids.length ? await db.from("booking_ratings").select("booking_id").in("booking_id", ids) : { data: [] };
  const rated = new Set<string>((ratings ?? []).map((r: any) => r.booking_id));
  let membershipActive = false, membershipEver = false;
  if (userId) {
    const { data: ms } = await db.from("customer_memberships").select("status").eq("user_id", userId);
    membershipEver = (ms ?? []).length > 0; membershipActive = (ms ?? []).some((m: any) => m.status === "active");
  }
  return {
    kind: item.kind, person: p, booking: booking ? toBooking(booking, rated) : null,
    history: (rows ?? []).map((r: any) => toBooking(r, rated)), membershipActive, membershipEver, fullRefund, inquiry, today: chicagoToday(now),
  };
}

export function dbLinks(db: any): Links {
  return {
    async get(key) { const { data, error } = await db.from("ghl_links").select("ghl_id,stage_rank").eq("link_key", key).maybeSingle(); if (error) throw error; return data; },
    async set(key, id, rank) { const { error } = await db.from("ghl_links").upsert({ link_key: key, ghl_id: id, stage_rank: rank ?? null, updated_at: new Date().toISOString() }); if (error) throw error; },
    async remove(key) { const { error } = await db.from("ghl_links").delete().eq("link_key", key); if (error) throw error; },
  };
}
