import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { getAllReferrals } from '@/lib/referrals';

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const { referrals, pagination } = await getAllReferrals(status, page, pageSize);

    return NextResponse.json({
      success: true,
      data: referrals,
      pagination,
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch referrals' }, { status: 500 });
  }
}
