import { SERVICE_LANDING_PAGES } from "@/data/serviceLandingPages";
import { LOCATION_PAGES } from "@/data/locationPages";
import { CAR_HUB_SEO } from "./car-seo";
import { BOAT_HUB_SEO } from "./boat-seo";
import { RV_HUB_SEO } from "./rv-seo";
import { AVIATION_OVERVIEW } from "./aviation-overview";
import { SERVICES_DIRECTORY_SEO } from "./services-directory-seo";

export const GA4_MEASUREMENT_ID = "G-YM2RWYQVNS";
export const ANALYTICS_ORIGIN = "https://avdetailing.net";
// Neither preference storage nor URL/environment parameters can open these gates.
// Change only in a separately authorized release after the checklist is verified.
export const ANALYTICS_RELEASE = Object.freeze({
  releaseAuthorized: false,
  streamSettingsVerified: false,
});

const fixedPages: Record<string, string> = {
  "/": "AV Detailing — Mobile Detailing in Baton Rouge",
  [CAR_HUB_SEO.path]: CAR_HUB_SEO.title,
  [BOAT_HUB_SEO.path]: BOAT_HUB_SEO.title,
  [RV_HUB_SEO.path]: RV_HUB_SEO.title,
  [AVIATION_OVERVIEW.path]: AVIATION_OVERVIEW.title,
  [SERVICES_DIRECTORY_SEO.path]: SERVICES_DIRECTORY_SEO.title,
  "/about": "About AV Detailing",
  "/memberships": "Detailing Memberships — AV Detailing",
  "/gallery": "Detailing Gallery — AV Detailing",
  "/reviews": "Customer Reviews — AV Detailing",
  "/contact": "Contact AV Detailing",
  "/book": "Book a Detailing Service — AV Detailing",
  "/get-started": "Request Detailing Information — AV Detailing",
  "/service-areas": "Service Areas — AV Detailing",
  "/privacy-policy": "Privacy Policy — AV Detailing",
  "/terms-and-conditions": "Terms & Conditions — AV Detailing",
};

/** Exact paths only. Never derive titles from the DOM, user data or URL text. */
export const ANALYTICS_PUBLIC_PAGES: Readonly<Record<string, string>> = Object.freeze({
  ...fixedPages,
  ...Object.fromEntries(SERVICE_LANDING_PAGES.filter(p => !p.unavailable)
    .map(p => [`/${p.slug}`, p.seoTitle || p.title])),
  ...Object.fromEntries(LOCATION_PAGES.map(p => [`/${p.slug}`, p.titleTag])),
});

export function publicAnalyticsPage(pathname: string) {
  if (!Object.prototype.hasOwnProperty.call(ANALYTICS_PUBLIC_PAGES, pathname)) return null;
  return { page_path: pathname, page_location: `${ANALYTICS_ORIGIN}${pathname}`,
    page_title: ANALYTICS_PUBLIC_PAGES[pathname] };
}

/** No external referrer, private path, query or hash enters Google payloads. */
export function safeAnalyticsReferrer(value: string): string {
  try {
    const url = new URL(value);
    return url.origin === ANALYTICS_ORIGIN
      ? publicAnalyticsPage(url.pathname)?.page_location || "" : "";
  } catch { return ""; }
}

export type AnalyticsPreference = "accepted" | "declined" | "unset";
export const ANALYTICS_PREFERENCE_KEY = "av-optional-analytics-v1";
export function readAnalyticsPreference(storage: Pick<Storage, "getItem">): AnalyticsPreference {
  try {
    const value = storage.getItem(ANALYTICS_PREFERENCE_KEY);
    return value === "accepted" || value === "declined" ? value : "unset";
  } catch { return "unset"; }
}