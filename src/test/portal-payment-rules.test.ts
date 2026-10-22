import { describe, it, expect } from 'vitest';
import { balanceQuote, authorizationMatches } from '../../supabase/functions/_shared/portal-payment-rules';
describe('appointment card charges', () => {
  it('adds exactly the required 3.5% processing fee', () => expect(balanceQuote(200, 'unpaid', 0, [])).toEqual({ serviceCents: 20000, feeCents: 700, amountCents: 20700 }));
  it('uses the final booking price and deducts a confirmed $100 deposit', () => expect(balanceQuote(500, 'partial', 100, []).amountCents).toBe(41400));
  it('never charges an already paid appointment', () => expect(balanceQuote(500, 'paid', 0, []).amountCents).toBe(0));
  it('credits the existing deposit_paid status', () => expect(balanceQuote(500, 'deposit_paid', 100, []).serviceCents).toBe(40000));
  it('refuses ambiguous historical payments instead of guessing', () => expect(()=>balanceQuote(200,'unpaid',0,[{amount_cents:10000,payment_type:'deposit',status:'succeeded'}])).toThrow('reconciliation'));
  it('does not count tips toward the service balance', () => expect(balanceQuote(200, 'unpaid', 0, [{amount_cents: 2000, payment_type: 'tip', status: 'succeeded'}]).serviceCents).toBe(20000));
  it('requires approval for the exact charged amount', () => expect(authorizationMatches(20700, null, 20800)).toBe(false));
  it('rejects revoked approval', () => expect(authorizationMatches(20700, '2026-10-22', 20700)).toBe(false));
});