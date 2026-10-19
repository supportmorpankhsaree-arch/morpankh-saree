/**

 * ============================================================

 * API ROUTE: /api/products/[slug]

 * File: src/app/api/products/[slug]/route.ts

 * ============================================================

 */



import { NextRequest, NextResponse } from 'next/server';

import { ObjectId } from 'mongodb';

import { getDatabaseName, getMongoClient } from '@/lib/database';
import { cacheOrFetch, invalidateProductCache } from '@/lib/redis';
import { checkAndExpireLimitedOffer } from '@/lib/mapProduct';
import { initialProducts } from '@/data/mockData';

export const runtime = 'nodejs';

const uri = process.env.MONGODB_URI;

function getSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  if (!uri) {
    const p = initialProducts.find((item) => item.slug === slug || item.id === slug);
    if (!p) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({
      _id: p.id,
      name: p.name,
      slug: p.slug,
      basePrice: p.price,
      compareAtPrice: p.comparePrice,
      description: p.description,
      fabricType: p.fabric,
      category: p.category,
      colors: p.colors,
      hasSizes: p.hasSizes,
      sizes: p.sizes,
      stock: p.stock,
      sku: p.sku,
      tags: p.tags,
      isFeatured: p.featured,
      isNew: p.isNew,
      isSale: p.isSale,
      isPremium: p.isPremium,
      isTrending: p.isTrending,
      isLiveSpecial: p.isLiveSpecial,
      isLimitedOffer: p.isLimitedOffer,
      rating: p.rating,
      reviewCount: p.reviews,
      isActive: true,
    });
  }

  // Use Redis cache with 10-minute TTL (600 seconds)
  // Cache key: product:{slug}
  const cacheKey = `products:v2:product:${slug}`;
  const cacheTTL = 600; // 10 minutes

  try {
    const payload = await cacheOrFetch(cacheKey, cacheTTL, async () => {
      const client = await getMongoClient(uri);

      const db = client.db(getDatabaseName());

      const products = db.collection('products');

      const product = await products.findOne({

        $or: [

          { slug },

          { slug: { $exists: false }, name: { $regex: slug.replace(/-/g, ' '), $options: 'i' } },

        ],

        isActive: { $ne: false },

      });

    if (!product) {

      return { notFound: true as const };

    }

    // Check and expire limited offer if needed
    if (product.isLimitedOffer && product.limitedOfferEndDate && !product.limitedOfferExpired) {
      await checkAndExpireLimitedOffer(product, db);
      // Re-fetch to get updated data
      const updatedProduct = await products.findOne({
        $or: [
          { slug },
          { slug: { $exists: false }, name: { $regex: slug.replace(/-/g, ' '), $options: 'i' } },
        ],
        isActive: { $ne: false },
      });
      if (updatedProduct) {
        Object.assign(product, updatedProduct);
      }
    }



    // ── Compute derived fields ──────────────────────────────

    const base = product.basePrice as number;

    const compare = product.compareAtPrice as number | undefined;

    const discountPercent =

      compare && compare > base

        ? Math.round((1 - base / compare) * 100)

        : undefined;



    // ── Enrich colors with isOutOfStock ─────────────────────

    const colors = ((product.colors as Array<{

      colorName: string;

      stock: number;

      image?: string;

      subImages?: string[];

      images: string[];

      colorImage?: string;

      sizes?: { [key: string]: number };

      hasSizes?: boolean;

    }>) || []).map((c) => {

      const primaryImage = c.image || c.colorImage || (c.images && c.images.length > 0 ? c.images[0] : '');
      const subImages = Array.isArray(c.subImages) ? c.subImages.filter(Boolean) : [];
      const colorImages = [primaryImage, ...subImages, ...(c.images || [])]
        .filter(Boolean)
        .filter((img, idx, arr) => arr.indexOf(img) === idx);

      return {

        colorName: c.colorName,

        stock: c.stock,

        colorImage: c.colorImage || primaryImage,

        image: primaryImage,

        subImages,

        images: colorImages,

        isOutOfStock: c.stock <= 0,

        sizes: c.sizes,

        hasSizes: c.hasSizes,

      };
    });



    // ── Shape the API response ──────────────────────────────

    return {

      _id: String(product._id),

      name: product.name,

      slug: product.slug || getSlug(product.name),

      sku: product.sku,

      category: product.category,

      basePrice: product.basePrice,

      compareAtPrice: product.compareAtPrice,

      discountPercent,

      shortDescription: product.shortDescription,

      description: product.description,

      fabricType: product.fabricType,

      sareeLength: product.sareeLength,

      blouseIncluded: product.blouseIncluded ?? false,

      tags: product.tags || [],

      colors,

      isSale: product.isSale ?? false,

      isFeatured: product.isFeatured ?? false,

      rating: product.rating,

      reviewCount: product.reviewCount,

      // Prebooking fields

      isPrebooking: product.isPrebooking ?? false,

      prebookingPrice: product.prebookingPrice,

      prebookingDeliveryDays: product.prebookingDeliveryDays,

      prebookingMessage: product.prebookingMessage,

      // Limited offer fields

      isLimitedOffer: product.isLimitedOffer ?? false,

      limitedStock: product.limitedStock,

      limitedOfferMessage: product.limitedOfferMessage,

      limitedOfferEndDate: product.limitedOfferEndDate,

      limitedOfferExpired: product.limitedOfferExpired ?? false,

      // Size fields

      size: product.size,

      hasSizes: product.hasSizes ?? false,

      sizes: product.sizes || [],

    };
    });

    if ('notFound' in payload && payload.notFound) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(payload);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}