import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseName, getMongoClient } from '@/lib/database';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

const uri = process.env.MONGODB_URI!;

interface User {
  id: string;
  email: string;
  name: string;
}

interface ForgotPasswordOTP {
  email: string;
  otp: string;
  expiry: Date;
  createdAt: Date;
  verified: boolean;
}

async function sendPasswordResetOTP(email: string, otp: string, name: string) {
  try {
    console.log('📧 Attempting to send password reset OTP to:', email);

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '465'),
      secure: process.env.EMAIL_USE_SSL === 'true',
      auth: {
        user: process.env.EMAIL_HOST_USER,
        pass: process.env.EMAIL_HOST_PASSWORD,
      },
      logger: true,
      debug: true,
    });

    await transporter.verify();
    console.log('✓ SMTP connection verified successfully');

    const mailOptions = {
      from: `"Morpankh Saree" <${process.env.EMAIL_HOST_USER}>`,
      to: email,
      subject: 'Password Reset OTP - Morpankh Saree',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h2 style="margin: 0;">Password Reset Request</h2>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; margin-top: 20px;">
            <p style="color: #333; font-size: 16px;">Hello ${name},</p>
            <p style="color: #333; font-size: 16px;">Your OTP for password reset is:</p>
            <div style="background-color: #fff; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; border: 2px solid #667eea; border-radius: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 14px;">This OTP is valid for 5 minutes.</p>
            <p style="color: #999; font-size: 12px;">If you did not request this password reset, please ignore this email.</p>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
            <p>© 2026 Morpankh Saree. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Password reset OTP email sent successfully. Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('✗ Email sending failed:', errorMsg);
    throw new Error(`Failed to send OTP email: ${errorMsg}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const client = await getMongoClient(uri);
    const db = client.db(getDatabaseName());
    const users = db.collection<User>('users');
    const forgotPasswordOtps = db.collection<ForgotPasswordOTP>('forgot_password_otps');

    // Check if user exists
    const user = await users.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'User with this email does not exist' },
        { status: 404 }
      );
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing unverified OTPs for this email
    await forgotPasswordOtps.deleteMany({ 
      email, 
      verified: false 
    });

    // Store new OTP
    await forgotPasswordOtps.insertOne({
      email,
      otp,
      expiry: otpExpiry,
      createdAt: new Date(),
      verified: false,
    });

    // Send OTP email
    try {
      await sendPasswordResetOTP(email, otp, user.name);
      console.log(`✓ Password reset OTP ${otp} sent successfully to ${email}`);
    } catch (emailError) {
      console.error('✗ Failed to send OTP email:', emailError);
      const errorMsg = emailError instanceof Error ? emailError.message : 'Unknown email error';
      return NextResponse.json(
        { error: `Email sending failed: ${errorMsg}. Please contact support.` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'OTP sent successfully to your registered email',
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to send OTP: ${errorMsg}` },
      { status: 500 }
    );
  }
}
