import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseName, getMongoClient } from '@/lib/database';

export const runtime = 'nodejs';

const uri = process.env.MONGODB_URI!;

interface ForgotPasswordOTP {
  email: string;
  otp: string;
  expiry: Date;
  createdAt: Date;
  verified: boolean;
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

    const client = await getMongoClient(uri);
    const db = client.db(getDatabaseName());
    const forgotPasswordOtps = db.collection<ForgotPasswordOTP>('forgot_password_otps');

    // Find valid OTP
    const otpRecord = await forgotPasswordOtps.findOne({
      email,
      otp,
      expiry: { $gt: new Date() }, // OTP not expired
      verified: false, // Not already verified
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    await forgotPasswordOtps.updateOne(
      { _id: otpRecord._id },
      { $set: { verified: true } }
    );

    return NextResponse.json({
      message: 'OTP verified successfully',
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to verify OTP: ${errorMsg}` },
      { status: 500 }
    );
  }
}
