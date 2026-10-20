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
    console.warn('[Settings] Failed to retrieve settings, defaulting to maintenanceMode: false', error);
    return NextResponse.json({
      maintenanceMode: false,
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  }
}
