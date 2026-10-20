import { NextResponse } from 'next/server';
import { getDatabaseName, getMongoClient } from '@/lib/database';
import { hasAvailableStock, mapProductFromDoc, checkAndExpireLimitedOffer } from '@/lib/mapProduct';
import { cacheOrFetch } from '@/lib/redis';

export const runtime = 'nodejs';

const SECTION_LIMIT = 4;

async function fetchSection(
  filter: Record<string, unknown>,
  limit = SECTION_LIMIT
) {
  const uri = process.env.MONGODB_URI!;
  const client = await getMongoClient(uri);
  const database = client.db(getDatabaseName());
  const raw = await database
    .collection('products')
    .find({ hidden: { $ne: true }, isActive: { $ne: false }, ...filter })
    .sort({ createdAt: -1 })
    .limit(limit * 2)
    .toArray();

  // Check and expire limited offers
  for (const doc of raw) {
    if (doc.isLimitedOffer && doc.limitedOfferEndDate && !doc.limitedOfferExpired) {
      await checkAndExpireLimitedOffer(doc, database);
    }
  }

  // Re-fetch to get updated data after potential expiry
  const updatedRaw = await database
    .collection('products')
    .find({ hidden: { $ne: true }, isActive: { $ne: false }, ...filter })
    .sort({ createdAt: -1 })
    .limit(limit * 2)
    .toArray();

  return updatedRaw
    .map((doc) => mapProductFromDoc(doc))
    .filter(hasAvailableStock)
    .slice(0, limit);
}

import { initialProducts } from '@/data/mockData';

export async function GET() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const featured = initialProducts.filter((p) => p.featured).slice(0, 4);
    const newArrivals = initialProducts.filter((p) => p.isNew).slice(0, 4);
    const sale = initialProducts.filter((p) => p.isSale).slice(0, 4);
    const premium = initialProducts.filter((p) => p.isPremium).slice(0, 4);
    const trending = initialProducts.filter((p) => p.isTrending).slice(0, 4);
    const limitedOffer = initialProducts.filter((p) => p.isLimitedOffer || p.isSale).slice(0, 4);
    const liveSpecial = initialProducts.filter((p) => p.isLiveSpecial || p.featured).slice(0, 4);
    const spotlight = initialProducts.slice(0, 8);

    return NextResponse.json({
      success: true,
      data: {
        featured,
        newArrivals,
        sale,
        premium,
        trending,
        limitedOffer,
        liveSpecial,
        spotlight,
      },
    });
  }

  const cacheKey = 'products:v2:home';
  const cacheTTL = 300;

  try {
    const payload = await cacheOrFetch(cacheKey, cacheTTL, async () => {
      const [
        featured,
        newArrivals,
        sale,
        premium,
        trending,
        limitedOffer,
        liveSpecial,
        spotlight,
      ] = await Promise.all([
        fetchSection({ $or: [{ featured: true }, { isFeatured: true }] }),
        fetchSection({ isNew: true }),
        fetchSection({ isSale: true }),
        fetchSection({ isPremium: true }),
        fetchSection({ isTrending: true }),
        fetchSection({ isLimitedOffer: true }),
        fetchSection({ isLiveSpecial: true }),
        fetchSection({}, 10),
      ]);

      return {
        success: true,
        data: {
          featured,
          newArrivals,
          sale,
          premium,
          trending,
          limitedOffer,
          liveSpecial,
          spotlight,
        },
      };
    });

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.warn('⚠️ Error fetching home products from DB, falling back to mock data:', error);
    const featured = initialProducts.filter((p) => p.featured).slice(0, 4);
    const newArrivals = initialProducts.filter((p) => p.isNew).slice(0, 4);
    const sale = initialProducts.filter((p) => p.isSale).slice(0, 4);
    const premium = initialProducts.filter((p) => p.isPremium).slice(0, 4);
    const trending = initialProducts.filter((p) => p.isTrending).slice(0, 4);
    const limitedOffer = initialProducts.filter((p) => p.isLimitedOffer || p.isSale).slice(0, 4);
    const liveSpecial = initialProducts.filter((p) => p.isLiveSpecial || p.featured).slice(0, 4);
    const spotlight = initialProducts.slice(0, 8);

    return NextResponse.json({
      success: true,
      data: {
        featured,
        newArrivals,
        sale,
        premium,
        trending,
        limitedOffer,
        liveSpecial,
        spotlight,
      },
    });
  }
}
