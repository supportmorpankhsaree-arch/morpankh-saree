"use client";

import { Product } from '@/data/mockData';
import LimitedOfferCountdown from '@/components/LimitedOfferCountdown';

interface LimitedOfferSectionProps {
  product: Product;
  compact?: boolean;
  horizontal?: boolean;
}

const LimitedOfferSection = ({ product, compact = false, horizontal = false }: LimitedOfferSectionProps) => {
  // Don't show if not a limited offer or if expired
  if (!product.isLimitedOffer || product.limitedOfferExpired || product.isPrebooking) {
    return null;
  }

  if (horizontal) {
    // Horizontal layout for product details page
    return (
      <div className="space-y-2">
        {/* First row: Badge + Countdown */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Limited Offer Badge */}
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full border border-orange-300">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-bold uppercase tracking-wide">🔥 Limited Offer</span>
          </div>

          {/* Countdown Timer - Compact horizontal */}
          {product.limitedOfferEndDate ? (
            <LimitedOfferCountdown
              endDate={product.limitedOfferEndDate}
              message={product.limitedOfferMessage || 'Limited Time Offer!'}
              compact={true}
              horizontal={true}
            />
          ) : (
            <div className="text-sm text-orange-600 font-medium">
              ⚠️ Offer end date not set
            </div>
          )}
        </div>

        {/* Second row: Stock and urgency message */}
        <div className="space-y-1">
          {/* Remaining Stock */}
          {product.limitedStock && (
            <div className="flex items-center gap-1 text-sm font-bold text-orange-700">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Only {product.limitedStock} left in stock!
            </div>
          )}

          {/* Urgency Message */}
          {product.limitedOfferMessage && (
            <div className="flex items-center gap-1 text-sm font-medium text-orange-600">
              <span>🚨</span>
              {product.limitedOfferMessage}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Limited Offer Badge */}
      <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full border border-orange-300">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        <span className="text-sm font-bold uppercase tracking-wide">🔥 Limited Offer</span>
      </div>

      {/* Countdown Timer - Always show if limited offer is enabled */}
      {product.limitedOfferEndDate ? (
        <LimitedOfferCountdown
          endDate={product.limitedOfferEndDate}
          message={product.limitedOfferMessage || 'Limited Time Offer!'}
          compact={compact}
        />
      ) : (
        <div className="text-sm text-orange-600 font-medium">
          ⚠️ Offer end date not set
        </div>
      )}

      {/* Remaining Stock */}
      {product.limitedStock && (
        <div className="flex items-center gap-1 text-sm font-bold text-orange-700">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          Only {product.limitedStock} left in stock!
        </div>
      )}

      {/* Urgency Message */}
      {product.limitedOfferMessage && (
        <div className="flex items-center gap-1 text-sm font-medium text-orange-600">
          <span>🚨</span>
          {product.limitedOfferMessage}
        </div>
      )}
    </div>
  );
};

export default LimitedOfferSection;
