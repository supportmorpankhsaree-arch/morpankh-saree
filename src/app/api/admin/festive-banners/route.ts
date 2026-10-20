import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAdminRequest(request: NextRequest) {
  const auth = (request.headers.get('authorization') || '').trim();
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token === 'admin-token';
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const banners = await db
      .collection('festive_banners')
      .find({})
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    const data = banners.map((b) => ({
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
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in admin GET festive banners:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch festive banners' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      title,
      price,
      subtitle,
      tagText,
      bankOfferText,
      badgeTitle,
      badgeSub,
      link,
      image,
      gradient,
      order = 0,
      isActive = true,
    } = body || {};

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    if (!image || !image.trim()) {
      return NextResponse.json({ success: false, error: 'Image is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const now = new Date();

    const result = await db.collection('festive_banners').insertOne({
      title: title.trim(),
      price: (price || '').trim(),
      subtitle: (subtitle || '').trim(),
      tagText: (tagText || '').trim(),
      bankOfferText: (bankOfferText || '').trim(),
      badgeTitle: (badgeTitle || 'THE BIG').trim(),
      badgeSub: (badgeSub || 'FESTIVE DAYS').trim(),
      link: (link || '/products').trim(),
      image: image.trim(),
      gradient: gradient || 'from-[#2b0845] via-[#4e1078] to-[#7919a3]',
      order: Number(order) || 0,
      isActive: Boolean(isActive),
      createdAt: now,
      updatedAt: now,
    });

    const created = await db.collection('festive_banners').findOne({ _id: result.insertedId });
    return NextResponse.json({
      success: true,
      data: {
        id: created?._id?.toString(),
        ...created,
      },
    });
  } catch (error) {
    console.error('Error in admin POST festive banner:', error);
    return NextResponse.json({ success: false, error: 'Failed to create festive banner' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      id,
      title,
      price,
      subtitle,
      tagText,
      bankOfferText,
      badgeTitle,
      badgeSub,
      link,
      image,
      gradient,
      order,
      isActive,
    } = body || {};

    if (!id) {
      return NextResponse.json({ success: false, error: 'Banner ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };

    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateFields.title = title.trim();
    if (price !== undefined) updateFields.price = price.trim();
    if (subtitle !== undefined) updateFields.subtitle = subtitle.trim();
    if (tagText !== undefined) updateFields.tagText = tagText.trim();
    if (bankOfferText !== undefined) updateFields.bankOfferText = bankOfferText.trim();
    if (badgeTitle !== undefined) updateFields.badgeTitle = badgeTitle.trim();
    if (badgeSub !== undefined) updateFields.badgeSub = badgeSub.trim();
    if (link !== undefined) updateFields.link = link.trim();
    if (image !== undefined) updateFields.image = image.trim();
    if (gradient !== undefined) updateFields.gradient = gradient;
    if (order !== undefined) updateFields.order = Number(order) || 0;
    if (isActive !== undefined) updateFields.isActive = Boolean(isActive);

    await db.collection('festive_banners').updateOne(filter, { $set: updateFields });

    const updated = await db.collection('festive_banners').findOne(filter);
    return NextResponse.json({
      success: true,
      data: {
        id: updated?._id?.toString() || id,
        ...updated,
      },
    });
  } catch (error) {
    console.error('Error in admin PUT festive banner:', error);
    return NextResponse.json({ success: false, error: 'Failed to update festive banner' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Banner ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };

    await db.collection('festive_banners').deleteOne(filter);
    return NextResponse.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error in admin DELETE festive banner:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete festive banner' }, { status: 500 });
  }
}
