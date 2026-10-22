import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Single public pricing source. Booking packages (service_packages) and
 * membership plans (membership_plans) are admin-controlled and authoritative;
 * every public page reads prices through this module. The fallback below
 * mirrors those tables and is only shown while they load or if they fail.
 */
export type ServiceKey = "car" | "ceramic" | "paint" | "boat" | "rv" | "aircraft";

export const SERVICE_IDS: Record<ServiceKey, string> = {
  car: "3763f8d6-9045-45d5-99cd-cb878bdceeb8",
  ceramic: "5017f8e7-3046-4dc4-8254-3bf04c962818",
  paint: "806e631d-f058-4cd7-9318-582c60b10a32",
  boat: "c15abb75-415f-499e-a681-7ce59e2faaa5",
  rv: "895a1ea3-4309-4a75-9406-555cf568b370",
  aircraft: "71c8e20e-4bdf-42b8-ba46-d7565121c9d9",
};

/** Services booked by custom quote; no public price is shown. */
export const QUOTE_ONLY_SERVICES: ServiceKey[] = ["aircraft"];

export interface PackagePrice { service: ServiceKey; name: string; price: number }
export interface PlanPrice { slug: string; frequency: string; price: number }

export const FALLBACK_PACKAGES: PackagePrice[] = [
  { service: "car", name: "Exterior Only", price: 75 },
  { service: "car", name: "Basic Package", price: 145.18 },
  { service: "car", name: "Silver Package", price: 259.17 },
  { service: "car", name: "Gold Package", price: 362.8 },
  { service: "ceramic", name: "3-Year Ceramic Coating", price: 800 },
  { service: "ceramic", name: "6-Year Ceramic Coating", price: 1200 },
  { service: "ceramic", name: "10-Year Ceramic Coating", price: 1600 },
  { service: "paint", name: "1-Step Polish", price: 400 },
  { service: "paint", name: "2-Step Correction", price: 500 },
  { service: "paint", name: "3-Step Restoration", price: 650 },
  { service: "boat", name: "Boat Wash & Wax", price: 199 },
  { service: "boat", name: "Boat Full Detail", price: 399 },
  { service: "boat", name: "Boat Premium Detail", price: 649 },
  { service: "rv", name: "RV Exterior Wash", price: 180 },
];

export const FALLBACK_PLANS: PlanPrice[] = [
  { slug: "monthly", frequency: "monthly", price: 135 },
  { slug: "bi-weekly", frequency: "bi-weekly", price: 130 },
  { slug: "weekly-premium", frequency: "weekly", price: 130 },
];

/** Visits per month, used to show a plan's monthly total. */
export const MONTHLY_MULTIPLIER: Record<string, number> = { monthly: 1, "bi-weekly": 2, weekly: 4, "weekly-premium": 4 };

export const formatPrice = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function buildPricing(packages: PackagePrice[], plans: PlanPrice[]) {
  const forService = (s: ServiceKey) => packages.filter((p) => p.service === s);
  /** Lowest active price for a package name (across vehicle sizes), or null. */
  const packageFrom = (s: ServiceKey, name: string) => {
    const list = forService(s).filter((p) => p.name.toLowerCase() === name.toLowerCase());
    return list.length ? Math.min(...list.map((p) => p.price)) : null;
  };
  /** Lowest active price for a whole service, or null when quote-only/no active package. */
  const startingAt = (s: ServiceKey) => {
    if (QUOTE_ONLY_SERVICES.includes(s)) return null;
    const list = forService(s);
    return list.length ? Math.min(...list.map((p) => p.price)) : null;
  };
  const planMonthly = (slug: string) => {
    const p = plans.find((x) => x.slug === slug);
    return p ? p.price * (MONTHLY_MULTIPLIER[p.frequency] ?? MONTHLY_MULTIPLIER[p.slug] ?? 1) : null;
  };
  const label = (n: number | null, quote = "Custom quote") => (n == null ? quote : formatPrice(n));
  return { packageFrom, startingAt, planMonthly, label };
}

export type Pricing = ReturnType<typeof buildPricing>;

const KEY_BY_ID = Object.fromEntries(Object.entries(SERVICE_IDS).map(([k, v]) => [v, k as ServiceKey]));

async function loadPricing() {
  const [pk, pl] = await Promise.all([
    supabase.from("service_packages").select("service_id,name,price").eq("is_active", true),
    supabase.from("membership_plans").select("slug,frequency,price").eq("is_active", true),
  ]);
  if (pk.error || pl.error) throw pk.error || pl.error;
  const packages = (pk.data ?? [])
    .filter((r) => r.service_id && KEY_BY_ID[r.service_id])
    .map((r) => ({ service: KEY_BY_ID[r.service_id!], name: r.name, price: Number(r.price) }));
  const plans = (pl.data ?? []).map((r) => ({ slug: r.slug, frequency: r.frequency, price: Number(r.price) }));
  return { packages: packages.length ? packages : FALLBACK_PACKAGES, plans: plans.length ? plans : FALLBACK_PLANS };
}

export function usePricing(): Pricing {
  const { data } = useQuery({ queryKey: ["public-pricing"], queryFn: loadPricing, staleTime: 5 * 60_000 });
  return buildPricing(data?.packages ?? FALLBACK_PACKAGES, data?.plans ?? FALLBACK_PLANS);
}
