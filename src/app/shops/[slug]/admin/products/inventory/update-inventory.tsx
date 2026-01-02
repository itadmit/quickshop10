'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateInventory } from './actions';

interface UpdateInventoryButtonProps {
  itemId: string;
  itemName: string;
  currentInventory: number;
  isVariant: boolean;
}

export function UpdateInventoryButton({ itemId, itemName, currentInventory, isVariant }: UpdateInventoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [newInventory, setNewInventory] = useState(currentInventory.toString());
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inventory = parseInt(newInventory);
    if (isNaN(inventory) || inventory < 0) return;

    startTransition(async () => {
      await updateInventory(itemId, inventory, isVariant);
      setIsOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        title="עדכן מלאי"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-right">
              <h2 className="text-lg font-bold text-gray-900 mb-4">עדכון מלאי</h2>
              <p className="text-sm text-gray-600 mb-4">{itemName}</p>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    כמות במלאי
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newInventory}
                    onChange={(e) => setNewInventory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-center text-lg font-medium"
                    autoFocus
                  />
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setNewInventory(String(Math.max(0, parseInt(newInventory || '0') - 1)))}
                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 font-medium"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewInventory(String(parseInt(newInventory || '0') + 1))}
                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 font-medium"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewInventory(String(parseInt(newInventory || '0') + 10))}
                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 font-medium"
                  >
                    +10
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {isPending ? 'שומר...' : 'עדכן'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

