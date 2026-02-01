'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleTaxRate, deleteTaxRate } from './actions';

interface TaxRateButtonsProps {
  rateId: string;
  slug: string;
  isActive: boolean;
}

export function TaxRateButtons({ rateId, slug, isActive }: TaxRateButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showMenu, setShowMenu] = useState(false);

  const handleToggle = () => {
    startTransition(async () => {
      await toggleTaxRate(rateId, slug, !isActive);
      router.refresh();
    });
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (confirm('למחוק את שיעור המס?')) {
      startTransition(async () => {
        await deleteTaxRate(rateId, slug);
        router.refresh();
      });
    }
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isPending}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
      >
        {isPending ? (
          <svg className="w-5 h-5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        ) : (
          <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="6" r="2"/>
            <circle cx="12" cy="12" r="2"/>
            <circle cx="12" cy="18" r="2"/>
          </svg>
        )}
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-20 min-w-[140px]">
            <button
              onClick={handleToggle}
              className="w-full px-4 py-2 text-sm text-right hover:bg-gray-50 flex items-center gap-2"
            >
              {isActive ? (
                <>
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                  השבת
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  הפעל
                </>
              )}
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-sm text-right text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              מחק
            </button>
          </div>
        </>
      )}
    </div>
  );
}











