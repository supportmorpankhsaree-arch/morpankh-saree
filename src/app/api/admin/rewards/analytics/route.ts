import { NextRequest, NextResponse } from 'next/server';
import { Db } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';

interface UserDoc {
  superCoinsBalance?: number;
}

interface TransactionDoc {
  coins?: number;
  transactionType?: string;
}

export const runtime = 'nodejs';

function isAdminRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  return authHeader === 'Bearer admin-token';
}

async function getDatabase(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not configured');
  const client = await getMongoClient(uri);
  return client.db(getDatabaseName());
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const users = db.collection('users');
    const transactions = db.collection('rewardTransactions');

    // Calculate analytics
    const totalUsers = await users.countDocuments({ superCoinsBalance: { $exists: true } });
    const activeUsers = await users.countDocuments({ superCoinsBalance: { $gt: 0 } });
    
    const userBalances = await users.find({ superCoinsBalance: { $exists: true } }).toArray() as UserDoc[];
    const totalBalance = userBalances.reduce((sum: number, user: UserDoc) => sum + (user.superCoinsBalance || 0), 0);
    const averageBalance = totalUsers > 0 ? totalBalance / totalUsers : 0;

    const earnTransactions = await transactions.find({ transactionType: 'Earn' }).toArray() as TransactionDoc[];
    const totalCoinsIssued = earnTransactions.reduce((sum: number, tx: TransactionDoc) => sum + (tx.coins || 0), 0);

    const redeemTransactions = await transactions.find({ transactionType: 'Redeem' }).toArray() as TransactionDoc[];
    const totalCoinsRedeemed = redeemTransactions.reduce((sum: number, tx: TransactionDoc) => sum + (tx.coins || 0), 0);

    const totalTransactions = await transactions.countDocuments();

    const analytics = {
      totalCoinsIssued,
      totalCoinsRedeemed,
      totalUsers,
      activeUsers,
      averageBalance,
      totalTransactions,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching reward analytics:', msg);
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
