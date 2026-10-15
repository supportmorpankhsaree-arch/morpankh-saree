import { NextRequest, NextResponse } from 'next/server';
import { Db, WithId, Document } from 'mongodb';
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
  const baseSlug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const timestamp = Date.now().toString(36);
  return `${baseSlug}-${timestamp}`;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const database = await getDatabase();
    const collection = database.collection('blogs');

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await collection.countDocuments(filter);
    const skip = (page - 1) * limit;

    const blogs = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      data: blogs.map((blog) => ({
        ...blog,
        _id: String(blog._id),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, excerpt, description, image, status, blogDate } = body;

    if (!title || !excerpt || !description || !image) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const database = await getDatabase();
    const collection = database.collection('blogs');

    const slug = getSlug(title);

    const blog = {
      title,
      excerpt,
      description,
      image,
      status: status || 'active',
      slug,
      blogDate: blogDate || new Date().toISOString().split('T')[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(blog);

    return NextResponse.json({
      success: true,
      data: { ...blog, _id: String(result.insertedId) },
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    return NextResponse.json({ success: false, error: 'Failed to create blog' }, { status: 500 });
  }
}
