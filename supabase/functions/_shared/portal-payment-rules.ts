// Balances are calculated only by the service-only portal_booking_balance database
// function, reused under lock by the reservation trigger. No browser/status-only credits.
export function authorizationMatches(authorizedCents: number, revokedAt: string | null, quoteCents: number) {
  return revokedAt === null && quoteCents > 0 && authorizedCents === quoteCents;
}
