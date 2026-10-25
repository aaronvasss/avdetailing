import { describe, it, expect } from 'vitest';
import { authorizationMatches } from '../../supabase/functions/_shared/portal-payment-rules';
import { validPortalBalance } from '@/lib/portal-balance-response';
describe('server balance boundary', () => {
  it('accepts verified $145.18 without another fee', () => expect(validPortalBalance({review:false,amountCents:14518,serviceCents:14518,feeCents:0,depositCents:0})).toBe(true));
  it('rejects old fee-added response $150.26', () => expect(validPortalBalance({review:false,amountCents:15026,serviceCents:14518,feeCents:508,depositCents:0})).toBe(false));
  it('requires review rather than guessed history', () => expect(validPortalBalance({review:true,reason:'Historical payment requires reconciliation'})).toBe(true));
  it('rejects missing evidence response', () => expect(validPortalBalance({amountCents:14518})).toBe(false));
  it('rejects stale $150.26 approval for $145.18', () => expect(authorizationMatches(15026,null,14518)).toBe(false));
  it('rejects revoked approval', () => expect(authorizationMatches(14518,'2026-10-25',14518)).toBe(false));
  it('accepts exact $145.18 approval', () => expect(authorizationMatches(14518,null,14518)).toBe(true));
  it('cannot approve a zero balance', () => expect(authorizationMatches(0,null,0)).toBe(false));
});
