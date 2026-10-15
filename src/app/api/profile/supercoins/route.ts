import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient, getDatabaseName } from '@/lib/database';

export const runtime = 'nodejs';

const uri = process.env.MONGODB_URI!;

function verifyToken(token: string): { id: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    return { id: payload.id };
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const client = await getMongoClient(uri);
    const db = client.db(getDatabaseName());
    
    // Fetch latest balance from user
    const users = db.collection('users');
    const user = await users.findOne({ id: decoded.id });
    const balance = user?.superCoinsBalance || 0;

    // Fetch transactions
    const transactionsCollection = db.collection('rewardTransactions');
    const allTransactions = await transactionsCollection
      .find({ userId: decoded.id })
      .sort({ createdAt: -1 })
      .toArray();

    const totalEarned = allTransactions
      .filter(t => t.transactionType === 'Earn' && t.status === 'Completed')
      .reduce((sum, t) => sum + (Number(t.coins) || 0), 0);

    const totalRedeemed = allTransactions
      .filter(t => t.transactionType === 'Redeem' && t.status === 'Completed')
      .reduce((sum, t) => sum + (Number(t.coins) || 0), 0);

    const recentTransactions = allTransactions.slice(0, 10);

    return NextResponse.json({
      success: true,
      balance,
      totalEarned,
      totalRedeemed,
      transactions: recentTransactions.map(t => ({
        id: t._id.toString(),
        transactionType: t.transactionType,
        coins: t.coins,
        description: t.description,
        status: t.status,
        createdAt: t.createdAt,
      }))
    });
  } catch (error) {
    console.error('Error fetching supercoins:', error);
    return NextResponse.json({ error: 'Failed to fetch supercoins' }, { status: 500 });
  }
}
