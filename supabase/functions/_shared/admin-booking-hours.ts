/** Roles must come from a server-validated user's protected user_roles rows. */
export function canOverrideBookingHours(roles: readonly string[], requested: unknown): boolean {
  return requested === true && roles.includes("admin");
}