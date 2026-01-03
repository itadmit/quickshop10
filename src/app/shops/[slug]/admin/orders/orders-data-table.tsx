'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DataTable, Badge, EmptyState } from '@/components/admin/ui';
import type { Column, Tab, BulkAction } from '@/components/admin/ui';

// ============================================
// OrdersDataTable - Client Component
// עוטף את DataTable עם הגדרות columns
// ============================================

type Order = {
  id: string;
  orderNumber: string;
  total: string;
  status: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  createdAt: Date | null;
  customerName: string | null;
  customerEmail: string | null;
  customer?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
};

interface OrdersDataTableProps {
  orders: Order[];
  storeSlug: string;
  tabs: Tab[];
  currentTab: string;
  searchValue?: string;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
  };
}

const fulfillmentLabels: Record<string, string> = {
  unfulfilled: 'לא נשלח',
  partial: 'נשלח חלקית',
  fulfilled: 'נשלח',
};

const financialLabels: Record<string, string> = {
  pending: 'ממתין',
  paid: 'שולם',
  refunded: 'הוחזר',
  partially_refunded: 'הוחזר חלקית',
};

function getFinancialVariant(status: string | null): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'paid') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'refunded' || status === 'partially_refunded') return 'error';
  return 'default';
}

function getFulfillmentVariant(status: string | null): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'fulfilled') return 'success';
  if (status === 'partial') return 'warning';
  return 'default';
}

function formatDate(date: Date | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('he-IL', { 
    day: '2-digit', 
    month: '2-digit',
    year: '2-digit'
  });
}


export function OrdersDataTable({
  orders,
  storeSlug,
  tabs,
  currentTab,
  searchValue,
  pagination,
}: OrdersDataTableProps) {
  const router = useRouter();

  // Bulk Actions
  const bulkActions: BulkAction[] = [
    {
      id: 'mark-fulfilled',
      label: 'סמן כנשלח',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        // TODO: Implement bulk fulfill
        console.log('Mark fulfilled:', selectedIds);
        router.refresh();
      },
    },
    {
      id: 'print-labels',
      label: 'הדפס תוויות',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 6 2 18 2 18 9"/>
          <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        // TODO: Implement print labels
        console.log('Print labels:', selectedIds);
      },
    },
    {
      id: 'export',
      label: 'ייצא',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        // TODO: Implement export
        console.log('Export:', selectedIds);
      },
    },
  ];

  // Define columns inside Client Component
  const columns: Column<Order>[] = [
    {
      key: 'orderNumber',
      header: 'מס׳ הזמנה',
      width: '120px',
      render: (order) => (
        <Link 
          href={`/shops/${storeSlug}/admin/orders/${order.id}`}
          className="font-medium text-gray-900 hover:text-blue-600"
          onClick={(e) => e.stopPropagation()}
        >
          #{order.orderNumber}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: 'לקוח',
      render: (order) => {
        // Try to get name from order.customerName first, then from customer relation
        const name = order.customerName || 
          (order.customer?.firstName || order.customer?.lastName
            ? `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim()
            : null);
        const email = order.customerEmail || order.customer?.email;
        
        return (
          <div>
            <p className="font-medium text-gray-900">
              {name || 'אורח'}
            </p>
            {email && <p className="text-gray-500 text-xs">{email}</p>}
          </div>
        );
      },
    },
    {
      key: 'financialStatus',
      header: 'תשלום',
      width: '100px',
      align: 'center',
      render: (order) => (
        <Badge variant={getFinancialVariant(order.financialStatus)}>
          {financialLabels[order.financialStatus || 'pending']}
        </Badge>
      ),
    },
    {
      key: 'fulfillmentStatus',
      header: 'משלוח',
      width: '100px',
      align: 'center',
      render: (order) => (
        <Badge variant={getFulfillmentVariant(order.fulfillmentStatus)}>
          {fulfillmentLabels[order.fulfillmentStatus || 'unfulfilled']}
        </Badge>
      ),
    },
    {
      key: 'total',
      header: 'סכום',
      width: '100px',
      align: 'left',
      render: (order) => (
        <span className="font-medium">₪{Number(order.total).toLocaleString()}</span>
      ),
    },
    {
      key: 'date',
      header: 'תאריך',
      width: '100px',
      align: 'center',
      render: (order) => (
        <span className="text-gray-500">{formatDate(order.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'פעולות',
      width: '200px',
      align: 'right',
      render: (order) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/shops/${storeSlug}/admin/orders/${order.id}`}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="צפה בהזמנה"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
          <button
            onClick={() => window.print()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="הדפס"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={orders}
      columns={columns}
      getRowKey={(order) => order.id}
      getRowHref={(order) => `/shops/${storeSlug}/admin/orders/${order.id}`}
      tabs={tabs}
      currentTab={currentTab}
      selectable
      bulkActions={bulkActions}
      searchable
      searchPlaceholder="חיפוש לפי מספר הזמנה, שם או אימייל..."
      searchValue={searchValue}
      pagination={pagination}
      emptyState={
        <EmptyState
          icon="orders"
          title="אין הזמנות"
          description={searchValue ? 'לא נמצאו הזמנות התואמות לחיפוש' : 'עדיין לא התקבלו הזמנות בחנות'}
        />
      }
    />
  );
}
