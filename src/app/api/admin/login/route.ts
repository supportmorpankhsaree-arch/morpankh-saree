import { NextRequest, NextResponse } from 'next/server';
import { sendAdminEmailOtp, verifyAdminCredentials } from '@/lib/adminOtp';

export const runtime = 'nodejs';

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

    const otpEmail = await sendAdminEmailOtp();
    return NextResponse.json({ message: 'OTP sent to admin email', requiresOtp: true, email: otpEmail });
  } catch (error) {
    console.error('Admin login OTP email failed:', error);
    const msg = error instanceof Error ? error.message : 'Unable to send OTP email';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
