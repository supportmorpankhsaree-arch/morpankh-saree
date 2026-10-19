import { NextRequest, NextResponse } from 'next/server';
import { WithId, Document } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getDatabaseName, getMongoClient } from '@/lib/database';
import { getMemoryOtp, deleteMemoryOtp } from '@/lib/otpStore';

export const runtime = 'nodejs';

const uri = process.env.MONGODB_URI!;

interface AdminOtpDoc {
  email: string;
  otpHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const normalize = (v: string) => {
      const trimmed = v.trim();
      return trimmed.endsWith(',') ? trimmed.slice(0, -1) : trimmed;
    };

    const envAdminEmail = process.env.ADMIN_EMAIL ? normalize(process.env.ADMIN_EMAIL).toLowerCase() : undefined;
    if (!envAdminEmail) {
      return NextResponse.json(
        { error: 'Admin credentials are not configured on the server' },
        { status: 500 }
      );
    }

    const inputEmail = normalize(String(email)).toLowerCase();
    if (inputEmail !== envAdminEmail) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    let record: { otpHash: string; expiresAt: Date } | null = null;

    try {
      const client = await getMongoClient(uri);
      const db = client.db(getDatabaseName());
      const adminOtps = db.collection<AdminOtpDoc>('admin_otps');
      record = await adminOtps.findOne({ email: inputEmail });
    } catch (mongoErr) {
      console.warn('[ADMIN OTP] MongoDB unreachable during verify, checking memory store:', (mongoErr as Error).message);
    }

    // Check memory store if not found in MongoDB
    if (!record) {
      const mem = getMemoryOtp(inputEmail);
      if (mem) {
        record = mem;
      }
    }

    if (!record) {
      return NextResponse.json(
        { error: 'OTP not found. Please request a new OTP.' },
        { status: 400 }
      );
    }

    if (new Date(record.expiresAt).getTime() <= Date.now()) {
      deleteMemoryOtp(inputEmail);
      try {
        const client = await getMongoClient(uri);
        const db = client.db(getDatabaseName());
        await db.collection('admin_otps').deleteOne({ email: inputEmail });
      } catch (err) {
        console.debug('Failed to delete expired OTP from MongoDB:', err);
      }

      return NextResponse.json(
        { error: 'OTP expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(String(otp).trim(), record.otpHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    deleteMemoryOtp(inputEmail);
    try {
      const client = await getMongoClient(uri);
      const db = client.db(getDatabaseName());
      await db.collection('admin_otps').deleteOne({ email: inputEmail });
    } catch (err) {
      console.debug('Failed to delete verified OTP from MongoDB:', err);
    }

    const token = 'admin-token';

    return NextResponse.json({
      message: 'Admin login successful',
      token,
      user: {
        id: 'admin',
        name: 'Admin',
        email: inputEmail,
        verified: true,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
