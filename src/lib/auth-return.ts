const RETURN_ORIGIN = "https://avdetailing.net";

/** Return paths carry navigation intent only; destination pages still enforce authorization. */
export function safeAuthReturn(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  try {
    let decoded = value;
    for (let i = 0; i < 3; i++) {
      if (/[\\\u0000-\u0020\u007f]/.test(decoded) || decoded.startsWith("//")) return null;
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
    const url = new URL(value, RETURN_ORIGIN);
    const decodedPath = new URL(decoded, RETURN_ORIGIN).pathname;
    if (url.origin !== RETURN_ORIGIN || ["/auth", "/reset-password"].includes(decodedPath)) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

export function signInReturnUrl(destination: string): string {
  return `/auth?${new URLSearchParams({ redirect: safeAuthReturn(destination) || "/account" })}`;
}