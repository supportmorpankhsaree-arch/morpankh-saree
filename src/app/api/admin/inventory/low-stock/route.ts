import { NextRequest, NextResponse } from 'next/server';
import { fetchLowStockProducts, LowStockQueryParams } from '@/lib/lowStock';

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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isDashboard = searchParams.get('dashboard') === 'true';

    const params: LowStockQueryParams = {
      search: searchParams.get('search')?.trim() || undefined,
      category: searchParams.get('category')?.trim() || undefined,
      status: (searchParams.get('status')?.trim() as 'critical' | 'low') || undefined,
      sortBy: (searchParams.get('sortBy')?.trim() as LowStockQueryParams['sortBy']) || undefined,
    };

    if (isDashboard) {
      params.limit = 10;
    } else {
      params.page = Math.max(1, Number(searchParams.get('page')) || 1);
      params.pageSize = Math.max(1, Math.min(100, Number(searchParams.get('pageSize')) || 20));
    }

    const result = await fetchLowStockProducts(params);

    return NextResponse.json({
      success: true,
      data: result.products,
      pagination: result.pagination
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    console.error('Error fetching low stock:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
