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

import { initialCareers } from '@/data/mockData';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim().toLowerCase() || '';

  if (!process.env.MONGODB_URI) {
    let list = initialCareers;
    if (search) {
      list = list.filter((c) => c.title.toLowerCase().includes(search) || c.excerpt.toLowerCase().includes(search));
    }
    return NextResponse.json({ success: true, data: list });
  }

  try {
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
    console.error('Error fetching careers, falling back to mock data:', error);
    let list = initialCareers;
    if (search) {
      list = list.filter((c) => c.title.toLowerCase().includes(search) || c.excerpt.toLowerCase().includes(search));
    }
    return NextResponse.json({ success: true, data: list });
  }
}
