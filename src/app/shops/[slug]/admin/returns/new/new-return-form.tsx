'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createReturnRequest } from '../actions';

// ============================================
// New Return Form - Client Component
// Minimal JS, fast interactions
// ============================================

interface OrderItem {
  id: string;
  name: string;
  variantTitle: string | null;
  quantity: number;
  price: string | null;
  imageUrl: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  total: string | null;
  createdAt: Date | null;
}

interface NewReturnFormProps {
  storeSlug: string;
  selectedOrder: Order | null;
  selectedOrderItems: OrderItem[];
  recentOrders: Order[];
}

const reasonLabels: Record<string, string> = {
  wrong_size: 'מידה לא מתאימה',
  defective: 'פגם במוצר',
  not_as_described: 'לא כמתואר',
  changed_mind: 'שינוי דעה',
  wrong_item: 'מוצר שגוי',
  damaged_shipping: 'נזק במשלוח',
  other: 'אחר',
};

const resolutionLabels: Record<string, string> = {
  exchange: 'החלפה',
  store_credit: 'זיכוי לחנות',
  refund: 'החזר כספי',
  partial_refund: 'החזר חלקי',
};

export function NewReturnForm({ storeSlug, selectedOrder, selectedOrderItems, recentOrders }: NewReturnFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // State
  const [step, setStep] = useState(selectedOrder ? 2 : 1);
  const [orderId, setOrderId] = useState(selectedOrder?.id || '');
  const [orderItems, setOrderItems] = useState<OrderItem[]>(selectedOrderItems);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [type, setType] = useState<'return' | 'exchange'>('return');
  const [reason, setReason] = useState<string>('changed_mind');
  const [resolution, setResolution] = useState<string>('store_credit');
  const [reasonDetails, setReasonDetails] = useState('');
  const [error, setError] = useState('');

  // Select order and fetch items
  const handleSelectOrder = async (order: Order) => {
    setOrderId(order.id);
    
    // Fetch items via URL change
    router.push(`/shops/${storeSlug}/admin/returns/new?orderId=${order.id}`);
  };

  // Toggle item selection
  const handleToggleItem = (itemId: string, maxQty: number) => {
    setSelectedItems(prev => {
      if (prev[itemId]) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: maxQty };
    });
  };

  // Change quantity
  const handleQuantityChange = (itemId: string, qty: number, maxQty: number) => {
    if (qty < 1 || qty > maxQty) return;
    setSelectedItems(prev => ({ ...prev, [itemId]: qty }));
  };

  // Submit
  const handleSubmit = () => {
    if (Object.keys(selectedItems).length === 0) {
      setError('יש לבחור לפחות פריט אחד');
      return;
    }

    setError('');
    startTransition(async () => {
      const items = Object.entries(selectedItems).map(([orderItemId, quantity]) => ({
        orderItemId,
        quantity,
      }));

      const result = await createReturnRequest({
        storeSlug,
        orderId,
        type,
        reason: reason as 'wrong_size' | 'defective' | 'not_as_described' | 'changed_mind' | 'wrong_item' | 'damaged_shipping' | 'other',
        requestedResolution: resolution as 'exchange' | 'store_credit' | 'refund' | 'partial_refund',
        items,
        reasonDetails: reasonDetails || undefined,
      });

      if (result.success) {
        router.push(`/shops/${storeSlug}/admin/returns/${result.requestId}`);
      } else {
        setError(result.error || 'אירעה שגיאה');
      }
    });
  };

  // Calculate total
  const totalValue = Object.entries(selectedItems).reduce((sum, [itemId, qty]) => {
    const item = orderItems.find(i => i.id === itemId);
    return sum + (Number(item?.price || 0) * qty);
  }, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Step 1: Select Order */}
      {step === 1 && (
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">בחר הזמנה</h2>
          
          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">אין הזמנות זמינות להחזרה</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentOrders.map(order => (
                <button
                  key={order.id}
                  onClick={() => handleSelectOrder(order)}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-right cursor-pointer"
                >
                  <div>
                    <span className="font-medium text-gray-900">#{order.orderNumber}</span>
                    <span className="text-gray-500 text-sm mr-3">
                      {order.customerName || order.customerEmail || 'אורח'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-900 font-medium">₪{Number(order.total || 0).toFixed(2)}</span>
                    {order.createdAt && (
                      <span className="text-gray-400 text-sm">
                        {new Date(order.createdAt).toLocaleDateString('he-IL')}
                      </span>
                    )}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Items & Details */}
      {step === 2 && selectedOrder && (
        <div className="p-6">
          {/* Order Info */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">הזמנה #{selectedOrder.orderNumber}</h2>
              <p className="text-sm text-gray-500">
                {selectedOrder.customerName || selectedOrder.customerEmail || 'אורח'}
              </p>
            </div>
            <button
              onClick={() => router.push(`/shops/${storeSlug}/admin/returns/new`)}
              className="text-sm text-gray-500 hover:text-gray-700 underline cursor-pointer"
            >
              שנה הזמנה
            </button>
          </div>

          {/* Items Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">בחר פריטים להחזרה/החלפה</h3>
            <div className="space-y-2">
              {orderItems.map(item => {
                const isSelected = !!selectedItems[item.id];
                const selectedQty = selectedItems[item.id] || 0;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-3 border rounded-lg transition-colors ${
                      isSelected ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleItem(item.id, item.quantity)}
                      className="w-4 h-4 accent-gray-900 cursor-pointer"
                    />
                    
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      {item.variantTitle && (
                        <p className="text-sm text-gray-500">{item.variantTitle}</p>
                      )}
                    </div>

                    <div className="text-sm text-gray-600">
                      ₪{Number(item.price || 0).toFixed(2)}
                    </div>

                    {isSelected && item.quantity > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, selectedQty - 1, item.quantity)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded text-gray-500 hover:bg-gray-100 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm">{selectedQty}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, selectedQty + 1, item.quantity)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded text-gray-500 hover:bg-gray-100 cursor-pointer"
                        >
                          +
                        </button>
                        <span className="text-xs text-gray-400">מתוך {item.quantity}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Type & Reason */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סוג בקשה</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setType('return')}
                  className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                    type === 'return'
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  החזרה
                </button>
                <button
                  onClick={() => setType('exchange')}
                  className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                    type === 'exchange'
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  החלפה
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סיבה</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900"
              >
                {Object.entries(reasonLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Resolution */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">פתרון מבוקש</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(resolutionLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setResolution(key)}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                    resolution === key
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">פרטים נוספים (אופציונלי)</label>
            <textarea
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
              placeholder="הערות נוספות לבקשה..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 resize-none"
            />
          </div>

          {/* Summary & Submit */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              {totalValue > 0 && (
                <p className="text-lg font-semibold text-gray-900">
                  סה״כ: ₪{totalValue.toFixed(2)}
                </p>
              )}
              {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={isPending || Object.keys(selectedItems).length === 0}
              className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending ? 'שומר...' : 'צור בקשה'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

