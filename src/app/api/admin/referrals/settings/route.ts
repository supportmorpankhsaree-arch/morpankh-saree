import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/database';
import { getReferralSettings, saveReferralSettings, defaultReferralSettings } from '@/lib/referrals';

export const runtime = 'nodejs';

function isAdminRequest(request: NextRequest): boolean {
  const auth = (request.headers.get('authorization') || '').trim();
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token === 'admin-token';
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getReferralSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching referral settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const settings = {
      enabled: Boolean(body.enabled),
      referrerReward: Number(body.referrerReward) || defaultReferralSettings.referrerReward,
      referredUserReward: Number(body.referredUserReward) || defaultReferralSettings.referredUserReward,
      minimumOrderValue: Number(body.minimumOrderValue) || defaultReferralSettings.minimumOrderValue,
      firstOrderOnly: Boolean(body.firstOrderOnly),
      maxReferralReward: Number(body.maxReferralReward) || defaultReferralSettings.maxReferralReward,
      dailyReferralLimit: Number(body.dailyReferralLimit) || defaultReferralSettings.dailyReferralLimit,
      monthlyReferralLimit: Number(body.monthlyReferralLimit) || defaultReferralSettings.monthlyReferralLimit,
      allowSelfReferral: Boolean(body.allowSelfReferral),
    };

    const success = await saveReferralSettings(settings);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Settings saved successfully' });
    } else {
      return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error saving referral settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}
