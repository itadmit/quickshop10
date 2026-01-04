'use client';

import { useState, useTransition } from 'react';
import { fulfillOrder, cancelOrder, refundOrder } from '@/lib/actions/orders';
import { printOrder } from '@/lib/print-order';

interface OrderActionsProps {
  orderId: string;
  storeSlug: string;
  fulfillmentStatus: string;
  financialStatus: string;
  status: string;
}

export function OrderActions({ orderId, storeSlug, fulfillmentStatus, financialStatus, status }: OrderActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showMenu, setShowMenu] = useState(false);

  const handlePrint = () => {
    // הדפסה ישירה דרך API - לא מעביר עמוד
    printOrder(storeSlug, orderId);
  };

  const handleFulfill = () => {
    startTransition(async () => {
      await fulfillOrder(orderId, storeSlug);
    });
  };

  const handleCancel = () => {
    if (confirm('האם אתה בטוח שברצונך לבטל את ההזמנה?')) {
      startTransition(async () => {
        await cancelOrder(orderId, storeSlug);
        setShowMenu(false);
      });
    }
  };

  const handleRefund = () => {
    if (confirm('האם אתה בטוח שברצונך להחזיר את התשלום?')) {
      startTransition(async () => {
        await refundOrder(orderId, storeSlug);
        setShowMenu(false);
      });
    }
  };

  const isCancelled = status === 'cancelled';
  const isFulfilled = fulfillmentStatus === 'fulfilled';
  const isPaid = financialStatus === 'paid';

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handlePrint}
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 9V2h12v7"/>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
        הדפס
      </button>
      
      {!isCancelled && !isFulfilled && (
        <button 
          onClick={handleFulfill}
          disabled={isPending}
          className="px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'מעדכן...' : 'שלח לחברת משלוחים'}
        </button>
      )}

      {/* More Actions Menu */}
      <div className="relative">
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="19" cy="12" r="1"/>
            <circle cx="5" cy="12" r="1"/>
          </svg>
        </button>

        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
              <button
                onClick={handlePrint}
                className="w-full px-4 py-2 text-sm text-right text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 9V2h12v7"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                הדפס הזמנה
              </button>
              
              <button
                onClick={() => {
                  window.open(`mailto:?subject=הזמנה%20מחנות&body=פרטי%20ההזמנה`);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-sm text-right text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                שלח אישור ללקוח
              </button>

              <div className="border-t border-gray-100 my-1" />

              {!isCancelled && isPaid && (
                <button
                  onClick={handleRefund}
                  disabled={isPending}
                  className="w-full px-4 py-2 text-sm text-right text-amber-600 hover:bg-amber-50 flex items-center gap-2 disabled:opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                  </svg>
                  החזר תשלום
                </button>
              )}

              {!isCancelled && (
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  className="w-full px-4 py-2 text-sm text-right text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  בטל הזמנה
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Fulfill Items Button Component
interface FulfillItemsButtonProps {
  orderId: string;
  storeSlug: string;
  fulfillmentStatus: string;
}

export function FulfillItemsButton({ orderId, storeSlug, fulfillmentStatus }: FulfillItemsButtonProps) {
  const [isPending, startTransition] = useTransition();

  if (fulfillmentStatus === 'fulfilled') {
    return null;
  }

  const handleFulfill = () => {
    startTransition(async () => {
      await fulfillOrder(orderId, storeSlug);
    });
  };

  return (
    <button 
      onClick={handleFulfill}
      disabled={isPending}
      className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
    >
      {isPending ? 'מעדכן...' : 'שלח פריטים'}
    </button>
  );
}

