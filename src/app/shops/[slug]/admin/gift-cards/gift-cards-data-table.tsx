'use client';

import { useRouter } from 'next/navigation';
import { DataTable, Badge, EmptyState } from '@/components/admin/ui';
import type { Column, Tab, BulkAction } from '@/components/admin/ui';
import { GiftCardButtons } from './gift-card-buttons';

// ============================================
// GiftCardsDataTable - Client Component
// ============================================

type GiftCard = {
  id: string;
  code: string;
  initialBalance: string | null;
  currentBalance: string | null;
  status: string;
  recipientEmail: string | null;
  recipientName: string | null;
  senderName: string | null;
  message: string | null;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
};

interface GiftCardsDataTableProps {
  cards: GiftCard[];
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

function formatDate(date: Date | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function getStatusVariant(status: string): 'success' | 'warning' | 'error' | 'default' {
  switch (status) {
    case 'active': return 'success';
    case 'used': return 'default';
    case 'expired': return 'error';
    case 'cancelled': return 'warning';
    default: return 'default';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'active': return 'פעיל';
    case 'used': return 'נוצל';
    case 'expired': return 'פג תוקף';
    case 'cancelled': return 'מבוטל';
    default: return status;
  }
}

export function GiftCardsDataTable({
  cards,
  storeSlug,
  tabs,
  currentTab,
  pagination,
}: GiftCardsDataTableProps) {
  const router = useRouter();

  // Bulk Actions
  const bulkActions: BulkAction[] = [
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
        console.log('Export gift cards:', selectedIds);
      },
    },
    {
      id: 'cancel',
      label: 'בטל',
      variant: 'danger',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        if (!confirm(`האם לבטל ${selectedIds.length} גיפט קארדס?`)) return;
        console.log('Cancel gift cards:', selectedIds);
        router.refresh();
      },
    },
  ];

  const columns: Column<GiftCard>[] = [
    {
      key: 'code',
      header: 'קוד',
      render: (card) => (
        <span className="font-mono font-medium text-gray-900">{card.code}</span>
      ),
    },
    {
      key: 'balance',
      header: 'יתרה',
      width: '120px',
      render: (card) => (
        <div>
          <span className="font-medium text-gray-900">{formatCurrency(card.currentBalance)}</span>
          {Number(card.currentBalance) < Number(card.initialBalance) && (
            <span className="text-xs text-gray-500 mr-1">
              / {formatCurrency(card.initialBalance)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'סטטוס',
      width: '100px',
      align: 'center',
      render: (card) => (
        <Badge variant={getStatusVariant(card.status)}>
          {getStatusText(card.status)}
        </Badge>
      ),
    },
    {
      key: 'recipient',
      header: 'נמען',
      render: (card) => (
        <span className="text-gray-600">
          {card.recipientEmail || card.recipientName || '-'}
        </span>
      ),
    },
    {
      key: 'expires',
      header: 'תוקף',
      width: '100px',
      render: (card) => (
        <span className="text-gray-500">{formatDate(card.expiresAt)}</span>
      ),
    },
    {
      key: 'created',
      header: 'נוצר',
      width: '100px',
      render: (card) => (
        <span className="text-gray-500">{formatDate(card.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      align: 'left',
      render: (card) => (
        <div onClick={(e) => e.stopPropagation()}>
          <GiftCardButtons 
            cardId={card.id} 
            slug={storeSlug} 
            status={card.status}
            code={card.code}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={cards}
      columns={columns}
      getRowKey={(card) => card.id}
      tabs={tabs}
      currentTab={currentTab}
      tabParamName="filter"
      selectable
      bulkActions={bulkActions}
      searchable={false}
      pagination={pagination}
      emptyState={
        <EmptyState
          icon="discount"
          title="אין גיפט קארדס"
          description="צור גיפט קארד ראשון לחנות"
          action={{
            label: 'צור גיפט קארד',
            href: `/shops/${storeSlug}/admin/gift-cards/new`,
          }}
        />
      }
    />
  );
}

