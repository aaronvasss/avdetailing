import { describe, it, expect } from 'vitest';
import { balanceQuote, authorizationMatches } from '../../supabase/functions/_shared/portal-payment-rules';
describe('appointment card charges', () => {
  it('charges the saved payable total without re-adding the included fee', () => expect(balanceQuote(145.18, 'unpaid', 0, [])).toEqual({ serviceCents: 14518, feeCents: 0, amountCents: 14518 }));
  it('uses the final booking price and deducts a confirmed $100 deposit', () => expect(balanceQuote(500, 'partial', 100, []).amountCents).toBe(40000));
  it('never charges an already paid appointment', () => expect(balanceQuote(500, 'paid', 0, []).amountCents).toBe(0));
  it('credits the existing deposit_paid status', () => expect(balanceQuote(500, 'deposit_paid', 100, []).serviceCents).toBe(40000));
  it('refuses ambiguous historical payments instead of guessing', () => expect(()=>balanceQuote(200,'unpaid',0,[{amount_cents:10000,payment_type:'deposit',status:'succeeded'}])).toThrow('reconciliation'));
  it('does not count tips toward the service balance', () => expect(balanceQuote(200, 'unpaid', 0, [{amount_cents: 2000, payment_type: 'tip', status: 'succeeded'}]).serviceCents).toBe(20000));
  it('requires approval for the exact charged amount', () => expect(authorizationMatches(20700, null, 20800)).toBe(false));
  it('rejects revoked approval', () => expect(authorizationMatches(20700, '2026-10-22', 20700)).toBe(false));
  it('refuses mixed deposit credits that cannot be reliably deduplicated',()=>expect(()=>balanceQuote(500,'deposit_paid',100,[{amount_cents:10350,payment_type:'balance',status:'succeeded',metadata:{service_amount_cents:10000}}])).toThrow('reconciliation'));
  it('refuses negative service credits',()=>expect(()=>balanceQuote(500,'unpaid',0,[{amount_cents:10000,payment_type:'balance',status:'succeeded',metadata:{service_amount_cents:-100}}])).toThrow('reconciliation'));
  it('never guesses a remaining balance after a partial refund',()=>expect(()=>balanceQuote(500,'unpaid',0,[{amount_cents:10000,payment_type:'balance',status:'partially_refunded',metadata:{service_amount_cents:10000}}])).toThrow('reconciliation'));
});