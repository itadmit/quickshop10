'use client';

import type { CartItem } from './pos-terminal';
import Image from 'next/image';

// ============================================
// Cart Section Component
// Cart items, summary, and checkout button
// ============================================

interface CartSectionProps {
  cart: CartItem[];
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  subtotal: number;
  discountCode: string;
  setDiscountCode: (code: string) => void;
  discountAmount: number;
  shippingAmount: number;
  total: number;
  itemCount: number;
  notes: string;
  setNotes: (notes: string) => void;
  onCheckout: () => void;
  isPending: boolean;
  error: string | null;
}

export function CartSection({
  cart,
  updateQuantity,
  removeItem,
  clearCart,
  subtotal,
  discountCode,
  setDiscountCode,
  discountAmount,
  shippingAmount,
  total,
  itemCount,
  notes,
  setNotes,
  onCheckout,
  isPending,
  error,
}: CartSectionProps) {
  const formatPrice = (price: number) => {
    return `₪${price.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Cart Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          עגלה
          {itemCount > 0 && (
            <span className="bg-gray-900 text-white text-xs px-2 py-0.5 rounded-full">
              {itemCount}
            </span>
          )}
        </h2>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
          >
            נקה הכל
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <svg className="w-16 h-16 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm">העגלה ריקה</p>
            <p className="text-xs mt-1">לחץ על מוצר להוספה</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 bg-gray-50 rounded-lg p-3"
            >
              {/* Image */}
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                  {item.type === 'manual' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm line-clamp-1">{item.name}</p>
                {item.type === 'manual' && item.description && (
                  <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                )}
                <div className="flex items-center justify-between mt-1">
                  <span className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-gray-700 cursor-pointer"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-gray-700 cursor-pointer"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-red-500 hover:bg-red-50 cursor-pointer mr-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary & Checkout */}
      {cart.length > 0 && (
        <div className="border-t border-gray-200 p-4 space-y-3 bg-gray-50">
          {/* Discount Code */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">קוד קופון</label>
            <input
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              placeholder="הזן קוד קופון..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              dir="ltr"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">הערות להזמנה</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערות..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>

          {/* Totals */}
          <div className="space-y-1 pt-2 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">סה״כ פריטים</span>
              <span className="font-medium">{itemCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">סכום ביניים</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>הנחה</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            {shippingAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">משלוח</span>
                <span>{formatPrice(shippingAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span>לתשלום</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={onCheckout}
            disabled={isPending || cart.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {isPending ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>מעבד...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>המשך לתשלום</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

