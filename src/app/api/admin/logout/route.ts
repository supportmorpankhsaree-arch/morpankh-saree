import { NextResponse } from 'next/server';
import { getAdminSessionCookieName } from '@/lib/adminSession';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ message: 'Admin logged out' });
  response.cookies.set(getAdminSessionCookieName(), '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}
