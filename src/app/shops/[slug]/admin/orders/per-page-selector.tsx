'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

// ============================================
// PerPageSelector - Select items per page
// Saves preference to localStorage for persistence
// ============================================

const PER_PAGE_OPTIONS = [20, 50, 100, 200] as const;
type PerPageOption = typeof PER_PAGE_OPTIONS[number];

const STORAGE_KEY = 'orders_per_page';

interface PerPageSelectorProps {
  currentPerPage: number;
}

export function PerPageSelector({ currentPerPage }: PerPageSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const hasInitialized = useRef(false);

  // On mount, check if stored value differs from URL and redirect if needed
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const stored = localStorage.getItem(STORAGE_KEY);
    const urlPerPage = searchParams.get('perPage');
    
    // If there's a stored value and URL doesn't have perPage set
    if (stored && !urlPerPage) {
      const storedValue = parseInt(stored);
      if (PER_PAGE_OPTIONS.includes(storedValue as PerPageOption) && storedValue !== 20) {
        // Apply stored value to URL
        const params = new URLSearchParams(searchParams.toString());
        params.set('perPage', stored);
        router.replace(`${pathname}?${params.toString()}`);
      }
    }
  }, [pathname, router, searchParams]);

  const handleSelect = (value: PerPageOption) => {
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, value.toString());
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('perPage', value.toString());
    params.delete('page'); // Reset to page 1
    
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <span>הצג:</span>
        <span className="font-medium text-gray-900">{currentPerPage}</span>
        <svg 
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown - opens upward */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[80px]">
            {PER_PAGE_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={`w-full px-4 py-2 text-sm text-center hover:bg-gray-50 transition-colors cursor-pointer ${
                  currentPerPage === option ? 'bg-gray-100 font-medium' : ''
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Helper to get perPage from localStorage (for initial server render)
export function getPerPageFromStorage(): number {
  if (typeof window === 'undefined') return 20;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && PER_PAGE_OPTIONS.includes(parseInt(stored) as PerPageOption)) {
    return parseInt(stored);
  }
  return 20;
}

