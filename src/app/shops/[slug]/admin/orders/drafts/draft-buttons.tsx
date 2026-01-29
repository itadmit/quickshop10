'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { completeDraft, deleteDraft } from './actions';
import { Mail, Truck, Bell, Package, CheckCircle2, X } from 'lucide-react';

interface DraftOrderButtonsProps {
  draftId: string;
  slug: string;
}

export function DraftOrderButtons({ draftId, slug }: DraftOrderButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showMenu, setShowMenu] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [executePostActions, setExecutePostActions] = useState(true);

  const handleComplete = () => {
    setShowMenu(false);
    setShowCompleteModal(true);
  };

  const confirmComplete = () => {
    startTransition(async () => {
      const result = await completeDraft(draftId, slug, {
        executePostActions,
      });
      if (result.success) {
        setShowCompleteModal(false);
        router.refresh();
      }
    });
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
    <>
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

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCompleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <button
              onClick={() => setShowCompleteModal(false)}
              className="absolute left-4 top-4 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold text-gray-900 mb-4">המר להזמנה</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="executePostActions"
                  checked={executePostActions}
                  onChange={(e) => setExecutePostActions(e.target.checked)}
                  className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                />
                <label htmlFor="executePostActions" className="cursor-pointer flex-1">
                  <span className="font-medium text-gray-900">בצע פעולות אחרי הזמנה</span>
                  <p className="text-sm text-gray-500 mt-0.5">
                    כמו בהזמנה רגילה מהחנות
                  </p>
                </label>
              </div>

              {/* Actions breakdown */}
              {executePostActions && (
                <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span>שליחת מייל אישור ללקוח</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Truck className="w-4 h-4 text-green-500" />
                    <span>שליחה אוטומטית לחברת משלוחים</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Bell className="w-4 h-4 text-orange-500" />
                    <span>הפעלת אוטומציות (SMS, Webhooks)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="w-4 h-4 text-purple-500" />
                    <span>עדכון מלאי</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                    <span>תיעוד לסטטיסטיקות ו-tracking</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={confirmComplete}
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isPending ? 'ממיר...' : 'המר להזמנה'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}






