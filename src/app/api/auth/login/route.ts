import { NextRequest, NextResponse } from 'next/server';
import { WithId, Document } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabaseName, getMongoClient } from '@/lib/database';
import { resolveUserReferralCode } from '@/lib/referrals';

export const runtime = 'nodejs';

const uri = process.env.MONGODB_URI!;
const JWT_SECRET = process.env.JWT_SECRET || 'morpankh-saree-jwt-secret-key-2026';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  verified: boolean;
  mobile?: string;
  alternateMobile?: string;
  address?: string;
  city?: string;
  pincode?: string;
  createdAt: Date;
  referral_code?: string;
  referred_by?: string;
  has_used_referral?: boolean;
}

// Simple JWT token generation
function generateToken(payload: { id: string; email: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64').replace(/=/g, '');
  const payloadWithExp = { ...payload, exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) }; // 7 days
  const payloadB64 = Buffer.from(JSON.stringify(payloadWithExp)).toString('base64').replace(/=/g, '');
  const signature = Buffer.from(`${header}.${payloadB64}`).toString('base64').replace(/=/g, '');
  
  return `${header}.${payloadB64}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const client = await getMongoClient(uri);
    const db = client.db(getDatabaseName());
    const users = db.collection<User>('users');

    // Find user by email
    const user = await users.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate referral code if user doesn't have one
    if (!user.referral_code) {
      const existingCodeDocs = await users.find({}).project<{ referral_code?: string | null }>({ referral_code: 1, _id: 0 }).toArray();
      const existingCodes = existingCodeDocs
        .map((entry) => entry.referral_code)
        .filter((code): code is string => typeof code === 'string' && code.trim().length > 0);
      const referralCode = resolveUserReferralCode(undefined, existingCodes);
      await users.updateOne(
        { id: user.id },
        { $set: { referral_code: referralCode } }
      );
      user.referral_code = referralCode;
    }

    // Generate simple JWT token
    const token = generateToken({ id: user.id, email: user.email });

    // Remove sensitive fields from user data
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Login failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
