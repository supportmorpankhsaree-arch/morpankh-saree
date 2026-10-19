import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface FestiveBannerItem {
  id: string;
  title: string;
  price: string;
  subtitle?: string;
  tagText?: string;
  bankOfferText?: string;
  badgeTitle?: string;
  badgeSub?: string;
  link: string;
  image: string;
  gradient?: string;
  order?: number;
  isActive: boolean;
  createdAt?: string;
}

export async function GET() {
  try {
    const db = await getDatabase();
    const banners = await db
      .collection('festive_banners')
      .find({ isActive: { $ne: false } })
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    const data: FestiveBannerItem[] = banners.map((b) => ({
      id: b._id?.toString() || b.id,
      title: b.title || '',
      price: b.price || '',
      subtitle: b.subtitle || '',
      tagText: b.tagText || '',
      bankOfferText: b.bankOfferText || '',
      badgeTitle: b.badgeTitle || 'THE BIG',
      badgeSub: b.badgeSub || 'FESTIVE DAYS',
      link: b.link || '/products',
      image: b.image || '',
      gradient: b.gradient || 'from-[#2b0845] via-[#4e1078] to-[#7919a3]',
      order: typeof b.order === 'number' ? b.order : 0,
      isActive: b.isActive !== false,
      createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : undefined,
    }));

    return NextResponse.json(
      { success: true, data },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
    );
  } catch (error) {
    console.error('Error fetching festive banners:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch festive banners', data: [] },
      { status: 500 }
    );
  }
}
