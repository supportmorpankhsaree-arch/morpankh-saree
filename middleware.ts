import { NextRequest, NextResponse } from 'next/server';
import {
  getAdminSessionCookieName,
  isAdminSessionConfigured,
  verifyAdminSession,
} from '@/lib/adminSession';

// Simple in-memory cache for maintenance status to avoid Redis calls on every request
let maintenanceCache: { maintenanceMode: boolean; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds server-side cache

// Routes that should never redirect to maintenance
const EXCLUDED_PATHS = [
  '/maintenance',
  '/admin',
  '/api/admin',
  '/api/auth/login',
  '/api/settings',
];

// Check if path should be excluded from maintenance redirect
function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PATHS.some(excluded => pathname.startsWith(excluded));
}

// Fetch maintenance status from API
async function getMaintenanceStatus(): Promise<boolean> {
  const now = Date.now();
  
  // Check cache first
  if (maintenanceCache && (now - maintenanceCache.timestamp < CACHE_TTL)) {
    return maintenanceCache.maintenanceMode;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/settings`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-store' },
    });

    if (response.ok) {
      const data = await response.json();
      maintenanceCache = {
        maintenanceMode: !!data.maintenanceMode,
        timestamp: now,
      };
      return maintenanceCache.maintenanceMode;
    }
  } catch (error) {
    console.error('[Middleware] Error fetching maintenance status:', error);
  }

  // Default to false if we can't fetch status
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/admin/')) {
    const isLoginRoute = [
      '/api/admin/login',
      '/api/admin/request-otp',
      '/api/admin/verify-otp',
      '/api/admin/logout',
    ].includes(pathname);

    if (!isLoginRoute) {
      if (!isAdminSessionConfigured()) {
        return NextResponse.json(
          { error: 'Admin session security is not configured on the server' },
          { status: 500 }
        );
      }

      const session = request.cookies.get(getAdminSessionCookieName())?.value;
      if (!(await verifyAdminSession(session))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
  }

  // Skip maintenance check for excluded paths
  if (isExcludedPath(pathname)) {
    return NextResponse.next();
  }

  // Get maintenance status
  const isMaintenance = await getMaintenanceStatus();

  // If maintenance mode is off, allow normal access
  if (!isMaintenance) {
    return NextResponse.next();
  }

  // Handle API routes during maintenance
  if (pathname.startsWith('/api/')) {
    // Return 503 for public APIs
    return NextResponse.json(
      {
        success: false,
        maintenance: true,
        message: 'Website is under maintenance.',
      },
      { status: 503 }
    );
  }

  // Redirect all public routes to maintenance page
  const maintenanceUrl = new URL('/maintenance', request.url);
  return NextResponse.redirect(maintenanceUrl);
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
