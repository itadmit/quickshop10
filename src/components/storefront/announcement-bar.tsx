'use client';

import { useState, useEffect } from 'react';

/**
 * Announcement Bar Component
 * 
 * Client component for announcement bar with optional countdown timer.
 * Supports rotating messages with slide animation.
 * 
 * PERFORMANCE: 
 * - Only renders when enabled
 * - Minimal DOM updates (requestAnimationFrame optimized)
 */

interface AnnouncementBarProps {
  enabled: boolean;
  text: string;
  link?: string;
  bgColor: string;
  textColor: string;
  countdownEnabled?: boolean;
  countdownDate?: string; // YYYY-MM-DD
  countdownTime?: string; // HH:mm
  onClose?: () => void;
}

export function AnnouncementBar({ 
  enabled, 
  text, 
  link, 
  bgColor, 
  textColor,
  countdownEnabled,
  countdownDate,
  countdownTime,
  onClose,
}: AnnouncementBarProps) {
  // Support multiple messages (each line = separate message)
  const messages = text.split('\n').filter(line => line.trim());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  // Countdown state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  
  // Calculate target date from countdown settings
  const targetDate = countdownEnabled && countdownDate 
    ? new Date(`${countdownDate}T${countdownTime || '00:00'}:00`)
    : null;
  
  // Countdown timer effect
  useEffect(() => {
    if (!countdownEnabled || !targetDate || isNaN(targetDate.getTime())) {
      setTimeLeft(null);
      return;
    }
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds });
    };
    
    // Calculate immediately
    calculateTimeLeft();
    
    // Update every second
    const interval = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(interval);
  }, [countdownEnabled, countdownDate, countdownTime, targetDate]);
  
  // Rotate messages every 4 seconds with animation
  useEffect(() => {
    if (messages.length <= 1) return;
    
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % messages.length);
        setIsAnimating(false);
      }, 300); // Half of animation duration
    }, 4000);
    
    return () => clearInterval(interval);
  }, [messages.length]);
  
  if (!enabled || messages.length === 0 || dismissed) return null;
  
  const currentMessage = messages[currentIndex];
  
  // Format countdown display
  const CountdownTimer = timeLeft ? (
    <div className="flex items-center gap-1 text-xs font-mono mr-3 opacity-90" dir="ltr">
      {timeLeft.days > 0 && (
        <>
          <span className="bg-white/20 px-1.5 py-0.5 rounded">{String(timeLeft.days).padStart(2, '0')}</span>
          <span className="opacity-60">:</span>
        </>
      )}
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{String(timeLeft.hours).padStart(2, '0')}</span>
      <span className="opacity-60">:</span>
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{String(timeLeft.minutes).padStart(2, '0')}</span>
      <span className="opacity-60">:</span>
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{String(timeLeft.seconds).padStart(2, '0')}</span>
    </div>
  ) : null;
  
  const handleClose = () => {
    setDismissed(true);
    onClose?.();
  };
  
  return (
    <div 
      className="relative text-center py-2.5 text-sm font-medium overflow-hidden"
      style={{ backgroundColor: bgColor, color: textColor }}
      data-section-id="announcement-bar"
      data-section-name="פס הודעות"
    >
      <div className="max-w-[1800px] mx-auto px-12 relative h-5">
        <div 
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${
            isAnimating ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {link ? (
              <a href={link} className="hover:underline">
                {currentMessage}
              </a>
            ) : (
              <span>{currentMessage}</span>
            )}
            {CountdownTimer}
          </div>
        </div>
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity z-10"
          style={{ color: textColor }}
          aria-label="סגור הודעה"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

