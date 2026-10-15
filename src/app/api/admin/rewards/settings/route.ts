import { NextRequest, NextResponse } from 'next/server';
import { Db, ObjectId } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

interface RewardSlab {
  orderAmount: number;
  coinsEarned: number;
}

interface RewardSettings {
  enabled: boolean;
  rewardType: 'fixed' | 'percentage';
  coinValue: number;
  minimumOrderValue: number;
  minimumCoinsRedeem: number;
  maximumDiscountValue: number;
  slabs: RewardSlab[];
}

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
    const settings = db.collection('rewardSettings');
    
    const config = await settings.findOne({ _id: new ObjectId('000000000000000000000000') });
    
    if (!config) {
      // Return default settings if none exist
      const defaultSettings: RewardSettings = {
        enabled: false,
        rewardType: 'fixed',
        coinValue: 1,
        minimumOrderValue: 0,
        minimumCoinsRedeem: 10,
        maximumDiscountValue: 100,
        slabs: [],
      };
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(config);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching reward settings:', msg);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const db = await getDatabase();
    const settings = db.collection('rewardSettings');

    const config: RewardSettings = {
      enabled: Boolean(body.enabled),
      rewardType: body.rewardType || 'fixed',
      coinValue: Number(body.coinValue) || 1,
      minimumOrderValue: Number(body.minimumOrderValue) || 0,
      minimumCoinsRedeem: Number(body.minimumCoinsRedeem) || 10,
      maximumDiscountValue: Number(body.maximumDiscountValue) || 100,
      slabs: Array.isArray(body.slabs) ? body.slabs : [],
    };

    await settings.updateOne(
      { _id: new ObjectId('000000000000000000000000') },
      { $set: config },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving reward settings:', msg);
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}
