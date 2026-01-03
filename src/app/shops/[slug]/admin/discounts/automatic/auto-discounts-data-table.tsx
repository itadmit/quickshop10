'use client';

import { DataTable, Badge } from '@/components/admin/ui';
import type { Column, Tab } from '@/components/admin/ui';
import { AutoDiscountForm } from './auto-discount-form';
import { ToggleAutoDiscountButton, DeleteAutoDiscountButton } from './auto-discount-buttons';

// ============================================
// AutoDiscountsDataTable - Client Component
// ============================================

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
}

type AutoDiscount = {
  id: string;
  name: string;
  description: string | null;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: string;
  appliesTo: 'all' | 'category' | 'product' | 'member';
  categoryIds: unknown;
  productIds: unknown;
  minimumAmount: string | null;
  minimumQuantity: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  priority: number;
  stackable: boolean;
  isActive: boolean;
  createdAt: Date;
};

interface AutoDiscountsDataTableProps {
  discounts: AutoDiscount[];
  storeId: string;
  categories: Category[];
  products: Product[];
  tabs: Tab[];
  currentTab: string;
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

function formatAppliesTo(appliesTo: string) {
  switch (appliesTo) {
    case 'all':
      return 'כל המוצרים';
    case 'category':
      return 'קטגוריות';
    case 'product':
      return 'מוצרים';
    case 'member':
      return 'חברי מועדון';
    default:
      return appliesTo;
  }
}

function isExpired(endsAt: Date | null): boolean {
  return endsAt !== null && new Date(endsAt) < new Date();
}

export function AutoDiscountsDataTable({
  discounts,
  storeId,
  categories,
  products,
  tabs,
  currentTab,
  pagination,
}: AutoDiscountsDataTableProps) {
  const columns: Column<AutoDiscount>[] = [
    {
      key: 'name',
      header: 'שם ההנחה',
      render: (discount) => (
        <div>
          <span className="font-medium text-gray-900">{discount.name}</span>
          {discount.description && (
            <p className="text-sm text-gray-500 line-clamp-1">{discount.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'value',
      header: 'ערך',
      width: '100px',
      render: (discount) => (
        <span className="font-semibold text-gray-900">
          {formatDiscountValue(discount.type, discount.value)}
        </span>
      ),
    },
    {
      key: 'appliesTo',
      header: 'חל על',
      width: '140px',
      render: (discount) => {
        const categoryArr = Array.isArray(discount.categoryIds) ? discount.categoryIds as string[] : [];
        const productArr = Array.isArray(discount.productIds) ? discount.productIds as string[] : [];
        
        return (
          <div>
            <span className="text-gray-700">{formatAppliesTo(discount.appliesTo)}</span>
            {discount.appliesTo === 'category' && categoryArr.length > 0 && (
              <p className="text-xs text-gray-500">{categoryArr.length} קטגוריות</p>
            )}
            {discount.appliesTo === 'product' && productArr.length > 0 && (
              <p className="text-xs text-gray-500">{productArr.length} מוצרים</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'conditions',
      header: 'תנאים',
      width: '140px',
      render: (discount) => (
        <div className="text-sm text-gray-500">
          {discount.minimumAmount && (
            <div>מינימום ₪{Number(discount.minimumAmount)}</div>
          )}
          {discount.minimumQuantity && (
            <div>מינימום {discount.minimumQuantity} פריטים</div>
          )}
          {!discount.minimumAmount && !discount.minimumQuantity && (
            <span className="text-gray-400">ללא תנאים</span>
          )}
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'תקופה',
      width: '160px',
      render: (discount) => {
        const expired = isExpired(discount.endsAt);
        
        if (!discount.startsAt && !discount.endsAt) {
          return <span className="text-gray-400 text-sm">ללא הגבלה</span>;
        }
        
        return (
          <div className={`text-sm ${expired ? 'text-red-600' : 'text-gray-500'}`}>
            {discount.startsAt && (
              <div>מ: {new Date(discount.startsAt).toLocaleDateString('he-IL')}</div>
            )}
            {discount.endsAt && (
              <div>עד: {new Date(discount.endsAt).toLocaleDateString('he-IL')}</div>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'סטטוס',
      width: '100px',
      render: (discount) => {
        const expired = isExpired(discount.endsAt);
        
        if (expired) {
          return <Badge variant="error">פג תוקף</Badge>;
        }
        
        return discount.isActive 
          ? <Badge variant="success">פעיל</Badge>
          : <Badge variant="default">מושהה</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'פעולות',
      width: '200px',
      align: 'right',
      render: (discount) => {
        // Convert to the format the form expects
        const formDiscount = {
          ...discount,
          categoryIds: Array.isArray(discount.categoryIds) ? discount.categoryIds as string[] : [],
          productIds: Array.isArray(discount.productIds) ? discount.productIds as string[] : [],
        };
        
        return (
          <div className="flex items-center gap-1 justify-start" onClick={(e) => e.stopPropagation()}>
            <AutoDiscountForm 
              storeId={storeId} 
              mode="edit" 
              discount={formDiscount}
              categories={categories}
              products={products}
            />
            <ToggleAutoDiscountButton discountId={discount.id} isActive={discount.isActive} />
            <DeleteAutoDiscountButton discountId={discount.id} discountName={discount.name} />
          </div>
        );
      },
    },
  ];

  if (discounts.length === 0 && currentTab === 'all') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="text-gray-300 mb-4">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-1">
            אין הנחות אוטומטיות
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-sm mb-4">
            צור הנחה אוטומטית שתחול על הזמנות ללא צורך בקוד קופון
          </p>
          <AutoDiscountForm 
            storeId={storeId} 
            mode="create"
            categories={categories}
            products={products}
          />
        </div>
      </div>
    );
  }

  return (
    <DataTable
      data={discounts}
      columns={columns}
      getRowKey={(discount) => discount.id}
      tabs={tabs}
      currentTab={currentTab}
      tabParamName="filter"
      pagination={pagination}
    />
  );
}

