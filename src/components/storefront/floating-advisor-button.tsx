/**
 * Floating Advisor Button
 * כפתור צף שמוביל ליועץ החכם
 * 
 * ⚡ Performance:
 * - Data passed from Server Component (no client-side fetch!)
 * - CSS animations only (no JS animations)
 * - Dismissible with localStorage
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wand2, X, Sparkles } from 'lucide-react';

export interface AdvisorData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  primaryColor: string;
}

interface FloatingAdvisorButtonProps {
  storeSlug: string;
  storeId: string;
  advisors: AdvisorData[];
  basePath: string;
  position?: 'left' | 'right'; // Default: right
}

export function FloatingAdvisorButton({ storeSlug, storeId, advisors, basePath, position = 'right' }: FloatingAdvisorButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if dismissed in localStorage and show after short delay
  useEffect(() => {
    const dismissedKey = `advisor_dismissed_${storeId}`;
    if (localStorage.getItem(dismissedKey)) {
      setDismissed(true);
      return;
    }
    // Small delay for smooth entrance
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, [storeId]);

  if (advisors.length === 0 || dismissed) {
    return null;
  }

  const primaryColor = advisors[0]?.primaryColor || '#6366f1';

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsVisible(false);
    localStorage.setItem(`advisor_dismissed_${storeId}`, 'true');
    setTimeout(() => setDismissed(true), 300);
  };

  // Position classes based on setting
  const positionClass = position === 'left' ? 'left-6' : 'right-6';

  return (
    <div 
      className={`fixed bottom-6 ${positionClass} z-50 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-5 scale-95 pointer-events-none'
      }`}
      dir="rtl"
    >
      {advisors.length === 1 ? (
        // Single advisor - direct link
        <Link
          href={`${basePath}/advisor/${advisors[0].slug}`}
          className="group relative flex items-center gap-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute -top-2 -left-2 w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-900 z-10 cursor-pointer"
            aria-label="סגור"
          >
            <X className="h-3 w-3" />
          </button>
          
          {/* Button content */}
          <div className="flex items-center gap-3 px-5 py-3">
            <div className="relative">
              <Wand2 className="h-6 w-6 text-white" />
              <div className="absolute -top-1 -right-1 animate-pulse">
                <Sparkles className="h-3 w-3 text-yellow-300" />
              </div>
            </div>
            <span className="text-white font-medium text-sm whitespace-nowrap">
              {advisors[0].title}
            </span>
          </div>

          {/* Pulsing ring animation */}
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ backgroundColor: primaryColor }}
          />
        </Link>
      ) : (
        // Multiple advisors - show menu on click
        <>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="group relative flex items-center gap-3 px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute -top-2 -left-2 w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-900 z-10 cursor-pointer"
              aria-label="סגור"
            >
              <X className="h-3 w-3" />
            </button>
            
            <div className="relative">
              <Wand2 className="h-6 w-6 text-white" />
              <div className="absolute -top-1 -right-1 animate-pulse">
                <Sparkles className="h-3 w-3 text-yellow-300" />
              </div>
            </div>
            <span className="text-white font-medium text-sm">
              יועץ חכם
            </span>
          </button>

          {/* Advisors Menu */}
          {isOpen && (
            <div
              className="absolute bottom-full mb-2 left-0 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[200px] animate-in fade-in slide-in-from-bottom-2 duration-150"
            >
              {advisors.map((advisor, index) => (
                <Link
                  key={advisor.id}
                  href={`${basePath}/advisor/${advisor.slug}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  style={{ borderTop: index > 0 ? '1px solid #f3f4f6' : 'none' }}
                  onClick={() => setIsOpen(false)}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${advisor.primaryColor || primaryColor}20` }}
                  >
                    <Wand2 
                      className="h-4 w-4" 
                      style={{ color: advisor.primaryColor || primaryColor }} 
                    />
                  </div>
                  <div>
                    <span className="text-gray-900 font-medium text-sm block">
                      {advisor.title}
                    </span>
                    {advisor.description && (
                      <span className="text-gray-500 text-xs line-clamp-1">
                        {advisor.description}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
