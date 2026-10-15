import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { generateReferralCode } from '@/lib/referrals';

export const runtime = 'nodejs';

function isAdminRequest(request: NextRequest): boolean {
  const auth = (request.headers.get('authorization') || '').trim();
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token === 'admin-token';
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const users = db.collection('users');

    // Find users without referral codes
    const usersWithoutCode = await users.find({ referral_code: { $exists: false } }).toArray();

    let updatedCount = 0;
    const errors: string[] = [];

    for (const user of usersWithoutCode) {
      try {
        const referralCode = generateReferralCode();
        await users.updateOne(
          { _id: user._id },
          { $set: { referral_code: referralCode } }
        );
        updatedCount++;
      } catch (error) {
        errors.push(`Failed to update user ${user.id || user._id}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated referral codes for ${updatedCount} users`,
      updatedCount,
      totalChecked: usersWithoutCode.length,
      errors,
    });
  } catch (error) {
    console.error('Error generating referral codes:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate referral codes' }, { status: 500 });
  }
}
