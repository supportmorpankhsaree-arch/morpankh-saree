import { NextRequest, NextResponse } from 'next/server';
import { getWebsiteSettings, updateWebsiteSettings } from '@/lib/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAdminRequest(request: NextRequest) {
  const auth = (request.headers.get('authorization') || '').trim();
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token === 'admin-token';
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getWebsiteSettings();
    return NextResponse.json({
      maintenanceMode: settings.maintenanceMode,
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    console.error('Error getting settings:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    if (typeof body.maintenanceMode === 'undefined') {
      return NextResponse.json({ error: 'maintenanceMode is required' }, { status: 400 });
    }

    const updated = await updateWebsiteSettings(Boolean(body.maintenanceMode), body.updatedBy);
    return NextResponse.json({
      maintenanceMode: updated.maintenanceMode,
      updatedBy: updated.updatedBy,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
