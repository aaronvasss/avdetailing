/** Never persist bearer credentials from customer email links in error telemetry. */
export function redactUrl(value: string): string {
  try {
    const url = new URL(value);
    for (const key of ["token", "manage_token", "manageToken", "access_token", "refresh_token", "code"]) {
      if (url.searchParams.has(key)) url.searchParams.set(key, "[redacted]");
    }
    if (url.hash) url.hash = "";
    return url.toString();
  } catch { return ""; }
}