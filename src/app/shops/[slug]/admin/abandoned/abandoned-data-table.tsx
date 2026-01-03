'use client';

import { useRouter } from 'next/navigation';
import { DataTable, Badge, EmptyState } from '@/components/admin/ui';
import type { Column, Tab, BulkAction } from '@/components/admin/ui';
import { AbandonedCartButtons } from './cart-buttons';

// ============================================
// AbandonedCartsDataTable - Client Component
// ============================================

type AbandonedCart = {
  id: string;
  email: string | null;
  items: unknown;
  subtotal: string | null;
  checkoutStep: string | null;
  reminderSentAt: Date | null;
  reminderCount: number | null;
  recoveredAt: Date | null;
  createdAt: Date;
  customerFirstName: string | null;
  customerLastName: string | null;
};

interface AbandonedCartsDataTableProps {
  carts: AbandonedCart[];
  storeSlug: string;
  tabs: Tab[];
  currentTab: string;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
  };
}

function formatCurrency(amount: string | number | null) {
  return `₪${Number(amount || 0).toLocaleString()}`;
}

function formatTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (hours < 1) return 'לפני פחות משעה';
  if (hours < 24) return `לפני ${hours} שעות`;
  if (days < 7) return `לפני ${days} ימים`;
  return new Date(date).toLocaleDateString('he-IL');
}

const stepLabels: Record<string, string> = {
  cart: 'עגלה',
  shipping: 'משלוח',
  payment: 'תשלום',
};

export function AbandonedCartsDataTable({
  carts,
  storeSlug,
  tabs,
  currentTab,
  pagination,
}: AbandonedCartsDataTableProps) {
  const router = useRouter();

  // Bulk Actions
  const bulkActions: BulkAction[] = [
    {
      id: 'send-reminder',
      label: 'שלח תזכורת',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        console.log('Send reminder to:', selectedIds);
        router.refresh();
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
        console.log('Export carts:', selectedIds);
      },
    },
  ];

  const columns: Column<AbandonedCart>[] = [
    {
      key: 'customer',
      header: 'לקוח',
      render: (cart) => (
        <div>
          <p className="font-medium text-gray-900">
            {cart.customerFirstName && cart.customerLastName 
              ? `${cart.customerFirstName} ${cart.customerLastName}`
              : cart.email || 'אנונימי'}
          </p>
          {cart.email && cart.customerFirstName && (
            <p className="text-sm text-gray-500">{cart.email}</p>
          )}
        </div>
      ),
    },
    {
      key: 'items',
      header: 'פריטים',
      width: '80px',
      align: 'center',
      render: (cart) => {
        const items = (cart.items as Array<{ name: string; quantity: number; price: number }>) || [];
        const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        return <span className="text-gray-600">{itemCount}</span>;
      },
    },
    {
      key: 'total',
      header: 'סכום',
      width: '100px',
      render: (cart) => (
        <span className="font-medium">{formatCurrency(cart.subtotal)}</span>
      ),
    },
    {
      key: 'step',
      header: 'שלב',
      width: '80px',
      align: 'center',
      render: (cart) => (
        <span className="text-gray-500 text-sm">
          {stepLabels[cart.checkoutStep || ''] || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'סטטוס',
      width: '100px',
      align: 'center',
      render: (cart) => {
        if (cart.recoveredAt) {
          return <Badge variant="success">שוחזר</Badge>;
        }
        if (cart.reminderSentAt) {
          return <Badge variant="warning">נשלח ({cart.reminderCount})</Badge>;
        }
        return <Badge variant="error">ממתין</Badge>;
      },
    },
    {
      key: 'time',
      header: 'זמן',
      width: '120px',
      render: (cart) => (
        <span className="text-gray-500 text-sm">{formatTime(cart.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'פעולות',
      width: '200px',
      align: 'right',
      render: (cart) => (
        <div onClick={(e) => e.stopPropagation()}>
          {!cart.recoveredAt && cart.email && (
            <AbandonedCartButtons cartId={cart.id} slug={storeSlug} />
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={carts}
      columns={columns}
      getRowKey={(cart) => cart.id}
      tabs={tabs}
      currentTab={currentTab}
      tabParamName="filter"
      selectable
      bulkActions={bulkActions}
      searchable={false}
      pagination={pagination}
      emptyState={
        <EmptyState
          icon="box"
          title="אין עגלות נטושות"
          description="עגלות נטושות יופיעו כאן כשלקוחות יעזבו את תהליך הרכישה"
        />
      }
    />
  );
}

