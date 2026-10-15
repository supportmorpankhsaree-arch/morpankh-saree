"use client";

import { useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

type HomepagePopupProps = {
  open: boolean;
  imageUrl: string | null;
  loading: boolean;
  onClose: () => void;
};

const HomepagePopup = ({ open, imageUrl, loading, onClose }: HomepagePopupProps) => {
  useEffect(() => {
    if (!open) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || !imageUrl) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
        role="presentation"
      />
      <div className="relative z-10 flex items-center justify-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-3 -top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition hover:bg-white"
          aria-label="Close popup"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
        ) : (
          <img
            src={imageUrl}
            alt="Promotional popup"
            loading="lazy"
            decoding="async"
            className="max-h-[90vh] max-w-[90vw] w-auto h-auto object-contain sm:max-h-[90vh] sm:max-w-[90vw]"
            style={{ maxWidth: '95vw', maxHeight: '95vh' }}
          />
        )}
      </div>
    </div>
  );
};

export default HomepagePopup;
