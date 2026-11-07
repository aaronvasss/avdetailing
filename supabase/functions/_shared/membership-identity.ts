/** Existing billing identifiers: never derive membership privileges from caller metadata. */
export const MEMBERSHIP_PRICE_IDS: Record<string, string> = {
  monthly: "price_1T9JXHDr7pQ6grsf5c9r4ToG",
  "bi-weekly": "price_1StucDDr7pQ6grsfg53qnHOr",
  "weekly-premium": "price_1StucEDr7pQ6grsfrIHZe5Zo",
};

export function membershipPriceMatches(slug: string, priceIds: string[]): boolean {
  return Object.hasOwn(MEMBERSHIP_PRICE_IDS, slug) && priceIds.length === 1 && priceIds[0] === MEMBERSHIP_PRICE_IDS[slug];
}