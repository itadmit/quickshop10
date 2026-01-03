'use client';

import { useRouter } from 'next/navigation';
import { DataTable, Badge, EmptyState } from '@/components/admin/ui';
import type { Column, Tab, BulkAction } from '@/components/admin/ui';
import { CouponForm } from './coupon-form';
import { DeleteCouponButton, ToggleCouponButton } from './coupon-buttons';

// ============================================
// DiscountsDataTable - Client Component
// ============================================

type Coupon = {
  id: string;
  code: string;
  title: string | null;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
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
};

interface Influencer {
  id: string;
  name: string;
  email: string;
}

interface DiscountsDataTableProps {
  coupons: Coupon[];
  storeId: string;
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

function formatDiscountValue(type: string, value: string | number) {
  const numValue = Number(value);
  switch (type) {
    case 'percentage':
      return `${numValue}%`;
    case 'fixed_amount':
      return `₪${numValue}`;
    case 'free_shipping':
      return 'משלוח חינם';
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
        </span>
      ),
    },
    {
      key: 'value',
      header: 'ערך',
      width: '100px',
      render: (coupon) => (
        <span className="font-medium text-gray-900">
          {formatDiscountValue(coupon.type, coupon.value)}
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
      width: '120px',
      align: 'left',
      render: (coupon) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <CouponForm storeId={storeId} mode="edit" coupon={coupon} influencers={influencers} />
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
