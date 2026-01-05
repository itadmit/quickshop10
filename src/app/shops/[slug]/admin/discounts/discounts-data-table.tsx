'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { DataTable, Badge, EmptyState } from '@/components/admin/ui';
import type { Column, Tab, BulkAction } from '@/components/admin/ui';
import { DeleteCouponButton, ToggleCouponButton } from './coupon-buttons';

// Copy Link Button Component
function CopyLinkButton({ storeSlug, couponCode }: { storeSlug: string; couponCode: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const couponUrl = `${baseUrl}/shops/${storeSlug}/checkout?coupon=${encodeURIComponent(couponCode)}`;
    
    try {
      await navigator.clipboard.writeText(couponUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  return (
    <button
      onClick={handleCopy}
      className={`p-2 transition-colors ${copied ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
      title={copied ? 'הועתק!' : 'העתק לינק קופון'}
    >
      {copied ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )}
    </button>
  );
}

// ============================================
// DiscountsDataTable - Client Component
// ============================================

type DiscountType = 
  | 'percentage' 
  | 'fixed_amount' 
  | 'free_shipping'
  | 'buy_x_pay_y'
  | 'buy_x_get_y'
  | 'gift_product'        // מוצר במתנה (עם תנאים, בחירת מוצר ספציפי)
  | 'quantity_discount'
  | 'spend_x_pay_y';

type Coupon = {
  id: string;
  code: string;
  title: string | null;
  type: DiscountType;
  value: string;
  minimumAmount: string | null;
  usageCount: number | null;
  usageLimit: number | null;
  oncePerCustomer: boolean;
  firstOrderOnly: boolean;
  stackable: boolean;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date | null;
  influencerName: string | null;
  // שדות חדשים לסוגי הנחות מתקדמים
  buyQuantity?: number | null;
  payAmount?: string | number | null;
  getQuantity?: number | null;
  giftProductIds?: string[] | null;
  quantityTiers?: Array<{ minQuantity: number; discountPercent: number }> | null;
  spendAmount?: string | number | null;
};

interface Influencer {
  id: string;
  name: string;
  email: string;
}

interface DiscountsDataTableProps {
  coupons: Coupon[];
  storeId: string;
  storeSlug: string;
  tabs: Tab[];
  currentTab: string;
  searchValue?: string;
  influencers?: Influencer[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
  };
}

function formatDiscountValue(
  type: string, 
  value: string | number,
  coupon?: Coupon
) {
  const numValue = Number(value);
  switch (type) {
    case 'percentage':
      return `${numValue}%`;
    case 'fixed_amount':
      return `₪${numValue}`;
    case 'free_shipping':
      return 'משלוח חינם';
    case 'buy_x_pay_y':
      if (coupon?.buyQuantity && coupon?.payAmount) {
        return `קנה ${coupon.buyQuantity} שלם ₪${Number(coupon.payAmount)}`;
      }
      return 'קנה X שלם Y';
    case 'buy_x_get_y':
      if (coupon?.buyQuantity && coupon?.getQuantity) {
        return `קנה ${coupon.buyQuantity} קבל ${coupon.getQuantity} חינם`;
      }
      return 'קנה X קבל Y';
    case 'gift_product':
      if (coupon?.giftProductIds && coupon.giftProductIds.length > 0) {
        return 'מוצר במתנה';
      }
      return 'מוצר במתנה';
    case 'spend_x_pay_y':
      if (coupon?.spendAmount && coupon?.payAmount) {
        return `קנה ב-₪${Number(coupon.spendAmount)} שלם ₪${Number(coupon.payAmount)}`;
      }
      return 'קנה ב-X שלם Y';
    case 'quantity_discount':
      if (coupon?.quantityTiers && coupon.quantityTiers.length > 0) {
        const firstTier = coupon.quantityTiers[0];
        return `קנה ${firstTier.minQuantity}+ קבל ${firstTier.discountPercent}%`;
      }
      return 'הנחות כמות';
    default:
      return String(numValue);
  }
}

function formatDate(date: Date | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
}

export function DiscountsDataTable({
  coupons,
  storeId,
  storeSlug,
  tabs,
  currentTab,
  searchValue,
  influencers = [],
  pagination,
}: DiscountsDataTableProps) {
  const router = useRouter();

  // Bulk Actions
  const bulkActions: BulkAction[] = [
    {
      id: 'activate',
      label: 'הפעל',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        console.log('Activate coupons:', selectedIds);
        router.refresh();
      },
    },
    {
      id: 'deactivate',
      label: 'השבת',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        console.log('Deactivate coupons:', selectedIds);
        router.refresh();
      },
    },
    {
      id: 'delete',
      label: 'מחק',
      variant: 'danger',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        if (!confirm(`האם למחוק ${selectedIds.length} קופונים?`)) return;
        console.log('Delete coupons:', selectedIds);
        router.refresh();
      },
    },
  ];

  const columns: Column<Coupon>[] = [
    {
      key: 'code',
      header: 'קוד',
      render: (coupon) => (
        <div>
          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
            {coupon.code}
          </code>
          {coupon.title && (
            <p className="text-xs text-gray-500 mt-1">{coupon.title}</p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'סוג',
      width: '100px',
      render: (coupon) => (
        <span className="text-sm text-gray-600">
          {coupon.type === 'percentage' && 'אחוז'}
          {coupon.type === 'fixed_amount' && 'סכום קבוע'}
          {coupon.type === 'free_shipping' && 'משלוח חינם'}
          {coupon.type === 'buy_x_pay_y' && 'קנה X שלם Y'}
          {coupon.type === 'buy_x_get_y' && 'קנה X קבל Y'}
          {coupon.type === 'gift_product' && 'מוצר במתנה'}
          {coupon.type === 'quantity_discount' && 'הנחות כמות'}
          {coupon.type === 'spend_x_pay_y' && 'קנה ב-X שלם Y'}
        </span>
      ),
    },
    {
      key: 'value',
      header: 'ערך',
      width: '100px',
      render: (coupon) => (
        <span className="font-medium text-gray-900">
          {formatDiscountValue(coupon.type, coupon.value, coupon)}
        </span>
      ),
    },
    {
      key: 'usage',
      header: 'שימושים',
      width: '100px',
      align: 'center',
      render: (coupon) => (
        <span className="text-sm text-gray-600">
          {coupon.usageCount || 0}
          {coupon.usageLimit && ` / ${coupon.usageLimit}`}
        </span>
      ),
    },
    {
      key: 'influencer',
      header: 'משפיען',
      width: '120px',
      render: (coupon) => (
        <span className={`text-sm ${coupon.influencerName ? 'text-purple-600 font-medium' : 'text-gray-400'}`}>
          {coupon.influencerName || '-'}
        </span>
      ),
    },
    {
      key: 'validity',
      header: 'תוקף',
      width: '140px',
      render: (coupon) => (
        <span className="text-sm text-gray-600">
          {coupon.startsAt || coupon.endsAt ? (
            <>
              {formatDate(coupon.startsAt)} - {formatDate(coupon.endsAt)}
            </>
          ) : (
            <span className="text-gray-400">ללא הגבלה</span>
          )}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'סטטוס',
      width: '100px',
      align: 'center',
      render: (coupon) => {
        const isExpired = coupon.endsAt && new Date(coupon.endsAt) < new Date();
        const isExhausted = coupon.usageLimit && coupon.usageCount && coupon.usageCount >= coupon.usageLimit;
        
        if (!coupon.isActive) {
          return <Badge variant="default">מושהה</Badge>;
        }
        if (isExpired) {
          return <Badge variant="error">פג תוקף</Badge>;
        }
        if (isExhausted) {
          return <Badge variant="warning">נוצל</Badge>;
        }
        return <Badge variant="success">פעיל</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'פעולות',
      width: '140px',
      align: 'left',
      render: (coupon) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <CopyLinkButton storeSlug={storeSlug} couponCode={coupon.code} />
          <Link
            href={`/shops/${storeSlug}/admin/discounts/${coupon.id}`}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="ערוך"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>
          <ToggleCouponButton couponId={coupon.id} isActive={coupon.isActive} />
          <DeleteCouponButton couponId={coupon.id} couponCode={coupon.code} />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={coupons}
      columns={columns}
      getRowKey={(coupon) => coupon.id}
      tabs={tabs}
      currentTab={currentTab}
      tabParamName="filter"
      selectable
      bulkActions={bulkActions}
      searchable
      searchPlaceholder="חיפוש לפי קוד קופון..."
      searchValue={searchValue}
      pagination={pagination}
      emptyState={
        <EmptyState
          icon="discount"
          title="אין קופונים"
          description={searchValue ? 'לא נמצאו קופונים התואמים לחיפוש' : 'צור קופון ראשון לחנות שלך'}
        />
      }
    />
  );
}
