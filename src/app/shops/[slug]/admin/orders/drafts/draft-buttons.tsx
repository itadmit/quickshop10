'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { completeDraft, deleteDraft } from './actions';

interface DraftOrderButtonsProps {
  draftId: string;
  slug: string;
}

export function DraftOrderButtons({ draftId, slug }: DraftOrderButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showMenu, setShowMenu] = useState(false);

  const handleComplete = () => {
    if (confirm('להמיר את הטיוטה להזמנה? הפעולה לא ניתנת לביטול.')) {
      startTransition(async () => {
        const result = await completeDraft(draftId, slug);
        if (result.success) {
          router.refresh();
        }
      });
    }
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (confirm('למחוק את הטיוטה? הפעולה לא ניתנת לביטול.')) {
      startTransition(async () => {
        const result = await deleteDraft(draftId, slug);
        if (result.success) {
          router.refresh();
        }
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
          <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-20 min-w-[160px]">
            <button
              onClick={handleComplete}
              className="w-full px-4 py-2 text-sm text-right text-green-600 hover:bg-green-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12l5 5L20 7"/>
              </svg>
              המר להזמנה
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-sm text-right text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              מחק טיוטה
            </button>
          </div>
        </>
      )}
    </div>
  );
}




