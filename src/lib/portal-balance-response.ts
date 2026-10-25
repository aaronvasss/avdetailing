export type PortalBalanceResponse = {
  review: boolean;
  reason?: string;
  totalCents?: number;
  depositCents?: number;
  creditedCents?: number;
  serviceCents?: number;
  feeCents?: number;
  amountCents?: number;
};

/** Reject old/malformed endpoint responses rather than displaying a guessed balance. */
export function validPortalBalance(value: unknown): value is PortalBalanceResponse {
  if (!value || typeof value !== 'object') return false;
  const q = value as PortalBalanceResponse;
  if (q.review === true) return true;
  return q.review === false && q.feeCents === 0 &&
    Number.isSafeInteger(q.amountCents) && Number(q.amountCents) >= 0 &&
    q.amountCents === q.serviceCents &&
    Number.isSafeInteger(q.totalCents) && Number(q.totalCents) > 0 &&
    Number.isSafeInteger(q.creditedCents) && Number(q.creditedCents) >= 0 &&
    Number.isSafeInteger(q.depositCents) && Number(q.depositCents) >= 0 &&
    Number(q.depositCents) <= Number(q.creditedCents) &&
    Number(q.creditedCents) <= Number(q.totalCents) &&
    Number(q.amountCents) <= Number(q.totalCents) - Number(q.creditedCents);
}