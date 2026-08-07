import { supabase } from "@/integrations/supabase/client";

export interface CustomerVehicle {
  id: string;
  client_id: string | null;
  user_id: string | null;
  vehicle_type: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  license_plate: string | null;
  notes: string | null;
}

export interface VehicleInput {
  vehicleType?: string | null;
  make?: string | null;
  model?: string | null;
  year?: string | number | null;
  color?: string | null;
  licensePlate?: string | null;
}

const clean = (v: string | null | undefined) => {
  const t = (v ?? "").trim();
  return t.length ? t : null;
};

const toYear = (v: string | number | null | undefined): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  return Number.isFinite(n) && n >= 1900 && n <= 2100 ? n : null;
};

const sameText = (a: string | null, b: string | null) =>
  (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();

/** Vehicles saved on a client record (customers without a website login included). */
export async function fetchClientVehicles(clientId: string): Promise<CustomerVehicle[]> {
  const { data, error } = await supabase
    .from("customer_vehicles")
    .select("id, client_id, user_id, vehicle_type, make, model, year, color, license_plate, notes")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as CustomerVehicle[];
}

export function describeVehicle(v: Partial<CustomerVehicle>): string {
  return [v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle";
}

/**
 * Finds a matching vehicle on the client record (year + make + model, case-insensitive)
 * or creates one. Existing records are never duplicated or replaced; blank fields
 * on a matched record are filled in with the new details.
 */
export async function findOrCreateClientVehicle(
  clientId: string,
  input: VehicleInput
): Promise<{ vehicle: CustomerVehicle; created: boolean }> {
  const year = toYear(input.year);
  const make = clean(input.make as string);
  const model = clean(input.model as string);
  const color = clean(input.color as string);
  const licensePlate = clean(input.licensePlate as string);
  const vehicleType = clean(input.vehicleType as string);

  const existing = await fetchClientVehicles(clientId);
  const match = existing.find(
    (v) => (v.year ?? null) === year && sameText(v.make, make) && sameText(v.model, model)
  );

  if (match) {
    // Only fill gaps — never overwrite saved vehicle data from a booking form.
    const patch: Record<string, unknown> = {};
    if (!match.color && color) patch.color = color;
    if (!match.license_plate && licensePlate) patch.license_plate = licensePlate;
    if (!match.vehicle_type && vehicleType) patch.vehicle_type = vehicleType;
    if (Object.keys(patch).length) {
      const { data, error } = await supabase
        .from("customer_vehicles")
        .update(patch)
        .eq("id", match.id)
        .select("id, client_id, user_id, vehicle_type, make, model, year, color, license_plate, notes")
        .single();
      if (error) throw error;
      return { vehicle: data as CustomerVehicle, created: false };
    }
    return { vehicle: match, created: false };
  }

  const { data, error } = await supabase
    .from("customer_vehicles")
    .insert({
      client_id: clientId,
      vehicle_type: vehicleType || "sedan",
      make,
      model,
      year,
      color,
      license_plate: licensePlate,
      size_category: vehicleType,
    })
    .select("id, client_id, user_id, vehicle_type, make, model, year, color, license_plate, notes")
    .single();
  if (error) throw error;
  return { vehicle: data as CustomerVehicle, created: true };
}

/** Explicit update of a saved vehicle — only called when the admin opts in. */
export async function updateCustomerVehicle(vehicleId: string, input: VehicleInput): Promise<void> {
  const { error } = await supabase
    .from("customer_vehicles")
    .update({
      vehicle_type: clean(input.vehicleType as string),
      make: clean(input.make as string),
      model: clean(input.model as string),
      year: toYear(input.year),
      color: clean(input.color as string),
      license_plate: clean(input.licensePlate as string),
    })
    .eq("id", vehicleId);
  if (error) throw error;
}
