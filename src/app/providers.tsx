"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import AuthProvider from "@/components/AuthProvider";
import MaintenanceGuard from "@/components/MaintenanceGuard";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MaintenanceGuard>
          <TooltipProvider>
            <Toaster />
            {children}
          </TooltipProvider>
        </MaintenanceGuard>
      </AuthProvider>
    </QueryClientProvider>
  );
}
