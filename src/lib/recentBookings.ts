import { supabase } from "@/integrations/supabase/client";

export interface PastBookingAddOn {
  add_on_id: string | null;
  name: string;
  price: number;
}

export interface PastBooking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  service_id: string;
  service_name: string | null;
  custom_service_description: string | null;
  vehicle_type: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_color: string | null;
  license_plate: string | null;
  service_address: string | null;
  service_city: string | null;
  service_zip: string | null;
  customer_notes: string | null;
  subtotal: number | null;
  add_ons_total: number | null;
  total_price: number | null;
  add_ons: PastBookingAddOn[];
  /** Best-effort package slug/name inferred from the service packages table. */
  package_slug: string | null;
  package_name: string | null;
}

const SELECT = `
  id, scheduled_date, scheduled_time, status, service_id, custom_service_description,
  vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_color, license_plate,
  service_address, service_city, service_zip, customer_notes,
  subtotal, add_ons_total, total_price,
  services:service_id ( name ),
  booking_add_ons ( add_on_id, name, price )
`;

interface FetchArgs {
  clientId?: string | null;
  email?: string | null;
  phone?: string | null;
  limit?: number;
}

/**
 * Recent appointments for a customer. Read-only: never mutates history.
 */
export async function fetchRecentCustomerBookings({
  clientId,
  email,
  phone,
  limit = 3,
}: FetchArgs): Promise<PastBooking[]> {
  const digits = (phone || "").replace(/\D/g, "");
  const rows: any[] = [];

  const runQuery = async (apply: (q: any) => any) => {
    const { data, error } = await apply(
      supabase
        .from("bookings")
        .select(SELECT)
        .order("scheduled_date", { ascending: false })
        .order("scheduled_time", { ascending: false })
        .limit(limit)
    );
    if (error) throw error;
    return data || [];
  };

  if (clientId) rows.push(...(await runQuery(q => q.eq("client_id", clientId))));
  if (rows.length < limit && email) {
    rows.push(...(await runQuery(q => q.ilike("guest_email", email))));
  }
  if (rows.length < limit && digits.length >= 10) {
    rows.push(...(await runQuery(q => q.ilike("guest_phone", `%${digits.slice(-10)}%`))));
  }

  // De-duplicate, keep newest first
  const seen = new Set<string>();
  const unique = rows.filter(r => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  unique.sort((a, b) =>
    `${b.scheduled_date}T${b.scheduled_time}`.localeCompare(`${a.scheduled_date}T${a.scheduled_time}`)
  );
  const top = unique.slice(0, limit);

  // Infer the package for each booking from (service_id, vehicle_type) + subtotal
  const serviceIds = Array.from(new Set(top.map(b => b.service_id).filter(Boolean)));
  let packages: any[] = [];
  if (serviceIds.length > 0) {
    const { data } = await supabase
      .from("service_packages")
      .select("service_id, vehicle_type, slug, name, price")
      .in("service_id", serviceIds);
    packages = data || [];
  }

  return top.map(b => {
    const candidates = packages.filter(
      p => p.service_id === b.service_id && p.vehicle_type === b.vehicle_type
    );
    const target = Number(b.subtotal ?? b.total_price ?? 0);
    let match: any = null;
    for (const c of candidates) {
      if (
        !match ||
        Math.abs(Number(c.price) - target) < Math.abs(Number(match.price) - target)
      ) {
        match = c;
      }
    }
    return {
      id: b.id,
      scheduled_date: b.scheduled_date,
      scheduled_time: b.scheduled_time,
      status: b.status,
      service_id: b.service_id,
      service_name: b.services?.name ?? null,
      custom_service_description: b.custom_service_description,
      vehicle_type: b.vehicle_type,
      vehicle_make: b.vehicle_make,
      vehicle_model: b.vehicle_model,
      vehicle_year: b.vehicle_year,
      vehicle_color: b.vehicle_color,
      license_plate: b.license_plate,
      service_address: b.service_address,
      service_city: b.service_city,
      service_zip: b.service_zip,
      customer_notes: b.customer_notes,
      subtotal: b.subtotal === null ? null : Number(b.subtotal),
      add_ons_total: b.add_ons_total === null ? null : Number(b.add_ons_total),
      total_price: b.total_price === null ? null : Number(b.total_price),
      add_ons: (b.booking_add_ons || []).map((a: any) => ({
        add_on_id: a.add_on_id,
        name: a.name,
        price: Number(a.price),
      })),
      package_slug: match?.slug ?? null,
      package_name: match?.name ?? null,
    };
  });
}

export function describePastVehicle(b: PastBooking): string {
  const parts = [b.vehicle_year, b.vehicle_make, b.vehicle_model].filter(Boolean);
  const base = parts.length ? parts.join(" ") : b.vehicle_type || "Vehicle";
  return b.vehicle_color ? `${base} · ${b.vehicle_color}` : base;
}
