import { NextRequest, NextResponse } from 'next/server';

import { WithId, Document, ObjectId } from 'mongodb';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

interface ContactMessage {
  name: string;
  email: string;
  message: string;
  mobileNumber?: string;
  productName?: string;
  selectedColor?: string;
  phoneNumber?: string;
  description?: string;
  messageType?: string;
  createdAt: Date;
}

function isAdminRequest(request: NextRequest) {
  const auth = (request.headers.get('authorization') || '').trim();
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token === 'admin-token';
}

export async function GET(request: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json(
      { error: 'MONGODB_URI is not configured on the server' },
      { status: 500 }
    );
  }

  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const messageType = searchParams.get('messageType');

    const skip = (page - 1) * limit;

    const client = await getMongoClient(uri);
    const db = client.db(getDatabaseName());
    const contactMessages = db.collection<ContactMessage>('contact_messages');

    const filter: Record<string, unknown> = {};
    if (messageType) {
      filter.messageType = messageType;
    }

    const totalMessages = await contactMessages.countDocuments(filter);
    const totalPages = Math.ceil(totalMessages / limit);

    const messagesRaw = await contactMessages
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const messages = messagesRaw.map((m: WithId<Document>) => ({
      _id: String(m._id),
      name: m.name as string,
      email: m.email as string,
      message: m.message as string,
      mobileNumber: typeof m.mobileNumber === 'string' ? m.mobileNumber : '',
      productName: typeof m.productName === 'string' ? m.productName : '',
      selectedColor: typeof m.selectedColor === 'string' ? m.selectedColor : '',
      phoneNumber: typeof m.phoneNumber === 'string' ? m.phoneNumber : '',
      description: typeof m.description === 'string' ? m.description : '',
      messageType: typeof m.messageType === 'string' ? m.messageType : 'Contact',
      createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : null,
    }));

    return NextResponse.json({
      messages,
      currentPage: page,
      totalPages,
      totalMessages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json(
      { error: 'MONGODB_URI is not configured on the server' },
      { status: 500 }
    );
  }

  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const client = await getMongoClient(uri);
    const db = client.db(getDatabaseName());
    const contactMessages = db.collection<ContactMessage>('contact_messages');

    const result = await contactMessages.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
