'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { resetStore } from './actions';

// ============================================
// Advanced Settings Form - Client Component
// Contains destructive actions like reset store
// ============================================

interface AdvancedSettingsFormProps {
  storeSlug: string;
  storeName: string;
}

export function AdvancedSettingsForm({ storeSlug, storeName }: AdvancedSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleReset = () => {
    if (confirmText !== storeName) return;

    setMessage(null);
    startTransition(async () => {
      const result = await resetStore(storeSlug);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'החנות אופסה בהצלחה!' });
        setShowResetConfirm(false);
        setConfirmText('');
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.error || 'שגיאה באיפוס החנות' });
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">הגדרות מתקדמות</h2>
        <p className="text-sm text-gray-500 mt-1">
          פעולות מתקדמות לניהול החנות
        </p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Reset Store Section */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-red-900">איפוס חנות</h3>
            <p className="text-sm text-red-700 mt-1">
              פעולה זו תמחק את כל המוצרים, הקטגוריות, העמודים והסקשנים הקיימים ותיצור תוכן דמו חדש כמו ביצירת חנות חדשה.
            </p>
            <p className="text-sm text-red-600 font-medium mt-2">
              ⚠️ שימו לב: הזמנות ולקוחות לא יימחקו, אך כל תוכן החנות יאופס!
            </p>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              >
                אפס חנות
              </button>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-gray-700 mb-3">
                    לאישור האיפוס, הקלד את שם החנות: <strong>{storeName}</strong>
                  </p>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="הקלד את שם החנות..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    dir="ltr"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    disabled={confirmText !== storeName || isPending}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isPending ? 'מאפס...' : 'אשר איפוס'}
                  </button>
                  <button
                    onClick={() => {
                      setShowResetConfirm(false);
                      setConfirmText('');
                    }}
                    disabled={isPending}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Advanced Options Placeholder */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900">ייצוא וייבוא נתונים</h3>
        <p className="text-sm text-gray-500 mt-1">
          אפשרויות לייצוא וייבוא נתוני החנות יהיו זמינות בקרוב.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            disabled
            className="px-4 py-2 bg-gray-200 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed"
          >
            ייצוא מוצרים (CSV)
          </button>
          <button
            disabled
            className="px-4 py-2 bg-gray-200 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed"
          >
            ייבוא מוצרים (CSV)
          </button>
        </div>
      </div>
    </div>
  );
}

