'use client';

import { useState, useTransition } from 'react';
import { updateOrderNote } from '@/lib/actions/orders';

interface OrderNotesProps {
  orderId: string;
  storeSlug: string;
  initialNote: string | null;
}

export function OrderNotes({ orderId, storeSlug, initialNote }: OrderNotesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState(initialNote || '');
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      await updateOrderNote(orderId, note, storeSlug);
      setIsEditing(false);
    });
  };

  const handleCancel = () => {
    setNote(initialNote || '');
    setIsEditing(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">הערות</h3>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            ערוך
          </button>
        )}
      </div>
      <div className="px-5 py-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="הוסף הערה פנימית..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isPending ? 'שומר...' : 'שמור'}
              </button>
            </div>
          </div>
        ) : (
          initialNote ? (
            <p className="text-sm text-gray-700">{initialNote}</p>
          ) : (
            <p className="text-sm text-gray-400">אין הערות</p>
          )
        )}
      </div>
    </div>
  );
}






