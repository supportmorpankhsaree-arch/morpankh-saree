import { NextRequest, NextResponse } from 'next/server';
import { WithId, Document } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getDatabaseName, getMongoClient } from '@/lib/database';
import nodemailer from 'nodemailer';
import { generateReferralCode, resolveUserReferralCode, validateReferralCode, createReferralRecord } from '@/lib/referrals';

export const runtime = 'nodejs';

const uri = process.env.MONGODB_URI!;

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  otp?: string;
  otpExpiry?: Date;
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

async function sendOTP(email: string, otp: string) {
  try {
    console.log('📧 Attempting to send OTP to:', email);
    console.log('SMTP Config - Host:', process.env.EMAIL_HOST, 'Port:', process.env.EMAIL_PORT, 'SSL:', process.env.EMAIL_USE_SSL);

    const host = (process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
    const port = parseInt(process.env.EMAIL_PORT || '465');
    const secure = process.env.EMAIL_USE_SSL === 'true' || port === 465;
    const user = process.env.EMAIL_HOST_USER?.trim();
    const pass = process.env.EMAIL_HOST_PASSWORD?.replace(/\s+/g, '');

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        servername: host,
        rejectUnauthorized: false,
      },
      logger: true,
      debug: true,
    });

    // Verify SMTP Connection
    await transporter.verify();
    console.log('✓ SMTP connection verified successfully');

    const mailOptions = {
      from: `"Morpankh Saree" <${process.env.EMAIL_HOST_USER}>`,
      to: email,
      subject: 'OTP for Account Verification - Morpankh Saree',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h2 style="margin: 0;">Welcome to Morpankh Saree!</h2>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; margin-top: 20px;">
            <p style="color: #333; font-size: 16px;">Your OTP for account verification is:</p>
            <div style="background-color: #fff; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; border: 2px solid #667eea; border-radius: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 14px;">This OTP will expire in 10 minutes.</p>
            <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
            <p>© 2026 Morpankh Saree. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ OTP email sent successfully. Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('✗ Email sending failed:', errorMsg);
    throw new Error(`Failed to send OTP email: ${errorMsg}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, referralCode } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const client = await getMongoClient(uri);
    const db = client.db(getDatabaseName());
    const users = db.collection<User>('users');

    // Check if user already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Validate referral code if provided
    let referrerId: string | undefined;
    if (referralCode && referralCode.trim()) {
      const validation = await validateReferralCode(referralCode.trim());
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || 'Invalid referral code' },
          { status: 400 }
        );
      }
      referrerId = validation.referrerId;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Generate unique referral code for new user
    const existingCodeDocs = await users.find({}).project<{ referral_code?: string | null }>({ referral_code: 1, _id: 0 }).toArray();
    const existingCodes = existingCodeDocs
      .map((entry) => entry.referral_code)
      .filter((code): code is string => typeof code === 'string' && code.trim().length > 0);
    const userReferralCode = resolveUserReferralCode(undefined, existingCodes);

    // Create user in database
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user: User = {
      id: userId,
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpiry,
      verified: false,
      createdAt: new Date(),
      referral_code: userReferralCode,
      referred_by: referrerId,
      has_used_referral: !!referrerId,
    };

    const result = await users.insertOne(user);
    console.log(` User created with ID: ${result.insertedId}`);

    // Create referral record if referral code was used
    if (referrerId) {
      const referralRecord = await createReferralRecord(referrerId, userId, referralCode.trim());
      if (referralRecord) {
        console.log(` Referral record created: ${referralRecord._id}`);
      } else {
        console.warn(` Failed to create referral record for user ${userId}`);
      }
    }

    // Send OTP email
    try {
      const emailResult = await sendOTP(email, otp);
      console.log(`✓ OTP ${otp} sent successfully to ${email}`);
    } catch (emailError) {
      console.error('✗ Failed to send OTP email:', emailError);
      const errorMsg = emailError instanceof Error ? emailError.message : 'Unknown email error';
      return NextResponse.json(
        {
          error: `Email sending failed: ${errorMsg}. Please contact support.`,
          userId: result.insertedId,
          note: 'User registered but email not sent',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'User registered successfully. Please check your email for OTP verification.',
      userId: result.insertedId,
    });

  } catch (error) {
    console.error('Registration error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Registration failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}