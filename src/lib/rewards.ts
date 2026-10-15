export interface RewardActionParams {
  previousStatus: string;
  newStatus: string;
  rewardProcessed: boolean;
  earnedCoins: number;
  paymentStatus: string;
  orderStatus: string;
}

export interface RewardAction {
  type: 'earn' | 'reverse' | 'none';
  coins?: number;
}

export function getRewardAction(params: RewardActionParams): RewardAction {
  const { previousStatus, newStatus, rewardProcessed, earnedCoins, paymentStatus } = params;

  // Earn coins when order moves from pending to confirmed/delivered and payment is paid
  if (previousStatus === 'pending' && (newStatus === 'confirmed' || newStatus === 'delivered')) {
    if (paymentStatus === 'paid' && !rewardProcessed) {
      return { type: 'earn' };
    }
  }

  // Reverse coins when order is cancelled after coins were earned
  if (newStatus === 'cancelled' && rewardProcessed && earnedCoins > 0) {
    return { type: 'reverse', coins: earnedCoins };
  }

  return { type: 'none' };
}

export interface RedemptionParams {
  usedSuperCoins?: boolean;
  coinsRedeemed?: number;
  rewardTransactionId?: string;
  coinRedeemed?: boolean;
}

export function shouldProcessSuperCoinRedemption(params: RedemptionParams): boolean {
  const { usedSuperCoins, coinsRedeemed, rewardTransactionId, coinRedeemed } = params;

  // Only process if super coins were used and coins were redeemed
  if (!usedSuperCoins || !coinsRedeemed || coinsRedeemed <= 0) {
    return false;
  }

  // Only process if not already processed (has transaction ID or marked as redeemed)
  if (rewardTransactionId || coinRedeemed) {
    return false;
  }

  return true;
}
