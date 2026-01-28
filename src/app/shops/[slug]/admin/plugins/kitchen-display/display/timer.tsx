'use client';

import { useEffect, useState, memo } from 'react';
import { Clock } from 'lucide-react';

// ============================================
// Kitchen Display Timer Component
// Client Component - נדרש עבור setInterval
// Shows elapsed time since order creation
// ============================================

interface TimerProps {
  createdAt: Date | string;
  className?: string;
}

function TimerComponent({ createdAt, className = '' }: TimerProps) {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    const startTime = new Date(createdAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.floor((now - startTime) / 1000);

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setElapsed(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <span className={`font-mono font-bold flex items-center gap-1 ${className}`}>
      <Clock className="w-4 h-4 opacity-60" />
      <span>{elapsed}</span>
    </span>
  );
}

// Memoize to prevent unnecessary re-renders
export const Timer = memo(TimerComponent);

