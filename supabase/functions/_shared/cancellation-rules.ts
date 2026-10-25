export interface CancellationBooking {
  scheduled_date: string; scheduled_time: string; status: string; deposit_amount: number | null;
}
export function cancellationProblem(booking: CancellationBooking, todayChicago: string): string | null {
  if (!["pending", "confirmed"].includes(booking.status)) return "This appointment can no longer be cancelled online. Please contact us.";
  if (booking.scheduled_date.slice(0, 10) < todayChicago) return "Past appointments cannot be cancelled online. Please contact us.";
  return null;
}

/** Existing under-24-hour warning is advisory, not a deadline or an automatic financial action. */
export function cancellationConsequences(booking: CancellationBooking, hoursUntil: number): string {
  const late = hoursUntil < 24;
  const deposit = Number(booking.deposit_amount) || 0;
  if (late && deposit > 0) return `This appointment is within 24 hours. Your deposit of $${deposit.toFixed(2)} may be forfeited. Cancelling here does not automatically issue a refund.`;
  if (late) return "This appointment is within 24 hours. Cancelling here does not automatically issue a refund.";
  return "Cancelling here does not automatically issue a refund. Contact us about any payment or deposit already made.";
}