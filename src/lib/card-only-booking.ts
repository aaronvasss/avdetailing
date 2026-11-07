/** Customer-facing card-only booking wording. Stored payment_method values are unchanged
 * ("online" = card at booking, legacy "in_person" = pay later) so history/admin keep working. */
export const PAY_LATER_SERVICES = ["ceramic", "boat"] as const;
export const PAY_LATER_LABEL = "Pay later by card in your AV Detailing account";
export const PAY_NOW_LABEL = "Paid in full by card at booking";
export const CHECKOUT_UNAVAILABLE_MESSAGE =
  "Card payment is temporarily unavailable. Your appointment is saved as unpaid — you can pay later by card in your AV Detailing account.";

export const isPayLaterService = (service: string) => (PAY_LATER_SERVICES as readonly string[]).includes(service);

/** Value sent to create-booking; customers never choose in-person payment. */
export const customerBookingPaymentMethod = (service: string): "online" | "in_person" =>
  isPayLaterService(service) ? "in_person" : "online";

/** Label shown to customers for a saved booking. */
export function customerPaymentLabel(method: string | null | undefined, status: string | null | undefined): string {
  if ((status || "").toLowerCase() === "paid") return "Paid by card";
  if (method === "online" || method === "stripe" || method === "card") {
    return (status || "").toLowerCase() === "pending" ? "Card payment in progress" : PAY_LATER_LABEL;
  }
  return PAY_LATER_LABEL;
}
