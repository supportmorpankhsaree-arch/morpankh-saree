import { describe, expect, it } from 'vitest';
import { resolveUserReferralCode } from './referrals';

describe('resolveUserReferralCode', () => {
  it('returns the existing referral code when one is already present', () => {
    expect(resolveUserReferralCode('MPK7F2X9', ['OTHER'])).toBe('MPK7F2X9');
  });

  it('generates a new referral code when the user has none', () => {
    const code = resolveUserReferralCode(undefined, ['MPK7F2X9']);

    expect(code).toMatch(/^[A-Z0-9]{8}$/);
    expect(code).not.toBe('MPK7F2X9');
  });
});
