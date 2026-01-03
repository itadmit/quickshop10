'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type PeriodOption = {
  value: string;
  label: string;
  getRange: () => { from: string; to: string };
};

const periodOptions: PeriodOption[] = [
  {
    value: 'today',
    label: 'היום',
    getRange: () => {
      const today = new Date().toISOString().split('T')[0];
      return { from: today, to: today };
    },
  },
  {
    value: 'yesterday',
    label: 'אתמול',
    getRange: () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      return { from: yesterday, to: yesterday };
    },
  },
  {
    value: '7d',
    label: 'השבוע',
    getRange: () => {
      const to = new Date().toISOString().split('T')[0];
      const from = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      return { from, to };
    },
  },
  {
    value: '30d',
    label: 'החודש',
    getRange: () => {
      const to = new Date().toISOString().split('T')[0];
      const from = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      return { from, to };
    },
  },
  {
    value: '90d',
    label: '90 יום',
    getRange: () => {
      const to = new Date().toISOString().split('T')[0];
      const from = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
      return { from, to };
    },
  },
  {
    value: '6m',
    label: 'חצי שנה',
    getRange: () => {
      const to = new Date().toISOString().split('T')[0];
      const from = new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0];
      return { from, to };
    },
  },
  {
    value: '1y',
    label: 'שנה',
    getRange: () => {
      const to = new Date().toISOString().split('T')[0];
      const from = new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0];
      return { from, to };
    },
  },
];

function formatDateHebrew(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('he-IL', { 
    day: 'numeric', 
    month: 'short',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
}

export function DateRangePicker({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current selection from URL
  const currentPeriod = searchParams.get('period') || '30d';
  const customFrom = searchParams.get('from');
  const customTo = searchParams.get('to');

  // Custom date inputs
  const [customFromDate, setCustomFromDate] = useState(customFrom || '');
  const [customToDate, setCustomToDate] = useState(customTo || '');

  // Find current option
  const currentOption = periodOptions.find(o => o.value === currentPeriod);
  const isCustom = currentPeriod === 'custom' || (customFrom && customTo);

  // Display label
  const displayLabel = isCustom && customFrom && customTo
    ? `${formatDateHebrew(customFrom)} - ${formatDateHebrew(customTo)}`
    : currentOption?.label || 'החודש';

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowCustom(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPeriod = (option: PeriodOption) => {
    const params = new URLSearchParams();
    params.set('period', option.value);
    router.push(`${basePath}?${params.toString()}`);
    setIsOpen(false);
    setShowCustom(false);
  };

  const handleApplyCustom = () => {
    if (!customFromDate || !customToDate) return;
    
    const params = new URLSearchParams();
    params.set('period', 'custom');
    params.set('from', customFromDate);
    params.set('to', customToDate);
    router.push(`${basePath}?${params.toString()}`);
    setIsOpen(false);
    setShowCustom(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-sm hover:border-gray-300 transition-colors min-w-[140px]"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="flex-1 text-right">{displayLabel}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-50 min-w-[200px]">
          {!showCustom ? (
            <>
              {/* Quick Options */}
              <div className="py-1">
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelectPeriod(option)}
                    className={`w-full px-4 py-2 text-sm text-right hover:bg-gray-50 transition-colors ${
                      currentPeriod === option.value ? 'bg-gray-50 font-medium' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Custom Option */}
              <button
                onClick={() => setShowCustom(true)}
                className={`w-full px-4 py-2 text-sm text-right hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                  isCustom ? 'bg-gray-50 font-medium' : ''
                }`}
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                תאריך מותאם
              </button>
            </>
          ) : (
            /* Custom Date Picker */
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setShowCustom(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium">תאריך מותאם</span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">מתאריך</label>
                  <input
                    type="date"
                    value={customFromDate}
                    onChange={(e) => setCustomFromDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:border-black focus:outline-none"
                    max={customToDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">עד תאריך</label>
                  <input
                    type="date"
                    value={customToDate}
                    onChange={(e) => setCustomToDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:border-black focus:outline-none"
                    min={customFromDate}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <button
                onClick={handleApplyCustom}
                disabled={!customFromDate || !customToDate}
                className="w-full py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                החל
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

