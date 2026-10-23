import { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail, verifyAdminCredentials } from '@/lib/adminOtp';
import { createAdminSession, getAdminSessionCookieName } from '@/lib/adminSession';

export const runtime = 'nodejs';

const SESSION_DURATION_SECONDS = 8 * 60 * 60;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const credentialStatus = await verifyAdminCredentials(email, password);
    if (credentialStatus === 'misconfigured') {
      return NextResponse.json(
        { error: 'Admin credentials are not configured on the server' },
        { status: 500 }
      );
    }

    if (credentialStatus !== 'valid') {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    const adminEmail = getAdminEmail();
    const sessionToken = await createAdminSession(adminEmail);
    const response = NextResponse.json({
      message: 'Admin login successful',
      token: 'admin-token',
      user: {
        id: 'admin',
        name: 'Admin',
        email: adminEmail,
        verified: true,
      },
    });
    response.cookies.set(getAdminSessionCookieName(), sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    });
    return response;
  } catch (error) {
    console.error('Admin login failed:', error);
    const message = error instanceof Error ? error.message : 'Unable to complete admin login';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
