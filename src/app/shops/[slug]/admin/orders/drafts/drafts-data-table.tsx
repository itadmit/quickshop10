'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DataTable, Badge, EmptyState } from '@/components/admin/ui';
import type { Column, Tab, BulkAction } from '@/components/admin/ui';
import { DraftOrderButtons } from './draft-buttons';

// ============================================
// DraftsDataTable - Client Component
// ============================================

type DraftOrder = {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  items: unknown;
  subtotal: string | null;
  total: string | null;
  notes: string | null;
  completedAt: Date | null;
  orderId: string | null;
  createdAt: Date;
};

interface DraftsDataTableProps {
  drafts: DraftOrder[];
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

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DraftsDataTable({
  drafts,
  storeSlug,
  tabs,
  currentTab,
  pagination,
}: DraftsDataTableProps) {
  const router = useRouter();

  // Bulk Actions
  const bulkActions: BulkAction[] = [
    {
      id: 'send-invoice',
      label: 'שלח חשבונית',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        console.log('Send invoice:', selectedIds);
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
        if (!confirm(`האם למחוק ${selectedIds.length} טיוטות?`)) return;
        console.log('Delete:', selectedIds);
        router.refresh();
      },
    },
  ];

  const columns: Column<DraftOrder>[] = [
    {
      key: 'customer',
      header: 'לקוח',
      render: (draft) => (
        <div>
          <p className="font-medium text-gray-900">
            {draft.customerName || draft.customerEmail || 'לקוח לא מזוהה'}
          </p>
          {draft.customerEmail && draft.customerName && (
            <p className="text-sm text-gray-500">{draft.customerEmail}</p>
          )}
        </div>
      ),
    },
    {
      key: 'items',
      header: 'פריטים',
      width: '100px',
      align: 'center',
      render: (draft) => {
        const items = (draft.items as Array<{ name: string; quantity: number; price: number }>) || [];
        const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        return <span className="text-gray-600">{itemCount}</span>;
      },
    },
    {
      key: 'total',
      header: 'סכום',
      width: '100px',
      render: (draft) => (
        <span className="font-medium">₪{Number(draft.total || 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      header: 'סטטוס',
      width: '100px',
      align: 'center',
      render: (draft) => (
        <Badge variant={draft.completedAt ? 'success' : 'warning'}>
          {draft.completedAt ? 'הושלם' : 'פתוח'}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: 'תאריך',
      width: '140px',
      render: (draft) => (
        <span className="text-gray-500 text-sm">{formatDate(draft.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'פעולות',
      width: '150px',
      align: 'right',
      render: (draft) => (
        <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
          {!draft.completedAt && (
            <DraftOrderButtons draftId={draft.id} slug={storeSlug} />
          )}
          {draft.orderId && (
            <Link
              href={`/shops/${storeSlug}/admin/orders/${draft.orderId}`}
              className="text-sm text-blue-600 hover:underline"
            >
              צפה בהזמנה
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={drafts}
      columns={columns}
      getRowKey={(draft) => draft.id}
      tabs={tabs}
      currentTab={currentTab}
      tabParamName="filter"
      selectable
      bulkActions={bulkActions}
      searchable={false}
      pagination={pagination}
      emptyState={
        <EmptyState
          icon="orders"
          title="אין הזמנות טיוטה"
          description="צור טיוטה חדשה כדי להתחיל"
          action={{
            label: 'צור טיוטה',
            href: `/shops/${storeSlug}/admin/orders/drafts/new`,
          }}
        />
      }
    />
  );
}
