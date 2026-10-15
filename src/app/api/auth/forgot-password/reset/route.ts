import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseName, getMongoClient } from '@/lib/database';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

const uri = process.env.MONGODB_URI!;

interface User {
  id: string;
  email: string;
  password: string;
}

interface ForgotPasswordOTP {
  email: string;
  otp: string;
  expiry: Date;
  createdAt: Date;
  verified: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Email, OTP, and new password are required' },
        { status: 400 }
      );
    }

    // Password validation
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter' },
        { status: 400 }
      );
    }

    if (!/[a-z]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password must contain at least one lowercase letter' },
        { status: 400 }
      );
    }

    if (!/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number' },
        { status: 400 }
      );
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password must contain at least one special character' },
        { status: 400 }
      );
    }

    const client = await getMongoClient(uri);
    const db = client.db(getDatabaseName());
    const users = db.collection<User>('users');
    const forgotPasswordOtps = db.collection<ForgotPasswordOTP>('forgot_password_otps');

    // Find verified OTP
    const otpRecord = await forgotPasswordOtps.findOne({
      email,
      otp,
      verified: true,
      expiry: { $gt: new Date() }, // OTP not expired
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid, expired, or already used OTP' },
        { status: 400 }
      );
    }

    // Find user
    const user = await users.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password using the same method as registration (bcryptjs with salt rounds 12)
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await users.updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );

    // Delete the used OTP to prevent reuse
    await forgotPasswordOtps.deleteOne({ _id: otpRecord._id });

    // Delete any other pending OTPs for this email for security
    await forgotPasswordOtps.deleteMany({ email });

    console.log(`✓ Password reset successfully for user: ${email}`);

    return NextResponse.json({
      message: 'Password reset successfully',
    });

  } catch (error) {
    console.error('Reset password error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to reset password: ${errorMsg}` },
      { status: 500 }
    );
  }
}
