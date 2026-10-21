import { NextRequest, NextResponse } from 'next/server';
import { sendAdminEmailOtp, verifyAdminCredentials } from '@/lib/adminOtp';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const credentialStatus = await verifyAdminCredentials(body?.email, body?.password);

    if (credentialStatus === 'misconfigured') {
      return NextResponse.json(
        { error: 'Admin credentials are not configured on the server' },
        { status: 500 }
      );
    }
    if (credentialStatus !== 'valid') {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    const email = await sendAdminEmailOtp();
    return NextResponse.json({ message: 'OTP sent to admin email', email });
  } catch (error) {
    console.error('Unable to send admin login OTP email:', error);
    const message = error instanceof Error ? error.message : 'Unable to send OTP email';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
