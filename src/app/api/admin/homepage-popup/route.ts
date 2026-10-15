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
    const popup = await db.collection('homepage_popups').findOne(
      {},
      { sort: { updatedAt: -1, createdAt: -1 } }
    );

    return NextResponse.json({
      success: true,
      data: popup
        ? {
            id: popup._id?.toString?.() || popup.id,
            imageUrl: popup.imageUrl || null,
            imagePublicId: popup.imagePublicId || null,
            isActive: Boolean(popup.isActive),
            createdAt: popup.createdAt,
            updatedAt: popup.updatedAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching homepage popup:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch homepage popup' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { imageUrl, imagePublicId, isActive = true } = body || {};

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'Image URL is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const now = new Date();

    if (isActive) {
      await db.collection('homepage_popups').updateMany({}, { $set: { isActive: false, updatedAt: now } });
    }

    const result = await db.collection('homepage_popups').insertOne({
      imageUrl,
      imagePublicId: imagePublicId || null,
      isActive: Boolean(isActive),
      createdAt: now,
      updatedAt: now,
    });

    const created = await db.collection('homepage_popups').findOne({ _id: result.insertedId });
    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error('Error creating homepage popup:', error);
    return NextResponse.json({ success: false, error: 'Failed to create homepage popup' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, imageUrl, imagePublicId, isActive = true } = body || {};

    if (!id) {
      return NextResponse.json({ success: false, error: 'Popup id is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const now = new Date();

    if (isActive) {
      await db.collection('homepage_popups').updateMany({}, { $set: { isActive: false, updatedAt: now } });
    }

    const update = {
      ...(imageUrl ? { imageUrl } : {}),
      ...(imagePublicId !== undefined ? { imagePublicId: imagePublicId || null } : {}),
      isActive: Boolean(isActive),
      updatedAt: now,
    };

    const result = await db.collection('homepage_popups').updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Popup not found' }, { status: 404 });
    }

    const updated = await db.collection('homepage_popups').findOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating homepage popup:', error);
    return NextResponse.json({ success: false, error: 'Failed to update homepage popup' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'Popup id is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const result = await db.collection('homepage_popups').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Popup not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Popup deleted successfully' });
  } catch (error) {
    console.error('Error deleting homepage popup:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete homepage popup' }, { status: 500 });
  }
}
