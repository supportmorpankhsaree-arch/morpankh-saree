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

  useEffect(() => {
    const isAdmin = pathname?.startsWith('/admin');
    const isMaintenancePage = pathname === '/maintenance';
    const isApi = pathname?.startsWith('/api');

    if (isAdmin || isMaintenancePage || isApi) {
      return;
    }

    async function checkMaintenance() {
      try {
        const now = Date.now();
        // Check cache validity
        if (cachedSettings && (now - cachedSettings.timestamp < CACHE_TTL)) {
          if (cachedSettings.maintenanceMode) {
            router.replace('/maintenance');
          }
          return;
        }

        // Fetch fresh settings with 2.5s timeout so it never blocks or hangs
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch('/api/settings', { signal: controller.signal });
        clearTimeout(timeoutId);

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
        } else {
          cachedSettings = {
            maintenanceMode: false,
            timestamp: Date.now()
          };
        }
      } catch (err) {
        cachedSettings = {
          maintenanceMode: false,
          timestamp: Date.now()
        };
      }
    }

    checkMaintenance();
  }, [pathname, router]);

  return <>{children}</>;
}
