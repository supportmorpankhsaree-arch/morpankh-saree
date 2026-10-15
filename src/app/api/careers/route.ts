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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';

    const database = await getDatabase();
    const collection = database.collection('careers');

    const filter: Record<string, unknown> = { status: 'open' };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
      ];
    }

    const careers = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: careers.map((career) => ({
        ...career,
        _id: String(career._id),
      })),
    });
  } catch (error) {
    console.error('Error fetching careers:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch careers' }, { status: 500 });
  }
}
