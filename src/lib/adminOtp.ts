import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import nodemailer from 'nodemailer';
import { getDatabaseName, getMongoClient } from '@/lib/database';

const OTP_LIFETIME_MS = 10 * 60 * 1000;

interface AdminOtpDocument {
  email: string;
  otpHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export class InvalidAdminEmailOtpError extends Error {}

function normalize(value: string) {
  const trimmed = value.trim();
  return trimmed.endsWith(',') ? trimmed.slice(0, -1) : trimmed;
}

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL ? normalize(process.env.ADMIN_EMAIL).toLowerCase() : '';
}

export async function verifyAdminCredentials(email: unknown, password: unknown) {
  const adminEmail = getAdminEmail();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return 'misconfigured' as const;
  }

  const inputEmail = typeof email === 'string' ? normalize(email).toLowerCase() : '';
  const inputPassword = typeof password === 'string' ? normalize(password) : '';

  let passwordMatches = inputPassword === normalize(adminPassword);
  if (
    !passwordMatches &&
    (adminPassword.startsWith('$2a$') || adminPassword.startsWith('$2b$'))
  ) {
    try {
      passwordMatches = await bcrypt.compare(inputPassword, adminPassword);
    } catch {
      passwordMatches = false;
    }
  }

  return inputEmail === adminEmail && passwordMatches ? 'valid' as const : 'invalid' as const;
}

function createEmailTransporter() {
  const host = (process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
  const port = Number(process.env.EMAIL_PORT || '465');
  const user = process.env.EMAIL_HOST_USER?.trim();
  const password = process.env.EMAIL_HOST_PASSWORD?.replace(/\s+/g, '');

  if (!user || !password || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Valid EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, and EMAIL_PORT settings are required to send admin OTP email');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.EMAIL_USE_SSL === 'true' || port === 465,
    auth: { user, pass: password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

async function getOtpCollection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not configured on the server');
  }

  const client = await getMongoClient(uri);
  return client.db(getDatabaseName()).collection<AdminOtpDocument>('admin_otps');
}

export async function sendAdminEmailOtp() {
  const email = getAdminEmail();
  if (!email) {
    throw new Error('ADMIN_EMAIL is not configured on the server');
  }

  const otp = randomInt(100_000, 1_000_000).toString();
  const expiresAt = new Date(Date.now() + OTP_LIFETIME_MS);
  const otpHash = await bcrypt.hash(otp, 10);
  const otpCollection = await getOtpCollection();

  await otpCollection.updateOne(
    { email },
    {
      $set: { otpHash, expiresAt },
      $setOnInsert: { email, createdAt: new Date() },
    },
    { upsert: true }
  );

  const transporter = createEmailTransporter();
  await transporter.sendMail({
    from: `"Morpankh Saree Admin" <${process.env.EMAIL_HOST_USER?.trim()}>`,
    to: email,
    subject: 'Your Morpankh Saree admin login code',
    text: `Your admin login verification code is ${otp}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
        <h2 style="margin: 0 0 12px;">Admin login verification</h2>
        <p>Enter this one-time code to finish signing in:</p>
        <p style="font-size: 30px; font-weight: 700; letter-spacing: 8px; padding: 14px; background: #f3f4f6; text-align: center; border-radius: 8px;">${otp}</p>
        <p style="color: #6b7280;">This code expires in 10 minutes. If you did not request it, ignore this email.</p>
      </div>
    `,
  });

  return email;
}

export async function verifyAdminEmailOtp(otp: string) {
  const email = getAdminEmail();
  const otpCollection = await getOtpCollection();
  const record = await otpCollection.findOne({ email });

  if (!record) {
    throw new InvalidAdminEmailOtpError('OTP not found. Request a new code and try again.');
  }
  if (record.expiresAt.getTime() <= Date.now()) {
    await otpCollection.deleteOne({ email });
    throw new InvalidAdminEmailOtpError('OTP expired. Request a new code and try again.');
  }
  if (!(await bcrypt.compare(otp, record.otpHash))) {
    throw new InvalidAdminEmailOtpError('Invalid OTP');
  }

  await otpCollection.deleteOne({ email });
}
