/** Listed prices already include existing fees/taxes. Work in cents; never add a fee here. */
export const priceCents = (price: number) => {
  if (!Number.isFinite(price) || price < 0) throw new Error("Invalid authoritative price");
  return Math.round(price * 100);
};

export function bookingAmounts(packagePrice: number, addOnPrices: number[]) {
  const subtotalCents = priceCents(packagePrice);
  const addOnsCents = addOnPrices.reduce((sum, price) => sum + priceCents(price), 0);
  return { subtotal: subtotalCents / 100, addOnsTotal: addOnsCents / 100, total: (subtotalCents + addOnsCents) / 100 };
}

export function packageVehicleTypes(vehicle: string): string[] {
  const aliases: Record<string, string[]> = { sedan: ["sedan", "car"], "suv-5": ["suv-5", "suv"], "suv-8": ["suv-8", "suv"], truck: ["truck"] };
  return [...(aliases[vehicle] ?? (vehicle ? [vehicle] : [])), "all"];
}

export function authoritativePackagePrice(prices: Record<string, number>, vehicle: string, basePrice: number) {
  for (const key of packageVehicleTypes(vehicle)) {
    if (prices[key] !== undefined) return prices[key];
  }
  return basePrice;
}

/** Checkout charges the persisted payable total, not a fresh package lookup or caller-provided add-ons. */
export function bookingCheckoutCents(total: number) {
  const cents = priceCents(total);
  if (cents <= 0) throw new Error("Booking has no payable balance");
  return cents;
}