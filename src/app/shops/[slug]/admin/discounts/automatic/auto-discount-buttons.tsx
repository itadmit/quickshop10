'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleAutoDiscount, deleteAutoDiscount } from './actions';

// ============================================
// Toggle Auto Discount Button
// ============================================

interface ToggleAutoDiscountButtonProps {
  discountId: string;
  isActive: boolean;
}

export function ToggleAutoDiscountButton({ discountId, isActive }: ToggleAutoDiscountButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleAutoDiscount(discountId, !isActive);
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`p-1.5 rounded-lg transition-colors ${
        isActive 
          ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50' 
          : 'text-green-500 hover:text-green-600 hover:bg-green-50'
      } disabled:opacity-50`}
      title={isActive ? 'השהה הנחה' : 'הפעל הנחה'}
    >
      {isActive ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
    </button>
  );
}

// ============================================
// Delete Auto Discount Button
// ============================================

interface DeleteAutoDiscountButtonProps {
  discountId: string;
  discountName: string;
}

export function DeleteAutoDiscountButton({ discountId, discountName }: DeleteAutoDiscountButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteAutoDiscount(discountId);
      setIsOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="מחק הנחה"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsOpen(false)} dir="rtl">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md text-right" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">מחיקת הנחה אוטומטית</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    האם אתה בטוח שברצונך למחוק את ההנחה &quot;{discountName}&quot;?
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                פעולה זו בלתי הפיכה. ההנחה תוסר מהמערכת ולא תחול יותר על הזמנות.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isPending ? 'מוחק...' : 'כן, מחק'}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

