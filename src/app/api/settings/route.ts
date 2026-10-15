import { NextRequest, NextResponse } from 'next/server';
import { getWebsiteSettings } from '@/lib/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const settings = await getWebsiteSettings();
    return NextResponse.json({
      maintenanceMode: settings.maintenanceMode,
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    console.error('Error getting public settings:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
