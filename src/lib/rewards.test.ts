import { describe, expect, it } from 'vitest';
import { getRewardAction, shouldProcessSuperCoinRedemption } from './rewards';

describe('getRewardAction', () => {
  it('returns earn action when an order moves from pending to confirmed', () => {
    const action = getRewardAction({
      previousStatus: 'pending',
      newStatus: 'confirmed',
      rewardProcessed: false,
      earnedCoins: 0,
      paymentStatus: 'paid',
      orderStatus: 'pending',
    });

    expect(action).toEqual({ type: 'earn' });
  });

  it('returns reverse action when an order is cancelled after coins were already earned', () => {
    const action = getRewardAction({
      previousStatus: 'confirmed',
      newStatus: 'cancelled',
      rewardProcessed: true,
      earnedCoins: 12,
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
    });

    expect(action).toEqual({ type: 'reverse', coins: 12 });
  });

  it('returns no action when a cancelled order never earned coins', () => {
    const action = getRewardAction({
      previousStatus: 'pending',
      newStatus: 'cancelled',
      rewardProcessed: false,
      earnedCoins: 0,
      paymentStatus: 'pending',
      orderStatus: 'pending',
    });

    expect(action).toEqual({ type: 'none' });
  });

  it('processes coin redemption only once after successful payment', () => {
    expect(shouldProcessSuperCoinRedemption({
      usedSuperCoins: true,
      coinsRedeemed: 50,
      rewardTransactionId: undefined,
      coinRedeemed: false,
    })).toBe(true);

    expect(shouldProcessSuperCoinRedemption({
      usedSuperCoins: true,
      coinsRedeemed: 50,
      rewardTransactionId: 'tx-123',
      coinRedeemed: false,
    })).toBe(false);

    expect(shouldProcessSuperCoinRedemption({
      usedSuperCoins: true,
      coinsRedeemed: 50,
      rewardTransactionId: undefined,
      coinRedeemed: true,
    })).toBe(false);
  });
});
