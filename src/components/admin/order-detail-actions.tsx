'use client';

import { useState, useRef, useEffect } from 'react';
import { fulfillOrder, cancelOrder, refundOrder } from '@/lib/actions/orders';

interface OrderDetailActionsProps {
  orderId: string;
  storeSlug: string;
  fulfillmentStatus: string;
  financialStatus: string;
  status: string;
}

export function OrderDetailActions({ 
  orderId, 
  storeSlug, 
  fulfillmentStatus, 
  financialStatus,
  status 
}: OrderDetailActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleFulfill = async () => {
    if (loading) return;
    setLoading('fulfill');
    try {
      await fulfillOrder(orderId, storeSlug);
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    if (loading) return;
    if (!confirm('האם אתה בטוח שברצונך לבטל את ההזמנה?')) return;
    setLoading('cancel');
    try {
      await cancelOrder(orderId, storeSlug);
    } finally {
      setLoading(null);
      setShowDropdown(false);
    }
  };

  const handleRefund = async () => {
    if (loading) return;
    if (!confirm('האם אתה בטוח שברצונך להחזיר את התשלום?')) return;
    setLoading('refund');
    try {
      await refundOrder(orderId, storeSlug);
    } finally {
      setLoading(null);
      setShowDropdown(false);
    }
  };

  const isCancelled = status === 'cancelled';
  const isRefunded = financialStatus === 'refunded';
  const isFulfilled = fulfillmentStatus === 'fulfilled';

  return (
    <div className="flex items-center gap-2">
      {/* More Actions Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="19" cy="12" r="1"/>
            <circle cx="5" cy="12" r="1"/>
          </svg>
        </button>
        
        {showDropdown && (
          <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-50">
            {!isCancelled && !isRefunded && (
              <button
                onClick={handleCancel}
                disabled={loading === 'cancel'}
                className="w-full px-4 py-2 text-sm text-right text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {loading === 'cancel' ? 'מבטל...' : 'בטל הזמנה'}
              </button>
            )}
            {financialStatus === 'paid' && !isRefunded && (
              <button
                onClick={handleRefund}
                disabled={loading === 'refund'}
                className="w-full px-4 py-2 text-sm text-right text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {loading === 'refund' ? 'מחזיר...' : 'החזר תשלום'}
              </button>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setShowDropdown(false);
              }}
              className="w-full px-4 py-2 text-sm text-right text-gray-700 hover:bg-gray-50 transition-colors"
            >
              העתק קישור
            </button>
          </div>
        )}
      </div>

      {/* Print Button */}
      <button 
        onClick={handlePrint}
        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 9V2h12v7"/>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
        הדפס
      </button>

      {/* Fulfill Button */}
      {!isFulfilled && !isCancelled && (
        <button 
          onClick={handleFulfill}
          disabled={loading === 'fulfill'}
          className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {loading === 'fulfill' ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              מעדכן...
            </>
          ) : (
            'שלח לחברת משלוחים'
          )}
        </button>
      )}
    </div>
  );
}

interface FulfillButtonProps {
  orderId: string;
  storeSlug: string;
  fulfillmentStatus: string;
  status: string;
}

export function FulfillButton({ orderId, storeSlug, fulfillmentStatus, status }: FulfillButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleFulfill = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fulfillOrder(orderId, storeSlug);
    } finally {
      setLoading(false);
    }
  };

  if (fulfillmentStatus === 'fulfilled' || status === 'cancelled') {
    return null;
  }

  return (
    <button 
      onClick={handleFulfill}
      disabled={loading}
      className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
    >
      {loading ? 'משלח...' : 'שלח פריטים'}
    </button>
  );
}

