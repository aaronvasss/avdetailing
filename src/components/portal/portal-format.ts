/** Presentation helpers for the customer portal. Display only; never used for logic. */
export function displayFirstName(fullName: string | null | undefined, email: string | null | undefined): string {
  const raw = (fullName?.trim().split(/\s+/)[0] || email?.split("@")[0] || "there").trim();
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function initialsOf(fullName: string | null | undefined, email: string | null | undefined): string {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (email || "?").slice(0, 1).toUpperCase();
}

/** Greeting based on the business's Central Time clock. */
export function centralGreeting(now: Date = new Date()): string {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "America/Chicago" }).format(now));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Joins address parts, skipping blanks and stored "null"/"undefined" placeholders. */
export function joinAddress(parts: Array<string | null | undefined>): string {
  return parts.map(p => (p ?? "").trim()).filter(p => p && !/^(null|undefined)$/i.test(p)).join(", ");
}

export function statusLabel(status: string | null | undefined): string {
  const s = (status || "").replace(/_/g, " ").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}
