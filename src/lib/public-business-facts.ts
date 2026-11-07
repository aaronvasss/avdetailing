/** Owner-confirmed public copy; never used for payment enforcement. */
export const PUBLIC_PAYMENT_METHODS = ["Credit Card", "Debit Card"] as const;
// Existing payable totals include applicable fees; this copy never changes enforcement.
export const PUBLIC_PAYMENT_ANSWER = "We accept credit and debit cards only, paid online when you book or later through your customer account. We do not accept cash, Venmo, Cash App or Zelle. No additional processing fees are added on top of the total shown during booking. Membership plans use recurring billing at the selected frequency.";
export const PUBLIC_BUSINESS_HOURS = "Monday–Sunday, 6:00 AM–8:00 PM (America/Chicago)";
export const PUBLIC_OPENING_HOURS_SPECIFICATION = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => ({
  "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${day}`, opens: "06:00", closes: "20:00",
}));