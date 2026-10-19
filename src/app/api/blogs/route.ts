import { NextRequest, NextResponse } from 'next/server';
import { Db } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

let db: Db;

async function getDatabase() {
  if (!db) {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/morepankh_6th_may';
    const client = await getMongoClient(uri);
    db = client.db(getDatabaseName());
  }
  return db;
}

import { initialBlogs } from '@/data/mockData';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim().toLowerCase() || '';

  if (!process.env.MONGODB_URI) {
    let list = initialBlogs;
    if (search) {
      list = list.filter((b) => b.title.toLowerCase().includes(search) || b.excerpt.toLowerCase().includes(search));
    }
    return NextResponse.json({ success: true, data: list });
  }

  try {
    const database = await getDatabase();
    const collection = database.collection('blogs');

    const filter: Record<string, unknown> = { status: 'active' };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
      ];
    }

    const blogs = await collection
      .find(filter)
      .sort({ blogDate: -1, createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: blogs.map((blog) => ({
        ...blog,
        _id: String(blog._id),
      })),
    });
  } catch (error) {
    console.error('Error fetching blogs, falling back to mock data:', error);
    let list = initialBlogs;
    if (search) {
      list = list.filter((b) => b.title.toLowerCase().includes(search) || b.excerpt.toLowerCase().includes(search));
    }
    return NextResponse.json({ success: true, data: list });
  }
}
