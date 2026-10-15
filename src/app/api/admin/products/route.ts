import { NextRequest, NextResponse } from 'next/server';
import { Db, WithId, Document } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';
import { invalidateProductCache } from '@/lib/redis';

export const runtime = 'nodejs';

let db: Db;

function isAdminRequest(request: NextRequest) {
  const auth = (request.headers.get('authorization') || '').trim();
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token === 'admin-token';
}

async function getDatabase() {
  if (!db) {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/morepankh_6th_may';
    const client = await getMongoClient(uri);
    db = client.db(getDatabaseName());
  }
  return db;
}

function getSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

type IncomingColorVariant = {
  colorName: string;
  stock: number;
  colorImage?: string;
  image?: string;
  subImages?: string[];
  images: string[];
  sizes?: { [key: string]: number };
};

function normalizeColors(value: unknown): IncomingColorVariant[] {
  if (!Array.isArray(value)) return [];

  console.log('🔍 NORMALIZE COLORS DEBUG:', {
    value,
    valueType: typeof value,
    isArray: Array.isArray(value),
    firstItem: value[0],
    firstItemType: typeof value[0],
    allStrings: value.every((v) => typeof v === 'string')
  });

  // allow both old schema colors: string[] and new schema colors: {colorName, stock, images}[]
  if (value.every((v) => typeof v === 'string')) {
    console.log('📝 Processing legacy string colors');
    return (value as string[]).map((c) => ({
      colorName: c,
      stock: 0, // Default for legacy format - main stock will be used
      image: '',
      subImages: [],
      images: [],
    }));
  }

  console.log('🎨 Processing object colors');
  const result = (value as Array<Partial<IncomingColorVariant>>)
    .filter((c) => typeof c?.colorName === 'string')
    .map((c) => {
      const normalized = {
        colorName: String(c.colorName),
        stock: Number(c.stock) || 0,
        colorImage: typeof c.colorImage === 'string' ? c.colorImage : '',
        image: typeof c.image === 'string' ? c.image : (typeof c.images === 'object' && Array.isArray(c.images) ? c.images[0] || '' : ''),
        subImages: Array.isArray(c.subImages) ? (c.subImages as string[]).filter(Boolean) : [],
        images: Array.isArray(c.images) ? (c.images as string[]) : [],
        sizes: c.sizes && typeof c.sizes === 'object' ? c.sizes : undefined,
      };
      console.log('✨ Normalized color:', { original: c, normalized });
      return normalized;
    });
  
  console.log('🎯 Final normalized colors:', result);
  return result;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(searchParams.get('pageSize')) || 6));
    const search = searchParams.get('search')?.trim() || '';

    const database = await getDatabase();

    // Build query with search filter
    const query: Record<string, unknown> = {};
    if (search) {
      Object.assign(query, {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { barcode: { $regex: search, $options: 'i' } }
        ]
      });
      console.log(`🔍 Products search query:`, JSON.stringify(query));
    }

    const total = await database.collection('products').countDocuments(query);

    const skip = (page - 1) * pageSize;
    const products = await database
      .collection('products')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    const transformed = (products as WithId<Document>[]).map((p) => {
      const transformedProduct = {
        ...p,
        _id: p._id.toString(),
      };

      // Lazy migration: if formType is missing, detect and set it
      if (!p.formType) {
        const hasDressStructure = Array.isArray(p.colors) && p.colors.some((c: { hasSizes?: boolean; sizes?: { xxxl?: number; free?: number } }) =>
          c.hasSizes && c.sizes && (c.sizes.xxxl !== undefined || c.sizes.free !== undefined)
        );

        if (hasDressStructure) {
          // Update the product with formType = 'dress'
          database.collection('products').updateOne(
            { _id: p._id },
            { $set: { formType: 'dress', updatedAt: new Date() } }
          ).catch(err => console.error('[PRODUCTS-GET] Migration error:', err));

          console.log('[PRODUCTS-GET] Migrated product to dress formType:', p._id?.toString());
        } else {
          // Update the product with formType = 'regular'
          database.collection('products').updateOne(
            { _id: p._id },
            { $set: { formType: 'regular', updatedAt: new Date() } }
          ).catch(err => console.error('[PRODUCTS-GET] Migration error:', err));

          console.log('[PRODUCTS-GET] Migrated product to regular formType:', p._id?.toString());
        }
      }

      if (p.name === 'Vintage Floral Grace') {
        console.log('🔍 ADMIN GET DEBUG - Vintage Floral Grace:', {
          productId: p._id,
          productName: p.name,
          storedColors: p.colors,
          storedStock: p.stock,
          colorsType: typeof p.colors,
          colorsIsArray: Array.isArray(p.colors)
        });
      }

      return transformedProduct;
    });

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: transformed,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const name = String(body?.name || '').trim();
    const category = String(body?.category || '').trim();
    const sku = String(body?.sku || '').trim();
    const barcode = String(body?.barcode || '').trim();

    const price = Number(body?.price ?? body?.salePrice ?? body?.basePrice);
    const comparePrice = Number(body?.comparePrice ?? body?.compareAtPrice ?? body?.originalPrice);

    if (!name) {
      return NextResponse.json({ success: false, error: 'Product name is required' }, { status: 400 });
    }
    if (!sku) {
      return NextResponse.json({ success: false, error: 'SKU is required' }, { status: 400 });
    }
    if (!barcode) {
      return NextResponse.json({ success: false, error: 'Barcode is required' }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category is required' }, { status: 400 });
    }
    if (!Number.isFinite(price)) {
      return NextResponse.json({ success: false, error: 'Valid price is required' }, { status: 400 });
    }
    if (!Number.isFinite(comparePrice)) {
      return NextResponse.json({ success: false, error: 'Valid compare price is required' }, { status: 400 });
    }

    // Validate limited offer end date
    if (body?.isLimitedOffer) {
      if (!body?.limitedOfferEndDate) {
        return NextResponse.json({ success: false, error: 'Offer end date is required for limited offers' }, { status: 400 });
      }
      const endDate = new Date(body.limitedOfferEndDate);
      const now = new Date();
      if (isNaN(endDate.getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid offer end date' }, { status: 400 });
      }
      if (endDate <= now) {
        return NextResponse.json({ success: false, error: 'Offer end date must be in the future' }, { status: 400 });
      }
    }

    const colors = normalizeColors(body?.colors);
    if (colors.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one color variant is required' }, { status: 400 });
    }

    console.log('🔍 ADMIN API DEBUG:', {
      productName: name,
      incomingColors: body?.colors,
      normalizedColors: colors,
      isVintageFloralGrace: name === 'Vintage Floral Grace'
    });

    const slug = String(body?.slug || getSlug(name));

    const database = await getDatabase();

    // Check if SKU already exists
    const existingSku = await database.collection('products').findOne({ sku });
    if (existingSku) {
      return NextResponse.json({ success: false, error: 'A product with this SKU already exists' }, { status: 400 });
    }

    // Check if barcode already exists
    const existingBarcode = await database.collection('products').findOne({ barcode });
    if (existingBarcode) {
      return NextResponse.json({ success: false, error: 'A product with this barcode already exists' }, { status: 400 });
    }

    const doc = {
      name,
      slug,
      sku: body?.sku || '',
      barcode: body?.barcode || '',
      category,

      // store both for compatibility
      price,
      comparePrice,
      basePrice: price,
      compareAtPrice: comparePrice,

      stock: Number(body?.stock) || 0,
      colors,

      description: body?.description || '',
      fabric: body?.fabric || '',
      fabricType: body?.fabricType ?? body?.fabric ?? '',
      shortDescription: body?.shortDescription,
      size: body?.size || '',
      hasSizes: Boolean(body?.hasSizes || false),
      sizes: body?.hasSizes ? (Array.isArray(body?.sizes) ? body.sizes : []) : [],

      hidden: Boolean(body?.hidden),
      featured: Boolean(body?.featured),
      isNew: Boolean(body?.isNew),
      isPremium: Boolean(body?.isPremium),
      isTrending: Boolean(body?.isTrending),
      isLiveSpecial: Boolean(body?.isLiveSpecial),
      isLimitedOffer: Boolean(body?.isLimitedOffer),
      limitedStock: body?.isLimitedOffer ? Number(body?.limitedStock) || undefined : undefined,
      limitedOfferMessage: body?.isLimitedOffer ? String(body?.limitedOfferMessage || '') : undefined,
      limitedOfferEndDate: body?.isLimitedOffer && body?.limitedOfferEndDate ? new Date(body.limitedOfferEndDate) : undefined,
      limitedOfferExpired: false,
      cardOfferText: typeof body?.cardOfferText === 'string' ? body.cardOfferText.trim() : '',

      // Prebooking fields
      isPrebooking: Boolean(body?.isPrebooking),
      prebookingPrice: body?.isPrebooking ? Number(body?.prebookingPrice) || undefined : undefined,
      prebookingDeliveryDays: body?.isPrebooking ? Number(body?.prebookingDeliveryDays) || undefined : undefined,
      prebookingMessage: body?.isPrebooking ? String(body?.prebookingMessage || '') : undefined,

      rating: Number(body?.rating) || 0,
      reviews: Number(body?.reviews) || 0,
      sareeLength: body?.sareeLength || '',
      blouseIncluded: Boolean(body?.blouseIncluded),
      tags: Array.isArray(body?.tags) ? body.tags : [],

      // Form type tracking - regular products created via "Add Product"
      formType: 'regular',

      // fallbacks for legacy UI usage
      images: colors.flatMap((c) => [c.image, ...(c.subImages || []), ...(c.images || [])].filter(Boolean)),

      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await database.collection('products').insertOne(doc);

    // Invalidate product cache after creation
    await invalidateProductCache(doc.slug);

    return NextResponse.json({
      success: true,
      data: { ...doc, _id: result.insertedId.toString() },
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
