// Validated booking deep links. Only service/package identifiers are accepted;
// prices, deposits or other payment values are never read from the URL.
export const CAR_PACKAGE_SLUGS = ["exterior-only", "basic", "silver", "gold"];

export const BOOKING_ENTRY_SERVICES = ["car", "ceramic", "paint", "boat", "rv", "aircraft"] as const;
export type BookingEntryService = (typeof BOOKING_ENTRY_SERVICES)[number];

export type BookingEntry =
  | { service: "car"; package: string }
  | { service: BookingEntryService }
  | null;

export function parseBookingEntry(search: string): BookingEntry {
  const params = new URLSearchParams(search);
  const service = params.get("service");
  if (service === "aircraft") return { service: "aircraft" };
  const pkg = params.get("package");
  if (service === "car" && pkg) return CAR_PACKAGE_SLUGS.includes(pkg) ? { service: "car", package: pkg } : null;
  if (service && (BOOKING_ENTRY_SERVICES as readonly string[]).includes(service)) return { service: service as BookingEntryService };
  return null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Saved-vehicle id from ?vehicle=; only a well-formed id. Ownership is verified by the booking page. */
export function parseBookingVehicle(search: string): string | null {
  const id = new URLSearchParams(search).get("vehicle");
  return id && UUID.test(id) ? id.toLowerCase() : null;
}

/** Booking service implied by a saved vehicle's type, if any. */
export function serviceForVehicleType(type: string | null | undefined): BookingEntryService | null {
  const t = String(type || "").toLowerCase();
  if (t === "boat") return "boat";
  if (t === "rv" || t === "motorhome") return "rv";
  if (t === "aircraft") return "aircraft";
  if (t === "car" || t === "suv" || t === "truck" || t === "sedan") return "car";
  return null;
}

export function bookHref(service?: BookingEntryService | null, vehicleId?: string | null): string {
  const q = new URLSearchParams();
  if (service) q.set("service", service);
  if (vehicleId) q.set("vehicle", vehicleId);
  const s = q.toString();
  return s ? `/book?${s}` : "/book";
}
