'use client';

import Link from 'next/link';
import { DataTable, Badge, EmptyState } from '@/components/admin/ui';
import type { Column, Tab } from '@/components/admin/ui';
import { InfluencerButtons } from './influencer-buttons';

// ============================================
// InfluencersDataTable - Client Component
// מינימום JS - רק לאינטראקציה
// ============================================

type Influencer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  instagramHandle: string | null;
  instagramFollowers: number | null;
  commissionType: string | null;
  commissionValue: string | null;
  couponCode: string | null;
  discountCode: string | null;
  discountType: string | null;
  discountValue: string | null;
  discountBuyQuantity: number | null;
  discountGetQuantity: number | null;
  discountGetPercent: number | null;
  totalSales: string | null;
  totalCommission: string | null;
  totalOrders: number | null;
  isActive: boolean;
  periodSales: string;
  periodCommission: string;
  periodOrders: number;
};

interface InfluencersDataTableProps {
  influencers: Influencer[];
  storeSlug: string;
  tabs: Tab[];
  currentTab: string;
  searchValue?: string;
}

function formatCurrency(amount: string | number | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(num);
}

// Format discount value based on type
function formatDiscountDescription(discount: {
  type: string | null;
  value: string | null;
  buyQuantity: number | null;
  getQuantity: number | null;
  getDiscountPercent: number | null;
}): string | null {
  if (!discount.type) return null;
  
  switch (discount.type) {
    case 'percentage':
      return `${discount.value}% הנחה`;
    case 'fixed_amount':
      return `${formatCurrency(discount.value)} הנחה`;
    case 'free_shipping':
      return 'משלוח חינם';
    case 'buy_x_get_y':
      const buy = discount.buyQuantity || 1;
      const get = discount.getQuantity || 1;
      const discountPercent = discount.getDiscountPercent ?? 100;
      if (discountPercent === 100) {
        return `${buy}+${get} (קנה ${buy} קבל ${get} חינם)`;
      }
      return `${buy}+${get} (${discountPercent}% הנחה על ה-${get})`;
    case 'buy_x_pay_y':
      return 'קנה X שלם Y';
    case 'gift_product':
      return 'מוצר במתנה';
    case 'quantity_discount':
      return 'הנחות כמות';
    case 'spend_x_pay_y':
      return 'קנה ב-X שלם Y';
    default:
      return null;
  }
}

export function InfluencersDataTable({
  influencers,
  storeSlug,
  tabs,
  currentTab,
  searchValue,
}: InfluencersDataTableProps) {
  
  const columns: Column<Influencer>[] = [
    {
      key: 'influencer',
      header: 'משפיען',
      width: '250px',
      render: (influencer) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-medium shrink-0">
            {influencer.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <Link 
              href={`/shops/${storeSlug}/admin/influencers/${influencer.id}`}
              className="font-medium text-gray-900 hover:text-blue-600 truncate block"
              onClick={(e) => e.stopPropagation()}
            >
              {influencer.name}
            </Link>
            <p className="text-sm text-gray-500 truncate">{influencer.email}</p>
            {influencer.instagramHandle && (
              <p className="text-xs text-pink-600">{influencer.instagramHandle}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'coupon',
      header: 'קופון',
      width: '180px',
      render: (influencer) => (
        <div>
          {(influencer.couponCode || influencer.discountCode) ? (
            <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-sm font-mono rounded-lg">
              {influencer.couponCode || influencer.discountCode}
            </span>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
          {influencer.discountType && (
            <p className="text-xs text-gray-500 mt-1">
              {formatDiscountDescription({
                type: influencer.discountType,
                value: influencer.discountValue,
                buyQuantity: influencer.discountBuyQuantity,
                getQuantity: influencer.discountGetQuantity,
                getDiscountPercent: influencer.discountGetPercent,
              })}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'commission',
      header: 'עמלה',
      width: '100px',
      align: 'center',
      render: (influencer) => (
        influencer.commissionValue ? (
          <span className="font-medium text-gray-900">
            {influencer.commissionValue}{influencer.commissionType === 'percentage' ? '%' : '₪'}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">לא מוגדר</span>
        )
      ),
    },
    {
      key: 'periodSales',
      header: 'מכירות בתקופה',
      width: '140px',
      render: (influencer) => (
        <div>
          <p className="font-medium text-gray-900">{formatCurrency(influencer.periodSales)}</p>
          <p className="text-xs text-purple-600">{formatCurrency(influencer.periodCommission)} עמלה</p>
        </div>
      ),
    },
    {
      key: 'periodOrders',
      header: 'הזמנות',
      width: '80px',
      align: 'center',
      render: (influencer) => (
        <span className="font-medium">{influencer.periodOrders}</span>
      ),
    },
    {
      key: 'totalSales',
      header: 'סה"כ מכירות',
      width: '130px',
      render: (influencer) => (
        <div>
          <p className="text-sm text-gray-500">{formatCurrency(influencer.totalSales)}</p>
          <p className="text-xs text-gray-400">{influencer.totalOrders} הזמנות</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'סטטוס',
      width: '90px',
      align: 'center',
      render: (influencer) => (
        <Badge variant={influencer.isActive ? 'success' : 'default'}>
          {influencer.isActive ? 'פעיל' : 'לא פעיל'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'פעולות',
      width: '100px',
      align: 'left',
      render: (influencer) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/shops/${storeSlug}/admin/influencers/${influencer.id}`}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="עריכה"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>
          <InfluencerButtons influencerId={influencer.id} slug={storeSlug} />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={influencers}
      columns={columns}
      getRowKey={(influencer) => influencer.id}
      getRowHref={(influencer) => `/shops/${storeSlug}/admin/influencers/${influencer.id}`}
      tabs={tabs}
      currentTab={currentTab}
      searchable
      searchPlaceholder="חיפוש לפי שם, אימייל או קופון..."
      searchValue={searchValue}
      selectable={false}
      emptyState={
        <EmptyState
          icon="users"
          title="אין משפיענים"
          description={searchValue ? 'לא נמצאו משפיענים התואמים לחיפוש' : 'הוסף משפיען ראשון כדי להתחיל לעקוב אחרי מכירות'}
          action={{
            label: 'משפיען חדש',
            href: `/shops/${storeSlug}/admin/influencers/new`,
          }}
        />
      }
    />
  );
}




