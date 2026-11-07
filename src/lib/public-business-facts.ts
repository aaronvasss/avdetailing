/** Owner-confirmed public copy; never used for payment enforcement. */
export const PUBLIC_PAYMENT_METHODS = ["Cash", "Credit cards", "Debit cards", "Cash App", "Venmo", "Zelle"] as const;
export const PUBLIC_PAYMENT_ANSWER = "You can pay online when booking or at the time of service. We accept cash, credit and debit cards, Cash App, Venmo and Zelle.";
export const PUBLIC_BUSINESS_HOURS = "Monday–Sunday, 6:00 AM–8:00 PM (America/Chicago)";
export const PUBLIC_OPENING_HOURS_SPECIFICATION = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => ({
  "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${day}`, opens: "06:00", closes: "20:00",
}));