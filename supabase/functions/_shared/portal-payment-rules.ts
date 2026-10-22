export function balanceQuote(total: number, paymentStatus: string | null, deposit: number, records: Array<{ amount_cents: number; payment_type: string; status: string | null; metadata?: Record<string, unknown> | null }>) {
  const totalCents = Math.round(Number(total) * 100);
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) throw new Error('Invalid appointment price');
  if (paymentStatus === 'paid' || paymentStatus === 'refunded') return { serviceCents: 0, feeCents: 0, amountCents: 0 };
  const paid = records.filter(r => ['succeeded', 'paid'].includes(r.status ?? '') && r.payment_type !== 'tip');
  // Old records include the 3.5% card fee; it does not pay down the service balance.
  const paidService = paid.reduce((sum, r) => sum + (typeof r.metadata?.service_amount_cents === 'number' ? r.metadata.service_amount_cents : Math.round(r.amount_cents / 1.035)), 0);
  const confirmedDeposit = paymentStatus === 'partial' ? Math.round(Number(deposit || 0) * 100) : 0;
  const serviceCents = Math.max(0, totalCents - Math.max(paidService, confirmedDeposit));
  const feeCents = Math.round(serviceCents * 0.035);
  return { serviceCents, feeCents, amountCents: serviceCents + feeCents };
}

export function authorizationMatches(authorizedCents: number, revokedAt: string | null, quoteCents: number) {
  return revokedAt === null && quoteCents > 0 && authorizedCents === quoteCents;
}