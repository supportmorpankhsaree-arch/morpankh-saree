import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, InvalidAdminEmailOtpError, verifyAdminEmailOtp } from '@/lib/adminOtp';
import { createAdminSession, getAdminSessionCookieName } from '@/lib/adminSession';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (typeof email !== 'string' || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'A valid email and six-digit OTP are required' },
        { status: 400 }
      );
    }

    const envAdminEmail = getAdminEmail();
    if (!envAdminEmail) {
      return NextResponse.json(
        { error: 'Admin credentials are not configured on the server' },
        { status: 500 }
      );
    }

    const inputEmail = email.trim().toLowerCase();
    if (inputEmail !== envAdminEmail) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await verifyAdminEmailOtp(otp);

    const sessionToken = await createAdminSession(inputEmail);
    const response = NextResponse.json({
      message: 'Admin login successful',
      token: 'admin-token',
      user: {
        id: 'admin',
        name: 'Admin',
        email: inputEmail,
        verified: true,
      },
    });
    response.cookies.set(getAdminSessionCookieName(), sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 60 * 60,
    });
    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: msg },
      { status: error instanceof InvalidAdminEmailOtpError ? 400 : 502 }
    );
  }
}
