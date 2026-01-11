'use client';

import { useState } from 'react';
import { Bell, Send, X, AlertCircle, TrendingUp } from 'lucide-react';
import { sendNotificationsForProduct } from '../../waitlist/actions';
import Link from 'next/link';

interface WaitlistItem {
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string | null;
  variantTitle: string | null;
  count: number;
  isOutOfStock: boolean;
}

interface WaitlistAlertsProps {
  items: WaitlistItem[];
  storeId: string;
  storeSlug: string;
  basePath: string;
}

export function WaitlistAlerts({ items, storeId, storeSlug, basePath }: WaitlistAlertsProps) {
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const handleSendNotifications = async (item: WaitlistItem) => {
    const itemId = `${item.productId}-${item.variantId || 'simple'}`;
    
    if (!confirm(`האם לשלוח התראות ל-${item.count} לקוחות?`)) {
      return;
    }

    setSendingId(itemId);
    try {
      const result = await sendNotificationsForProduct(
        storeId,
        item.productId,
        item.variantId,
        storeSlug
      );

      if (result.success) {
        alert(`✅ נשלחו ${result.count} הודעות בהצלחה!`);
        setDismissedIds(prev => new Set([...prev, itemId]));
      } else {
        alert(`❌ ${result.error}`);
      }
    } catch (error) {
      alert('אירעה שגיאה בשליחת ההתראות');
    } finally {
      setSendingId(null);
    }
  };

  const handleDismiss = (item: WaitlistItem) => {
    const itemId = `${item.productId}-${item.variantId || 'simple'}`;
    setDismissedIds(prev => new Set([...prev, itemId]));
  };

  const visibleItems = items.filter(item => {
    const itemId = `${item.productId}-${item.variantId || 'simple'}`;
    return !dismissedIds.has(itemId);
  });

  const inStockItems = visibleItems.filter(item => !item.isOutOfStock);
  const outOfStockItems = visibleItems.filter(item => item.isOutOfStock);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {/* In Stock - Ready to Notify */}
      {inStockItems.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="bg-green-100 rounded-full p-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 mb-1">
                מוצרים חזרו למלאי! 🎉
              </h3>
              <p className="text-sm text-green-700">
                {inStockItems.length} מוצרים עם רשימת המתנה חזרו למלאי. שלח התראות ללקוחות!
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {inStockItems.map((item) => {
              const itemId = `${item.productId}-${item.variantId || 'simple'}`;
              const isSending = sendingId === itemId;

              return (
                <div
                  key={itemId}
                  className="bg-white rounded-lg p-3 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`${basePath}/admin/products/${item.productId}`}
                      className="font-medium text-green-900 hover:text-green-700 truncate block"
                    >
                      {item.productName}
                    </Link>
                    {item.variantTitle && (
                      <p className="text-sm text-green-600 truncate">
                        {item.variantTitle}
                      </p>
                    )}
                    <p className="text-xs text-green-600 mt-1">
                      <Bell className="w-3 h-3 inline mr-1" />
                      {item.count} ממתינים
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSendNotifications(item)}
                      disabled={isSending}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                    >
                      {isSending ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          שולח...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          שלח ({item.count})
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDismiss(item)}
                      className="text-green-600 hover:text-green-800 p-2"
                      title="סגור התראה"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Out of Stock - Info Only */}
      {outOfStockItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="bg-blue-100 rounded-full p-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                מוצרים שאזלו עם רשימת המתנה
              </h3>
              <p className="text-sm text-blue-700">
                {outOfStockItems.length} מוצרים עם לקוחות שמחכים
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {outOfStockItems.map((item) => {
              const itemId = `${item.productId}-${item.variantId || 'simple'}`;

              return (
                <div
                  key={itemId}
                  className="bg-white rounded-lg p-3 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`${basePath}/admin/products/${item.productId}`}
                      className="font-medium text-blue-900 hover:text-blue-700 truncate block"
                    >
                      {item.productName}
                    </Link>
                    {item.variantTitle && (
                      <p className="text-sm text-blue-600 truncate">
                        {item.variantTitle}
                      </p>
                    )}
                    <p className="text-xs text-blue-600 mt-1">
                      <Bell className="w-3 h-3 inline mr-1" />
                      {item.count} ממתינים
                    </p>
                  </div>

                  <button
                    onClick={() => handleDismiss(item)}
                    className="text-blue-600 hover:text-blue-800 p-2"
                    title="סגור התראה"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

