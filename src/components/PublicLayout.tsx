'use client';

import { ReactNode, useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import RecentOrdersToast from './RecentOrdersToast';
import { ArrowUp, Youtube } from 'lucide-react';

const PublicLayout = ({ children }: { children: ReactNode }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">{children}</main>

      <Footer />

      <style>{`
        @keyframes floatAttention {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulseRing {
          0% { transform: scale(0.95); opacity: 0.55; }
          70% { transform: scale(1.35); opacity: 0; }
          100% { transform: scale(1.35); opacity: 0; }
        }
        .floating-action {
          animation: floatAttention 2.6s ease-in-out infinite;
        }
        .floating-action:hover {
          animation-play-state: paused;
        }
        .floating-action:hover .floating-ring {
          animation-play-state: paused;
        }
        .floating-ring {
          animation: pulseRing 2.2s ease-out infinite;
        }
      `}</style>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="floating-action relative h-12 w-12 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-2xl border-2 border-white/40 transition-all duration-300 hover:scale-115 active:scale-90"
            title="Back to Top"
          >
            <ArrowUp className="h-5 w-5 animate-pulse" />
          </button>
        )}

        <a
          href="https://api.whatsapp.com/send/?phone=919960621199&text&type=phone_number&app_absent=0"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="floating-action relative h-12 w-12 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95"
        >
          <img
            src="/wp_icon1.png"
            alt="WhatsApp"
            className="w-full h-full object-contain"
          />
        </a>

        <span
          aria-hidden="true"
          className="floating-action relative h-12 w-12 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95"
          style={{ background: '#FF0000', color: 'white' }}
        >
          <span
            className="floating-ring absolute inset-0 rounded-full"
            style={{ boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.55)' }}
          />
          <Youtube className="h-6 w-6" />
        </span>
      </div>

      <RecentOrdersToast />
    </div>
  );
};

export default PublicLayout;
