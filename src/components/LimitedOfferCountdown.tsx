"use client";

import { useState, useEffect } from 'react';

interface LimitedOfferCountdownProps {
  endDate?: string;
  message?: string;
  compact?: boolean;
  horizontal?: boolean;
  onExpire?: () => void;
}

const LimitedOfferCountdown = ({ endDate, message, compact = false, horizontal = false, onExpire }: LimitedOfferCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft(null);
        if (onExpire) onExpire();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endDate, onExpire]);

  if (isExpired || !timeLeft) return null;

  const isEndingSoon = timeLeft.days === 0 && timeLeft.hours < 24;
  const isCritical = timeLeft.days === 0 && timeLeft.hours < 1;

  // Horizontal compact mode for product details (badge + countdown on same row)
  if (horizontal) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-gray-600">⏳ Ends In</span>
        <div className="flex gap-1">
          {timeLeft.days > 0 && (
            <div className={`rounded px-1.5 py-0.5 text-center min-w-[28px] ${isCritical ? 'bg-red-500 text-white' : isEndingSoon ? 'bg-red-100 border-red-400' : 'bg-gradient-to-br from-green-100 to-green-50 border-green-300'} border shadow-sm`}>
              <span className={`text-xs font-bold ${isCritical ? 'text-white' : isEndingSoon ? 'text-red-600' : 'text-green-700'}`}>
                {String(timeLeft.days).padStart(2, '0')}D
              </span>
            </div>
          )}
          <div className={`rounded px-1.5 py-0.5 text-center min-w-[28px] ${isCritical ? 'bg-red-500 text-white' : isEndingSoon ? 'bg-red-100 border-red-400' : 'bg-gradient-to-br from-green-100 to-green-50 border-green-300'} border shadow-sm`}>
            <span className={`text-xs font-bold ${isCritical ? 'text-white' : isEndingSoon ? 'text-red-600' : 'text-green-700'}`}>
              {String(timeLeft.hours).padStart(2, '0')}H
            </span>
          </div>
          <div className={`rounded px-1.5 py-0.5 text-center min-w-[28px] ${isCritical ? 'bg-red-500 text-white' : isEndingSoon ? 'bg-red-100 border-red-400' : 'bg-gradient-to-br from-green-100 to-green-50 border-green-300'} border shadow-sm`}>
            <span className={`text-xs font-bold ${isCritical ? 'text-white' : isEndingSoon ? 'text-red-600' : 'text-green-700'}`}>
              {String(timeLeft.minutes).padStart(2, '0')}M
            </span>
          </div>
          <div className={`rounded px-1.5 py-0.5 text-center min-w-[28px] ${isCritical ? 'bg-red-500 text-white animate-pulse' : isEndingSoon ? 'bg-red-100 border-red-400' : 'bg-gradient-to-br from-green-100 to-green-50 border-green-300'} border shadow-sm`}>
            <span className={`text-xs font-bold ${isCritical ? 'text-white' : isEndingSoon ? 'text-red-600' : 'text-green-700'}`}>
              {String(timeLeft.seconds).padStart(2, '0')}S
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex gap-1.5 flex-wrap">
        {timeLeft.days > 0 && (
          <div className={`rounded-lg p-1.5 text-center min-w-[32px] ${isCritical ? 'bg-red-500 text-white' : isEndingSoon ? 'bg-red-100 border-red-400' : 'bg-gradient-to-br from-orange-100 to-orange-50 border-orange-300'} border shadow-sm`}>
            <div className={`text-sm font-bold ${isCritical ? 'text-white' : isEndingSoon ? 'text-red-600' : 'text-orange-700'}`}>
              {String(timeLeft.days).padStart(2, '0')}
            </div>
            <div className={`text-[8px] font-medium ${isCritical ? 'text-white/80' : isEndingSoon ? 'text-red-500' : 'text-orange-600'}`}>
              D
            </div>
          </div>
        )}
        <div className={`rounded-lg p-1.5 text-center min-w-[32px] ${isCritical ? 'bg-red-500 text-white' : isEndingSoon ? 'bg-red-100 border-red-400' : 'bg-gradient-to-br from-orange-100 to-orange-50 border-orange-300'} border shadow-sm`}>
          <div className={`text-sm font-bold ${isCritical ? 'text-white' : isEndingSoon ? 'text-red-600' : 'text-orange-700'}`}>
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <div className={`text-[8px] font-medium ${isCritical ? 'text-white/80' : isEndingSoon ? 'text-red-500' : 'text-orange-600'}`}>
            H
          </div>
        </div>
        <div className={`rounded-lg p-1.5 text-center min-w-[32px] ${isCritical ? 'bg-red-500 text-white' : isEndingSoon ? 'bg-red-100 border-red-400' : 'bg-gradient-to-br from-orange-100 to-orange-50 border-orange-300'} border shadow-sm`}>
          <div className={`text-sm font-bold ${isCritical ? 'text-white' : isEndingSoon ? 'text-red-600' : 'text-orange-700'}`}>
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <div className={`text-[8px] font-medium ${isCritical ? 'text-white/80' : isEndingSoon ? 'text-red-500' : 'text-orange-600'}`}>
            M
          </div>
        </div>
        <div className={`rounded-lg p-1.5 text-center min-w-[32px] ${isCritical ? 'bg-red-500 text-white animate-pulse' : isEndingSoon ? 'bg-red-100 border-red-400' : 'bg-gradient-to-br from-orange-100 to-orange-50 border-orange-300'} border shadow-sm`}>
          <div className={`text-sm font-bold ${isCritical ? 'text-white' : isEndingSoon ? 'text-red-600' : 'text-orange-700'}`}>
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <div className={`text-[8px] font-medium ${isCritical ? 'text-white/80' : isEndingSoon ? 'text-red-500' : 'text-orange-600'}`}>
            S
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {message && (
        <div className={`text-sm font-semibold ${isCritical ? 'text-red-600 animate-pulse' : isEndingSoon ? 'text-red-600' : 'text-orange-600'}`}>
          🔥 {message}
        </div>
      )}
      <div className="text-sm font-semibold text-gray-700">
        Offer Ends In
      </div>
      <div className="flex gap-2 flex-wrap">
        {timeLeft.days > 0 && (
          <div className={`rounded-xl p-3 text-center min-w-[70px] ${isCritical ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : isEndingSoon ? 'bg-gradient-to-br from-red-100 to-red-50 border-red-400' : 'bg-gradient-to-br from-orange-100 to-orange-50 border-orange-300'} border shadow-md`}>
            <div className={`text-2xl font-bold ${isCritical ? 'text-white' : isEndingSoon ? 'text-red-600' : 'text-orange-700'}`}>
              {String(timeLeft.days).padStart(2, '0')}
            </div>
            <div className={`text-xs font-semibold ${isCritical ? 'text-white/90' : isEndingSoon ? 'text-red-500' : 'text-orange-600'}`}>
              Days
            </div>
          </div>
        )}
        <div className={`rounded-xl p-3 text-center min-w-[70px] ${isCritical ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : isEndingSoon ? 'bg-gradient-to-br from-red-100 to-red-50 border-red-400' : 'bg-gradient-to-br from-orange-100 to-orange-50 border-orange-300'} border shadow-md`}>
          <div className={`text-2xl font-bold ${isCritical ? 'text-white' : isEndingSoon ? 'text-red-600' : 'text-orange-700'}`}>
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <div className={`text-xs font-semibold ${isCritical ? 'text-white/90' : isEndingSoon ? 'text-red-500' : 'text-orange-600'}`}>
            Hours
          </div>
        </div>
        <div className={`rounded-xl p-3 text-center min-w-[70px] ${isCritical ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : isEndingSoon ? 'bg-gradient-to-br from-red-100 to-red-50 border-red-400' : 'bg-gradient-to-br from-orange-100 to-orange-50 border-orange-300'} border shadow-md`}>
          <div className={`text-2xl font-bold ${isCritical ? 'text-white' : isEndingSoon ? 'text-red-600' : 'text-orange-700'}`}>
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <div className={`text-xs font-semibold ${isCritical ? 'text-white/90' : isEndingSoon ? 'text-red-500' : 'text-orange-600'}`}>
            Min
          </div>
        </div>
        <div className={`rounded-xl p-3 text-center min-w-[70px] ${isCritical ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse' : isEndingSoon ? 'bg-gradient-to-br from-red-100 to-red-50 border-red-400' : 'bg-gradient-to-br from-orange-100 to-orange-50 border-orange-300'} border shadow-md`}>
          <div className={`text-2xl font-bold ${isCritical ? 'text-white' : isEndingSoon ? 'text-red-600' : 'text-orange-700'}`}>
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <div className={`text-xs font-semibold ${isCritical ? 'text-white/90' : isEndingSoon ? 'text-red-500' : 'text-orange-600'}`}>
            Sec
          </div>
        </div>
      </div>
      {isEndingSoon && (
        <div className={`text-xs font-bold ${isCritical ? 'text-red-600 animate-pulse' : 'text-red-600'}`}>
          {isCritical ? '⚡ Hurry! Offer Ending Very Soon!' : '🔥 Hurry! Offer Ending Soon'}
        </div>
      )}
    </div>
  );
};

export default LimitedOfferCountdown;
