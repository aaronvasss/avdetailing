import { SERVICE_LANDING_PAGES } from "@/data/serviceLandingPages";
import { LOCATION_PAGES } from "@/data/locationPages";

/**
 * Reviewed marketing routes where the GoHighLevel chat may load.
 * Everything else (booking, contact, memberships, auth/recovery, account,
 * admin, worker, cancel/manage/rate/success, OAuth consent, unauthorized,
 * unknown paths) is excluded by default. "/" and "/get-started" are kept as
 * they behaved before; their form/chat overlap awaits an owner decision.
 */
const STATIC_CHAT_ROUTES = [
  "/",
  "/get-started",
  "/services",
  "/car-detailing-baton-rouge",
  "/rv-detailing-baton-rouge",
  "/boat-detailing-baton-rouge",
  "/aircraft-detailing-baton-rouge",
  "/ceramic-coating-baton-rouge",
  "/paint-correction-baton-rouge",
  "/about",
  "/gallery",
  "/reviews",
  "/service-areas",
  "/privacy-policy",
  "/terms-and-conditions",
];

/** Unavailable-service page: noindex legacy notice, not a chat entry point. */
const NOT_CHAT_ROUTES = new Set(["/rv-interior-detailing-baton-rouge"]);

export const CHAT_ROUTES: ReadonlySet<string> = new Set(
  [
    ...STATIC_CHAT_ROUTES,
    ...SERVICE_LANDING_PAGES.map((p) => `/${p.slug}`),
    ...LOCATION_PAGES.map((p) => `/${p.slug}`),
  ].filter((p) => !NOT_CHAT_ROUTES.has(p)),
);

/** Parameter names that can carry credentials/IDs; presence alone blocks chat. */
const SENSITIVE_PARAM = /(^|[?&#])(token|access_token|refresh_token|code|type|booking|bookingId|id|email|key|signature|sig|otp|state)=/i;

function normalize(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

/** True only for an allowlisted public path without credential-like query/hash. */
export function isChatAllowed(pathname: string, search = "", hash = ""): boolean {
  if (!CHAT_ROUTES.has(normalize(pathname))) return false;
  if (SENSITIVE_PARAM.test(search) || SENSITIVE_PARAM.test(hash)) return false;
  return true;
}
