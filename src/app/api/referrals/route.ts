import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { getUserReferralStats, getUserReferrals, resolveUserReferralCode } from '@/lib/referrals';

export const runtime = 'nodejs';

// Simple JWT verification (same as in profile API)
function verifyToken(token: string): { id: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode payload (base64)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    
    return { id: payload.id };
  } catch (error) {
    console.error('Token verification error:', error);
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

    const db = await getDatabase();
    const users = db.collection('users');
    
    let user = await users.findOne({ id: decoded.id });
    
    if (user && !user.referral_code) {
      const existingCodeDocs = await users.find({}).project<{ referral_code?: string | null }>({ referral_code: 1, _id: 0 }).toArray();
      const existingCodes = existingCodeDocs
        .map((entry) => entry.referral_code)
        .filter((code): code is string => typeof code === 'string' && code.trim().length > 0);
      const referralCode = resolveUserReferralCode(undefined, existingCodes);
      await users.updateOne({ id: decoded.id }, { $set: { referral_code: referralCode } });
      user = { ...user, referral_code: referralCode };
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get referral stats
    const stats = await getUserReferralStats(decoded.id);
    
    // Get referral history
    const referrals = await getUserReferrals(decoded.id);

    return NextResponse.json({
      success: true,
      referralCode: user.referral_code,
      stats,
      referrals,
    });
  } catch (error) {
    console.error('Error fetching referral data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral data' },
      { status: 500 }
    );
  }
}
