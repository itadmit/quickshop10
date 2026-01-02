'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

type OrderSummary = {
  items: { name: string; quantity: number; price: number; variantTitle?: string; image: string }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string;
  orderDate: string;
  orderNumber: string;
  token: string;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    zipCode: string;
  };
};

const ORDER_STORAGE_KEY = 'quickshop_last_order';

export default function ThankYouPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  
  const orderNumber = params.orderNumber as string;
  const token = searchParams.get('t');

  useEffect(() => {
    // Try to load order from localStorage
    const savedOrder = localStorage.getItem(ORDER_STORAGE_KEY);
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder) as OrderSummary;
        // Verify this is the correct order AND token matches
        if (parsed.orderNumber === orderNumber && parsed.token === token) {
          setOrderSummary(parsed);
        } else {
          setAccessDenied(true);
        }
      } catch (e) {
        console.error('Failed to parse order from storage');
        setAccessDenied(true);
      }
    } else {
      setAccessDenied(true);
    }
    setLoading(false);
  }, [orderNumber, token]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('he-IL', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="py-32 px-6 text-center">
        <div className="animate-pulse">טוען...</div>
      </div>
    );
  }

  if (accessDenied || !orderSummary) {
    return (
      <div className="py-32 px-6 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 border border-red-300 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h1 className="font-display text-2xl tracking-[0.15em] uppercase mb-4">הגישה נדחתה</h1>
          <p className="text-gray-500 mb-8">אין לך הרשאה לצפות בהזמנה זו</p>
          <Link href="/" className="btn-primary inline-block">
            חזרה לחנות
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 px-6 bg-gray-50 min-h-[80vh]">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 border border-black rounded-full flex items-center justify-center mx-auto mb-8">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="font-display text-3xl md:text-4xl tracking-[0.2em] uppercase mb-4">תודה</h1>
          <p className="text-gray-500 text-sm tracking-wide">ההזמנה שלך התקבלה בהצלחה</p>
        </div>

        {/* Order Info Card */}
        <div className="bg-white shadow-sm mb-6">
          <div className="p-8 border-b border-gray-100">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-1">מספר הזמנה</p>
                <p className="font-mono text-lg">#{orderSummary.orderNumber}</p>
              </div>
              <div className="text-left">
                <p className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-1">תאריך ושעה</p>
                <p className="text-sm">{formatDateTime(orderSummary.orderDate)}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 text-sm text-gray-600">
              <p>אישור הזמנה נשלח לכתובת: <span className="font-medium text-black">{orderSummary.customer.email}</span></p>
            </div>
          </div>

          {/* Order Items */}
          <div className="p-8">
            <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-6">פריטים בהזמנה</h3>
            <ul className="space-y-4 mb-8">
              {orderSummary.items.map((item, i) => (
                <li key={i} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0">
                  <div className="w-16 h-20 bg-gray-100 overflow-hidden shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.variantTitle && (
                        <p className="text-xs text-gray-500">{item.variantTitle}</p>
                      )}
                      <p className="text-sm text-gray-400">כמות: {item.quantity}</p>
                    </div>
                    <p className="font-medium">₪{(item.price * item.quantity).toFixed(0)}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Order Totals */}
            <div className="space-y-3 text-sm pt-4 border-t border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">סכום ביניים</span>
                <span>₪{orderSummary.subtotal.toFixed(0)}</span>
              </div>
              {orderSummary.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>הנחה {orderSummary.couponCode ? `(קופון: ${orderSummary.couponCode})` : '(הנחה אוטומטית)'}</span>
                  <span>-₪{orderSummary.discount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">משלוח</span>
                <span>{orderSummary.shipping === 0 ? 'חינם' : `₪${orderSummary.shipping}`}</span>
              </div>
              <div className="flex justify-between text-lg font-display pt-4 border-t border-gray-100">
                <span>סה״כ</span>
                <span>₪{orderSummary.total.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Info */}
        <div className="bg-white shadow-sm p-8 mb-8">
          <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-4">כתובת למשלוח</h3>
          <p className="font-medium">{orderSummary.customer.firstName} {orderSummary.customer.lastName}</p>
          <p className="text-gray-600">{orderSummary.customer.address}</p>
          <p className="text-gray-600">{orderSummary.customer.city} {orderSummary.customer.zipCode}</p>
          <p className="text-gray-600">{orderSummary.customer.phone}</p>
        </div>

        {/* Actions */}
        <div className="text-center space-y-4">
          <Link href="/" className="btn-primary inline-block">
            המשך בקניות
          </Link>
          <p className="text-xs text-gray-400">
            שאלות? צרו קשר: hello@noir.co.il
          </p>
        </div>
      </div>
    </div>
  );
}

