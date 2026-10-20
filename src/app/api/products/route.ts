import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseName, getMongoClient } from '@/lib/database';
import {
  buildProductQuery,
  hasAvailableStock,
  mapProductFromDoc,
  sortProducts,
  checkAndExpireLimitedOffer,
} from '@/lib/mapProduct';
import { cacheOrFetch } from '@/lib/redis';

export const runtime = 'nodejs';

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), max);
}

import { initialProducts } from '@/data/mockData';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parsePositiveInt(searchParams.get('page'), 1, 500);
  const limit = parsePositiveInt(searchParams.get('limit'), 12, 48);
  const category = searchParams.get('category')?.trim() || '';
  const highlight = searchParams.get('highlight')?.trim() || '';
  const search = searchParams.get('search')?.trim() || '';
  const sortBy = searchParams.get('sort')?.trim() || '';
  const size = searchParams.get('size')?.trim() || '';
  const inStock = searchParams.get('inStock') === 'true';
  const minPrice = searchParams.get('minPrice') !== null ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') !== null ? Number(searchParams.get('maxPrice')) : undefined;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    let list = [...initialProducts];
    if (category) {
      list = list.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
    }
    if (highlight) {
      if (highlight === 'featured') list = list.filter((p) => p.featured);
      else if (highlight === 'limited') list = list.filter((p) => p.isLimitedOffer || p.isSale);
      else if (highlight === 'sale') list = list.filter((p) => p.isSale);
      else if (highlight === 'new') list = list.filter((p) => p.isNew);
      else if (highlight === 'trending') list = list.filter((p) => p.isTrending);
      else if (highlight === 'premium') list = list.filter((p) => p.isPremium);
      else if (highlight === 'liveSpecial') list = list.filter((p) => p.isLiveSpecial);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.fabric.toLowerCase().includes(q)
      );
    }
    if (minPrice !== undefined && Number.isFinite(minPrice)) {
      list = list.filter((p) => p.price >= minPrice);
    }
    if (maxPrice !== undefined && Number.isFinite(maxPrice)) {
      list = list.filter((p) => p.price <= maxPrice);
    }
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const paginated = list.slice(start, start + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  }

  const cacheKey = `products:v2:list:${page}:${limit}:${category}:${highlight}:${search}:${sortBy}:${size}:${inStock}:${minPrice ?? ''}:${maxPrice ?? ''}`;
  const cacheTTL = 300;

  try {
    const payload = await cacheOrFetch(cacheKey, cacheTTL, async () => {
      const client = await getMongoClient(uri);
      const database = client.db(getDatabaseName());
      const collection = database.collection('products');
      const filter = buildProductQuery({
        category: category || undefined,
        highlight: highlight || undefined,
        search: search || undefined,
        size: size || undefined,
        minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
        maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      });

      const raw = await collection.find(filter).sort({ createdAt: -1 }).toArray();

      // Check and expire limited offers
      for (const doc of raw) {
        if (doc.isLimitedOffer && doc.limitedOfferEndDate && !doc.limitedOfferExpired) {
          await checkAndExpireLimitedOffer(doc, database);
        }
      }

      // Re-fetch to get updated data after potential expiry
      const updatedRaw = await collection.find(filter).sort({ createdAt: -1 }).toArray();
      let products = updatedRaw.map((doc) => mapProductFromDoc(doc));

      if (inStock) {
        products = products.filter(hasAvailableStock);
      }

      products = sortProducts(products, sortBy);

      const total = products.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * limit;
      const data = products.slice(start, start + limit);

      return {
        success: true,
        data,
        pagination: {
          page: safePage,
          limit,
          total,
          totalPages,
        },
      };
    });

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.warn('⚠️ Error fetching products from DB, falling back to mock data:', error);
    let products = [...initialProducts];
    if (category) {
      products = products.filter(p => p.category?.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    const total = products.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const data = products.slice(start, start + limit);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page: safePage,
        limit,
        total,
        totalPages,
      },
    });
  }
}
