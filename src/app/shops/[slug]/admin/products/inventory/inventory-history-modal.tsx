'use client';

import { useState, useEffect, useTransition } from 'react';
import { getInventoryHistory } from './actions';

interface InventoryHistoryModalProps {
  itemId: string;
  itemName: string;
  isVariant: boolean;
}

// Reason labels in Hebrew
const reasonLabels: Record<string, string> = {
  manual: 'עדכון ידני',
  order: 'הזמנה',
  restock: 'הכנסת מלאי',
  adjustment: 'התאמה',
  return: 'החזרה',
};

// Format date and time in Hebrew
function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function InventoryHistoryModal({ itemId, itemName, isVariant }: InventoryHistoryModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<Array<{
    id: string;
    previousQuantity: number;
    newQuantity: number;
    changeAmount: number;
    reason: string;
    note: string | null;
    changedByName: string | null;
    createdAt: Date;
  }>>([]);
  const [isPending, startTransition] = useTransition();
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load history when modal opens
  useEffect(() => {
    if (isOpen && !hasLoaded) {
      startTransition(async () => {
        const result = await getInventoryHistory(itemId, isVariant);
        setLogs(result.logs);
        setHasLoaded(true);
      });
    }
  }, [isOpen, hasLoaded, itemId, isVariant]);

  // Reset when modal closes
  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* History Icon Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
        title="היסטוריית מלאי"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />
          
          {/* Modal Content */}
          <div 
            className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">היסטוריית מלאי</h2>
                <p className="text-sm text-gray-500 mt-0.5">{itemName}</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {isPending ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="w-6 h-6 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span className="mr-2 text-gray-500">טוען...</span>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">אין היסטוריית שינויים</p>
                  <p className="text-gray-400 text-xs mt-1">שינויים עתידיים יופיעו כאן</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute top-2 bottom-2 right-[7px] w-0.5 bg-gray-200" />
                  
                  {/* Timeline items */}
                  <div className="space-y-4">
                    {logs.map((log, index) => (
                      <div key={log.id} className="relative flex gap-3">
                        {/* Timeline dot */}
                        <div className={`relative z-10 w-4 h-4 rounded-full shrink-0 mt-1 ${
                          log.changeAmount > 0 
                            ? 'bg-green-500' 
                            : log.changeAmount < 0 
                              ? 'bg-red-500' 
                              : 'bg-gray-400'
                        }`} />
                        
                        {/* Content */}
                        <div className="flex-1 bg-gray-50 rounded-lg p-3 min-w-0">
                          {/* Change info */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium text-sm ${
                              log.changeAmount > 0 
                                ? 'text-green-600' 
                                : log.changeAmount < 0 
                                  ? 'text-red-600' 
                                  : 'text-gray-600'
                            }`}>
                              {log.changeAmount > 0 ? '+' : ''}{log.changeAmount}
                            </span>
                            <span className="text-gray-400 text-xs">•</span>
                            <span className="text-gray-600 text-sm">
                              {log.previousQuantity} → {log.newQuantity}
                            </span>
                            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded">
                              {reasonLabels[log.reason] || log.reason}
                            </span>
                          </div>
                          
                          {/* Note if exists */}
                          {log.note && (
                            <p className="text-xs text-gray-500 mt-1">{log.note}</p>
                          )}
                          
                          {/* Meta info */}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                            <span>{formatDateTime(new Date(log.createdAt))}</span>
                            {log.changedByName && (
                              <>
                                <span>•</span>
                                <span>{log.changedByName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

