import type { PackagePrice } from "./pricing";

/** Static fallback package prices; kept free of browser imports so build scripts can read them. */
export const FALLBACK_PACKAGES: PackagePrice[] = [
  { service: "car", name: "Exterior Only", price: 75 },
  { service: "car", name: "Basic Package", price: 145.18 },
  { service: "car", name: "Silver Package", price: 259.17 },
  { service: "car", name: "Gold Package", price: 362.8 },
  { service: "paint", name: "1-Step Polish", price: 400 },
  { service: "paint", name: "2-Step Correction", price: 500 },
  { service: "paint", name: "3-Step Restoration", price: 650 },
  { service: "boat", name: "Boat Wash & Wax", price: 199 },
  { service: "boat", name: "Boat Full Detail", price: 399 },
  { service: "boat", name: "Boat Premium Detail", price: 649 },
  { service: "rv", name: "RV Exterior Wash", price: 350 },
];
