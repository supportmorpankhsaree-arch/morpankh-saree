import { NextRequest, NextResponse } from 'next/server';
import { Db, ObjectId } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';

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

function getSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const database = await getDatabase();
    const collection = database.collection('blogs');

    const blog = await collection.findOne({ _id: new ObjectId(id) });

    if (!blog) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { ...blog, _id: String(blog._id) },
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch blog' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, excerpt, description, image, status, blogDate } = body;

    const { id } = await params;
    const database = await getDatabase();
    const collection = database.collection('blogs');

    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) {
      updateData.title = title;
      updateData.slug = getSlug(title);
    }
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (status !== undefined) updateData.status = status;
    if (blogDate !== undefined) updateData.blogDate = blogDate;

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    const updated = await collection.findOne({ _id: new ObjectId(id) });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Blog not found after update' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { ...updated, _id: String(updated._id) },
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    return NextResponse.json({ success: false, error: 'Failed to update blog' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const database = await getDatabase();
    const collection = database.collection('blogs');

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete blog' }, { status: 500 });
  }
}
