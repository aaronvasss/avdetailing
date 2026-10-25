/**
 * Customer-facing payment summary. bookings.total_price is the saved payable total and
 * already includes any processing fee, so nothing is ever added on top of it here.
 */
export interface PaymentSummaryInput {
  total_price?: number | null;
  payment_status?: string | null;
  payment_method?: string | null;
  deposit_amount?: number | null;
}

const ONLINE = ["online", "stripe", "card"];

export function bookingPaymentSummary(b: PaymentSummaryInput) {
  const totalCents = Math.max(0, Math.round(Number(b.total_price || 0) * 100));
  const status = (b.payment_status || "unpaid").toLowerCase();
  const fullyPaid = ["paid", "completed", "succeeded"].includes(status);
  const paidCents = fullyPaid ? totalCents : 0;
  const method = (b.payment_method || "").toLowerCase();
  return {
    total: totalCents / 100,
    hasTotal: totalCents > 0,
    // Informational fields cannot verify deposits. Use portal_booking_balance for money due.
    deposit: 0,
    paid: paidCents / 100,
    balance: ["partial", "deposit_paid"].includes(status) ? null : status === "refunded" ? 0 : (totalCents - paidCents) / 100,
    status,
    isOnline: ONLINE.includes(method),
  };
}

export function paymentStatusLabel(status: string | null | undefined) {
  const s = (status || "unpaid").toLowerCase();
  const map: Record<string, string> = {
    paid: "Paid", completed: "Paid", succeeded: "Paid", unpaid: "Unpaid", pending: "Payment Pending",
    partial: "Deposit Paid", deposit_paid: "Deposit Paid", failed: "Payment Failed", refunded: "Refunded",
  };
  return map[s] || s.replace(/_/g, " ");
}
