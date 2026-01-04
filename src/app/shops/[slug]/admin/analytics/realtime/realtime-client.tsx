'use client';

/**
 * Realtime Client Component
 * 
 * MINIMAL client code - only handles:
 * 1. Auto-refresh every 30 seconds
 * 2. Manual refresh button
 * 
 * All heavy rendering is done in Server Component (parent)
 */

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

interface RealtimeRefreshProps {
  refreshInterval?: number; // seconds
}

export function RealtimeRefresh({ refreshInterval = 30 }: RealtimeRefreshProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [countdown, setCountdown] = useState(refreshInterval);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Auto-refresh timer
  useEffect(() => {
    if (!isAutoRefresh) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Refresh the page (Server Component re-renders)
          startTransition(() => {
            router.refresh();
          });
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoRefresh, refreshInterval, router]);

  const handleManualRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
    setCountdown(refreshInterval);
  };

  return (
    <div className="flex items-center gap-4">
      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        <span className="text-sm text-gray-500">
          {isPending ? 'מתעדכן...' : `עדכון בעוד ${countdown}ש`}
        </span>
      </div>

      {/* Auto-refresh toggle */}
      <button
        onClick={() => setIsAutoRefresh(!isAutoRefresh)}
        className={`text-xs px-2 py-1 rounded ${
          isAutoRefresh 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        {isAutoRefresh ? 'אוטומטי' : 'מושהה'}
      </button>

      {/* Manual refresh */}
      <button
        onClick={handleManualRefresh}
        disabled={isPending}
        className="text-xs px-3 py-1 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
      >
        רענן עכשיו
      </button>
    </div>
  );
}

/**
 * Animated counter for live metrics
 */
export function AnimatedNumber({ value, className = '' }: { value: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    // Animate from current to new value
    const diff = value - displayValue;
    if (diff === 0) return;

    const steps = 10;
    const stepValue = diff / steps;
    let current = displayValue;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += stepValue;
      setDisplayValue(Math.round(current));
      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [value]);

  return <span className={className}>{displayValue.toLocaleString('he-IL')}</span>;
}


