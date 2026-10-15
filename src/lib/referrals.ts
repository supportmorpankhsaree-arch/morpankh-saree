import { Db, ObjectId } from 'mongodb';
import { getDatabase } from './database';

// Types
export interface ReferralSettings {
  enabled: boolean;
  referrerReward: number;
  referredUserReward: number;
  minimumOrderValue: number;
  firstOrderOnly: boolean;
  maxReferralReward: number;
  dailyReferralLimit: number;
  monthlyReferralLimit: number;
  allowSelfReferral: boolean;
}

export interface ReferralRecord {
  _id?: ObjectId;
  referrer_id: string;
  referred_user_id: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'cancelled' | 'fraud';
  reward_given: boolean;
  referrer_reward: number;
  referred_reward: number;
  first_order_id?: string;
  created_at: Date;
  completed_at?: Date;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  rejectedReferrals: number;
  totalCoinsEarned: number;
}

export interface EnrichedReferralRecord extends ReferralRecord {
  referredUserName?: string;
  referredUserEmail?: string;
}

export interface AdminReferralRecord extends ReferralRecord {
  referrerName?: string;
  referrerEmail?: string;
  referredUserName?: string;
  referredUserEmail?: string;
}

export interface GetAllReferralsResponse {
  referrals: AdminReferralRecord[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// Default referral settings
export const defaultReferralSettings: ReferralSettings = {
  enabled: false,
  referrerReward: 100,
  referredUserReward: 50,
  minimumOrderValue: 0,
  firstOrderOnly: true,
  maxReferralReward: 1000,
  dailyReferralLimit: 10,
  monthlyReferralLimit: 50,
  allowSelfReferral: false,
};

/**
 * Generate a unique 8-character referral code
 * Format: Uppercase alphanumeric (e.g., MPK7F2X9)
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function resolveUserReferralCode(existingCode: string | undefined, existingCodes: string[] = []): string {
  const normalized = existingCode?.trim();
  if (normalized) {
    return normalized;
  }

  let candidate = generateReferralCode();
  while (existingCodes.includes(candidate)) {
    candidate = generateReferralCode();
  }

  return candidate;
}

/**
 * Check if a referral code is valid and belongs to an existing user
 */
export async function validateReferralCode(code: string): Promise<{ valid: boolean; referrerId?: string; error?: string }> {
  try {
    const db = await getDatabase();
    const users = db.collection('users');
    
    const referrer = await users.findOne({ referral_code: code });
    
    if (!referrer) {
      return { valid: false, error: 'Invalid referral code' };
    }
    
    return { valid: true, referrerId: referrer.id || referrer._id?.toString() };
  } catch (error) {
    console.error('Error validating referral code:', error);
    return { valid: false, error: 'Failed to validate referral code' };
  }
}

/**
 * Get referral settings from database
 */
export async function getReferralSettings(): Promise<ReferralSettings> {
  try {
    const db = await getDatabase();
    const settings = db.collection('referralSettings');
    
    const config = await settings.findOne({ _id: new ObjectId('000000000000000000000001') });
    
    if (!config) {
      return defaultReferralSettings;
    }
    
    const settingsData = config as unknown as ReferralSettings;
    return settingsData;
  } catch (error) {
    console.error('Error fetching referral settings:', error);
    return defaultReferralSettings;
  }
}

/**
 * Save referral settings to database
 */
export async function saveReferralSettings(settings: ReferralSettings): Promise<boolean> {
  try {
    const db = await getDatabase();
    const collection = db.collection('referralSettings');
    
    await collection.updateOne(
      { _id: new ObjectId('000000000000000000000001') },
      { $set: settings },
      { upsert: true }
    );
    
    return true;
  } catch (error) {
    console.error('Error saving referral settings:', error);
    return false;
  }
}

/**
 * Create a referral record when a new user registers with a referral code
 */
export async function createReferralRecord(
  referrerId: string,
  referredUserId: string,
  referralCode: string
): Promise<ReferralRecord | null> {
  try {
    const db = await getDatabase();
    const referrals = db.collection('referrals');
    
    const record: ReferralRecord = {
      referrer_id: referrerId,
      referred_user_id: referredUserId,
      referral_code: referralCode,
      status: 'pending',
      reward_given: false,
      referrer_reward: 0,
      referred_reward: 0,
      created_at: new Date(),
    };
    
    const result = await referrals.insertOne(record);
    record._id = result.insertedId;
    
    return record;
  } catch (error) {
    console.error('Error creating referral record:', error);
    return null;
  }
}

/**
 * Get referral statistics for a user
 */
export async function getUserReferralStats(userId: string): Promise<ReferralStats> {
  try {
    const db = await getDatabase();
    const referrals = db.collection('referrals');
    
    const allReferrals = await referrals.find({ referrer_id: userId }).toArray();
    
    const stats: ReferralStats = {
      totalReferrals: allReferrals.length,
      completedReferrals: allReferrals.filter(r => r.status === 'completed').length,
      pendingReferrals: allReferrals.filter(r => r.status === 'pending').length,
      rejectedReferrals: allReferrals.filter(r => r.status === 'cancelled' || r.status === 'fraud').length,
      totalCoinsEarned: allReferrals.reduce((sum, r) => sum + (r.referrer_reward || 0), 0),
    };
    
    return stats;
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return {
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      rejectedReferrals: 0,
      totalCoinsEarned: 0,
    };
  }
}

/**
 * Get all referrals for a user (for history display)
 */
export async function getUserReferrals(userId: string): Promise<EnrichedReferralRecord[]> {
  try {
    const db = await getDatabase();
    const referrals = db.collection('referrals');
    const users = db.collection('users');
    
    const referralRecords = await referrals.find({ referrer_id: userId }).sort({ created_at: -1 }).toArray();
    
    // Enrich with referred user details
    const enriched = await Promise.all(
      referralRecords.map(async (ref) => {
        const referredUser = await users.findOne({ id: ref.referred_user_id });
        return {
          ...ref,
          referredUserName: referredUser?.name || 'Unknown',
          referredUserEmail: referredUser?.email || 'Unknown',
        };
      })
    );
    
    return enriched as EnrichedReferralRecord[];
  } catch (error) {
    console.error('Error fetching user referrals:', error);
    return [];
  }
}

/**
 * Check if referral rewards should be processed
 * Only after first order is delivered
 */
export async function shouldProcessReferralReward(
  referralId: string,
  orderId: string,
  orderValue: number
): Promise<boolean> {
  try {
    const db = await getDatabase();
    const referrals = db.collection('referrals');
    const settings = await getReferralSettings();
    
    if (!settings.enabled) {
      return false;
    }
    
    const referral = await referrals.findOne({ _id: new ObjectId(referralId) }) as ReferralRecord | null;
    
    if (!referral || referral.status !== 'pending' || referral.reward_given) {
      return false;
    }
    
    if (settings.minimumOrderValue > 0 && orderValue < settings.minimumOrderValue) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking referral reward eligibility:', error);
    return false;
  }
}

/**
 * Process referral rewards after first successful order
 */
export async function processReferralReward(
  referralId: string,
  orderId: string,
  orderValue: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    const referrals = db.collection('referrals');
    const users = db.collection('users');
    const transactions = db.collection('rewardTransactions');
    const settings = await getReferralSettings();
    
    const referral = await referrals.findOne({ _id: new ObjectId(referralId) }) as ReferralRecord | null;
    
    if (!referral) {
      return { success: false, error: 'Referral not found' };
    }
    
    if (referral.status !== 'pending' || referral.reward_given) {
      return { success: false, error: 'Referral already processed or invalid status' };
    }
    
    if (settings.minimumOrderValue > 0 && orderValue < settings.minimumOrderValue) {
      await referrals.updateOne(
        { _id: new ObjectId(referralId) },
        { $set: { status: 'cancelled', completed_at: new Date() } }
      );
      return { success: false, error: 'Order value below minimum threshold' };
    }
    
    // Credit rewards to both users
    const referrerReward = settings.referrerReward;
    const referredReward = settings.referredUserReward;
    
    // Update referrer balance
    const referrer = await users.findOne({ id: referral.referrer_id });
    if (referrer) {
      const currentBalance = referrer.superCoinsBalance || 0;
      const newBalance = currentBalance + referrerReward;
      
      await users.updateOne(
        { id: referral.referrer_id },
        { $set: { superCoinsBalance: newBalance } }
      );
      
      // Create transaction record for referrer
      await transactions.insertOne({
        userId: referral.referrer_id,
        orderId,
        transactionType: 'Earn',
        coins: referrerReward,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        status: 'Completed',
        description: `Referral reward for inviting user ${referral.referred_user_id}`,
        createdBy: 'system',
        createdAt: new Date(),
      });
    }
    
    // Update referred user balance
    const referredUser = await users.findOne({ id: referral.referred_user_id });
    if (referredUser) {
      const currentBalance = referredUser.superCoinsBalance || 0;
      const newBalance = currentBalance + referredReward;
      
      await users.updateOne(
        { id: referral.referred_user_id },
        { $set: { superCoinsBalance: newBalance } }
      );
      
      // Create transaction record for referred user
      await transactions.insertOne({
        userId: referral.referred_user_id,
        orderId,
        transactionType: 'Earn',
        coins: referredReward,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        status: 'Completed',
        description: 'Welcome referral bonus',
        createdBy: 'system',
        createdAt: new Date(),
      });
    }
    
    // Update referral record
    await referrals.updateOne(
      { _id: new ObjectId(referralId) },
      {
        $set: {
          status: 'completed',
          reward_given: true,
          referrer_reward: referrerReward,
          referred_reward: referredReward,
          first_order_id: orderId,
          completed_at: new Date(),
        },
      }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error processing referral reward:', error);
    return { success: false, error: 'Failed to process referral reward' };
  }
}

/**
 * Get all referrals for admin management
 */
export async function getAllReferrals(
  status?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<GetAllReferralsResponse> {
  try {
    const db = await getDatabase();
    const referrals = db.collection('referrals');
    const users = db.collection('users');
    
    const query: { status?: string } = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const total = await referrals.countDocuments(query);
    const skip = (page - 1) * pageSize;
    
    const referralRecords = await referrals
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();
    
    // Enrich with user details
    const enriched = await Promise.all(
      referralRecords.map(async (ref) => {
        const referrer = await users.findOne({ id: ref.referrer_id });
        const referredUser = await users.findOne({ id: ref.referred_user_id });
        
        return {
          ...ref,
          referrerName: referrer?.name || 'Unknown',
          referrerEmail: referrer?.email || 'Unknown',
          referredUserName: referredUser?.name || 'Unknown',
          referredUserEmail: referredUser?.email || 'Unknown',
        } as AdminReferralRecord;
      })
    );
    
    return {
      referrals: enriched as AdminReferralRecord[],
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error('Error fetching all referrals:', error);
    return { referrals: [], pagination: { total: 0, page, pageSize, totalPages: 0 } };
  }
}
