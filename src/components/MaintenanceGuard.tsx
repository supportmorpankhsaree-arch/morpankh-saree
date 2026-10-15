"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Client-side cache for website settings to avoid spamming the endpoint on page transitions
let cachedSettings: { maintenanceMode: boolean; timestamp: number } | null = null;
const CACHE_TTL = 10000; // 10 seconds client-side cache

/**
 * Update/Revalidate settings cache immediately after admin operations
 */
export function updateClientSettingsCache(maintenanceMode: boolean) {
  cachedSettings = {
    maintenanceMode,
    timestamp: Date.now()
  };
}

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAdmin = pathname?.startsWith('/admin');
    const isMaintenancePage = pathname === '/maintenance';
    const isApi = pathname?.startsWith('/api');

    if (isAdmin || isMaintenancePage || isApi) {
      setLoading(false);
      return;
    }

    async function checkMaintenance() {
      try {
        const now = Date.now();
        // Check cache validity
        if (cachedSettings && (now - cachedSettings.timestamp < CACHE_TTL)) {
          if (cachedSettings.maintenanceMode) {
            router.replace('/maintenance');
          } else {
            setLoading(false);
          }
          return;
        }

        // Fetch fresh settings
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          cachedSettings = {
            maintenanceMode: !!data.maintenanceMode,
            timestamp: Date.now()
          };

          if (data.maintenanceMode) {
            router.replace('/maintenance');
            return;
          }
        }
      } catch (err) {
        console.error('Failed to check maintenance mode status:', err);
      }
      setLoading(false);
    }

    checkMaintenance();
  }, [pathname, router]);

  const isAdmin = pathname?.startsWith('/admin');
  const isMaintenancePage = pathname === '/maintenance';
  const isApi = pathname?.startsWith('/api');

  // Block rendering of public pages while the initial loading/check is happening
  if (loading && !isAdmin && !isMaintenancePage && !isApi) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading Morpankh...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
