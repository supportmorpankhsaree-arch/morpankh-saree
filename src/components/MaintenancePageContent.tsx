"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Hammer, ShieldAlert } from 'lucide-react';
import { updateClientSettingsCache } from '@/components/MaintenanceGuard';

export default function MaintenancePageContent() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Check immediately on mount in case they loaded this page while maintenance is off
    const checkImmediately = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (!data.maintenanceMode) {
            updateClientSettingsCache(false);
            router.replace('/');
          }
        }
      } catch (err) {
        console.error('Maintenance verification failed', err);
      }
    };
    checkImmediately();

    // Periodically poll the settings API every 5 seconds to automatically restore access
    const interval = setInterval(async () => {
      setChecking(true);
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (!data.maintenanceMode) {
            updateClientSettingsCache(false);
            router.replace('/');
          }
        }
      } catch (err) {
        console.error('Error polling settings', err);
      } finally {
        setChecking(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-white p-4 relative overflow-hidden select-none">
      {/* Dynamic Background Peacock Feather/Aura Effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-500/[0.05] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#d4af37]/[0.05] blur-[120px] pointer-events-none" />

      {/* Decorative Traditional Indian Symmetrical Pattern (Golden Ring) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full border-[10px] border-dashed border-[#d4af37] animate-[spin_120s_linear_infinite]" />
      </div>

      <div className="w-full max-w-lg z-10">
        {/* Glassmorphic Settings Card */}
        <div className="bg-gradient-to-br from-[#0a2e2b]/95 via-[#041c1a]/95 to-[#010908]/95 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-2xl shadow-2xl relative text-center">
          {/* Top Decorative line */}
          <div className="h-1.5 w-32 bg-gradient-to-r from-emerald-500 via-[#d4af37] to-emerald-500 rounded-full mx-auto mb-6" />

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/favicon.png" alt="Morpankh Saree Logo" className="h-14 w-auto object-contain drop-shadow-[0_2px_8px_rgba(212,175,55,0.3)]" />
          </div>

          {/* Animated Maintenance Icon */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md animate-ping" />
            <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-[#0a2e2b] to-[#041c1a] border border-[#d4af37]/40 flex items-center justify-center shadow-lg relative">
              <Hammer className="h-7 w-7 text-[#d4af37] animate-[bounce_2s_infinite]" />
            </div>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-4 w-4 text-[#d4af37] animate-pulse" />
            </div>
          </div>

          <h1
            className="text-2xl md:text-[2.1rem] font-extrabold bg-gradient-to-r from-white via-slate-100 to-[#d4af37] bg-clip-text text-transparent mt-1 mb-5 break-words overflow-visible"
            style={{
              fontFamily: "'Noto Sans Devanagari', 'Mukta', 'Hind', sans-serif",
              lineHeight: 1.25,
              letterSpacing: 0,
            }}
          >
            वेबसाइट देखभालीसाठी तात्पुरती बंद आहे
          </h1>

          <div
            className="space-y-4 text-slate-300 text-sm md:text-base leading-relaxed"
            style={{ fontFamily: "'Noto Sans Devanagari', 'Mukta', 'Hind', sans-serif" }}
          >
            <p className="font-semibold text-white/90">
              आपला खरेदीचा अनुभव अधिक चांगला करण्यासाठी आम्ही सध्या नियोजित देखभाल (Scheduled Maintenance) करत आहोत.
            </p>
            <p>
              आमची वेबसाइट लवकरच पुन्हा सुरू होईल.
            </p>
            <p className="text-xs text-slate-400 font-light pt-2">
              आपल्या संयमाबद्दल आणि सहकार्याबद्दल मनःपूर्वक धन्यवाद.
            </p>
          </div>

          {/* Auto Reconnect Status indicator */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-[#d4af37]/80">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75 ${checking ? 'bg-emerald-500' : ''}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 bg-[#d4af37] ${checking ? 'bg-emerald-500' : ''}`} />
            </span>
            <span style={{ fontFamily: "'Noto Sans Devanagari', 'Mukta', 'Hind', sans-serif" }}>थेट स्थिती तपासत आहे...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
