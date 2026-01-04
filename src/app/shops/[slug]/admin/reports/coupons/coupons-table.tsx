'use client';

import { useState } from 'react';
import Link from 'next/link';

// Format helpers
function formatCurrency(value: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'numeric',
    year: '2-digit',
  });
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('he-IL').format(value);
}

type CouponOrder = {
  id: string;
  orderNumber: string;
  customerName: string | null;
  total: number;
  discountAmount: number;
  status: string;
  createdAt: Date;
};

type Coupon = {
  code: string;
  orders: number;
  revenue: number;
  discountTotal: number;
};

interface CouponsTableProps {
  coupons: Coupon[];
  couponOrdersMap: Record<string, CouponOrder[]>;
  storeSlug: string;
}

export function CouponsTable({ coupons, couponOrdersMap, storeSlug }: CouponsTableProps) {
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  if (!coupons.length) {
    return <p className="text-gray-500 text-center py-12">לא נעשה שימוש בקופונים בתקופה זו</p>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200 text-right">
          <th className="py-3 px-4 font-medium text-gray-500 text-sm">קוד קופון</th>
          <th className="py-3 px-4 font-medium text-gray-500 text-sm">הזמנות</th>
          <th className="py-3 px-4 font-medium text-gray-500 text-sm">הכנסות</th>
          <th className="py-3 px-4 font-medium text-gray-500 text-sm">סה״כ הנחות</th>
          <th className="py-3 px-4 font-medium text-gray-500 text-sm">% הנחה</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {coupons.map(coupon => {
          const isExpanded = expandedCode === coupon.code;
          const orders = couponOrdersMap[coupon.code] || [];
          
          return (
            <CouponRow 
              key={coupon.code}
              coupon={coupon}
              orders={orders}
              isExpanded={isExpanded}
              onToggle={() => setExpandedCode(isExpanded ? null : coupon.code)}
              storeSlug={storeSlug}
            />
          );
        })}
      </tbody>
    </table>
  );
}

function CouponRow({ 
  coupon, 
  orders,
  isExpanded,
  onToggle,
  storeSlug
}: { 
  coupon: Coupon;
  orders: CouponOrder[];
  isExpanded: boolean;
  onToggle: () => void;
  storeSlug: string;
}) {
  return (
    <>
      <tr 
        className="hover:bg-gray-50 cursor-pointer"
        onClick={onToggle}
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <code className="bg-gray-100 px-2 py-1 text-sm font-medium">{coupon.code}</code>
          </div>
        </td>
        <td className="py-3 px-4 font-medium">{formatNumber(coupon.orders)}</td>
        <td className="py-3 px-4 font-medium">{formatCurrency(coupon.revenue)}</td>
        <td className="py-3 px-4 text-green-600">{formatCurrency(coupon.discountTotal)}</td>
        <td className="py-3 px-4 text-gray-500">
          {coupon.revenue > 0 ? ((coupon.discountTotal / coupon.revenue) * 100).toFixed(1) : 0}%
        </td>
      </tr>
      {isExpanded && orders.length > 0 && (
        <tr>
          <td colSpan={5} className="bg-gray-50 p-4">
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="py-2 px-3 text-right font-medium text-gray-500">מספר הזמנה</th>
                    <th className="py-2 px-3 text-right font-medium text-gray-500">לקוח</th>
                    <th className="py-2 px-3 text-right font-medium text-gray-500">סכום</th>
                    <th className="py-2 px-3 text-right font-medium text-gray-500">הנחה</th>
                    <th className="py-2 px-3 text-right font-medium text-gray-500">תאריך</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td className="py-2 px-3">
                        <Link 
                          href={`/shops/${storeSlug}/admin/orders/${order.id}`}
                          className="text-black hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-2 px-3">{order.customerName || '-'}</td>
                      <td className="py-2 px-3">{formatCurrency(order.total)}</td>
                      <td className="py-2 px-3 text-green-600">-{formatCurrency(order.discountAmount)}</td>
                      <td className="py-2 px-3 text-gray-500">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}


