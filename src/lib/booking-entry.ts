// Validated booking deep links. Only service/package identifiers are accepted;
// prices, deposits or other payment values are never read from the URL.
export const CAR_PACKAGE_SLUGS = ["exterior-only", "basic", "silver", "gold"];

export type BookingEntry =
  | { service: "car"; package: string }
  | { service: "aircraft" }
  | null;

export function parseBookingEntry(search: string): BookingEntry {
  const params = new URLSearchParams(search);
  const service = params.get("service");
  if (service === "aircraft") return { service: "aircraft" };
  const pkg = params.get("package");
  if (service === "car" && pkg && CAR_PACKAGE_SLUGS.includes(pkg)) return { service: "car", package: pkg };
  return null;
}
