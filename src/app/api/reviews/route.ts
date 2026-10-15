import { NextRequest, NextResponse } from 'next/server';
import { Filter, WithId } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';
import { normalizeReviewPayload } from '@/lib/reviewUtils';

export const runtime = 'nodejs';

interface ReviewDoc {
  name: string;
  rating: number;
  comment: string;
  avatar: string;
  imageUrl?: string;
  approved: boolean;
  createdAt: Date;
}

export async function GET(request: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json(
      { error: 'MONGODB_URI is not configured on the server' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const approvedParam = searchParams.get('approved');
  const approved = approvedParam === null ? undefined : approvedParam === 'true';

  const client = await getMongoClient(uri);
  try {
    const db = client.db(getDatabaseName());
    const reviews = db.collection<ReviewDoc>('reviews');

    const query: Filter<ReviewDoc> = {};
    if (approved !== undefined) query.approved = approved;

    const reviewsRaw = await reviews
      .find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    const items = (reviewsRaw as WithId<ReviewDoc>[]).map((r) => ({
      ...r,
      _id: String(r._id),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
    }));

    return NextResponse.json({ reviews: items });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json(
      { error: 'MONGODB_URI is not configured on the server' },
      { status: 500 }
    );
  }

  const client = await getMongoClient(uri);

  try {
    const payload = normalizeReviewPayload(await request.json());
    const { name, rating, comment, imageUrl } = payload;

    if (!name || !comment || !Number.isFinite(rating)) {
      return NextResponse.json(
        { error: 'Name, rating, and comment are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const avatar = name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const db = client.db(getDatabaseName());
    const reviews = db.collection<ReviewDoc>('reviews');

    const reviewDoc: ReviewDoc = {
      name,
      rating,
      comment,
      avatar,
      approved: false,
      createdAt: new Date(),
    };

    if (imageUrl) {
      reviewDoc.imageUrl = imageUrl;
    }

    const result = await reviews.insertOne(reviewDoc);

    return NextResponse.json({
      message: 'Review submitted successfully',
      reviewId: String(result.insertedId),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
