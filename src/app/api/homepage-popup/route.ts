import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDatabase();
    const popup = await db.collection('homepage_popups').findOne(
      { isActive: true },
      { sort: { updatedAt: -1, createdAt: -1 } }
    );

    if (!popup) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: popup._id?.toString?.() || popup.id,
        imageUrl: popup.imageUrl || null,
        imagePublicId: popup.imagePublicId || null,
        isActive: Boolean(popup.isActive),
      },
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    console.error('Error loading homepage popup:', error);
    return NextResponse.json({ success: false, error: 'Failed to load homepage popup' }, { status: 500 });
  }
}
