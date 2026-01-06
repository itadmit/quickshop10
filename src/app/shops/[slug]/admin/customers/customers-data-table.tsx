'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DataTable, EmptyState } from '@/components/admin/ui';
import type { Column, Tab, BulkAction } from '@/components/admin/ui';

// ============================================
// CustomersDataTable - Client Component
// ============================================

type Customer = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  totalOrders: number | null;
  totalSpent: string | null;
  creditBalance: string | null;
  acceptsMarketing: boolean | null;
  createdAt: Date;
};

interface CustomersDataTableProps {
  customers: Customer[];
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

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
}

export function CustomersDataTable({
  customers,
  storeSlug,
  tabs,
  currentTab,
  searchValue,
  pagination,
}: CustomersDataTableProps) {
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
        // TODO: Implement export
        console.log('Export customers:', selectedIds);
      },
    },
    {
      id: 'send-email',
      label: 'שלח מייל',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        // TODO: Implement send email
        console.log('Send email to:', selectedIds);
      },
    },
    {
      id: 'add-credit',
      label: 'הוסף קרדיט',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        // TODO: Implement add credit
        console.log('Add credit to:', selectedIds);
      },
    },
  ];

  const columns: Column<Customer>[] = [
    {
      key: 'customer',
      header: 'לקוח',
      render: (customer) => (
        <div>
          <Link 
            href={`/shops/${storeSlug}/admin/customers/${customer.id}`}
            className="font-medium text-gray-900 hover:text-blue-600"
            onClick={(e) => e.stopPropagation()}
          >
            {customer.firstName || customer.lastName
              ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
              : customer.email}
          </Link>
          {(customer.firstName || customer.lastName) && (
            <p className="text-sm text-gray-500">{customer.email}</p>
          )}
          {customer.phone && (
            <p className="text-sm text-gray-400">{customer.phone}</p>
          )}
        </div>
      ),
    },
    {
      key: 'orders',
      header: 'הזמנות',
      width: '100px',
      align: 'center',
      render: (customer) => (
        <span className="text-gray-600">{customer.totalOrders || 0}</span>
      ),
    },
    {
      key: 'spent',
      header: 'סה״כ קניות',
      width: '120px',
      align: 'center',
      render: (customer) => (
        <span className="font-medium">₪{Number(customer.totalSpent || 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'credit',
      header: 'יתרת קרדיט',
      width: '120px',
      align: 'center',
      render: (customer) => (
        <span className={`font-medium ${
          Number(customer.creditBalance) > 0 
            ? 'text-blue-600' 
            : 'text-gray-400'
        }`}>
          ₪{Number(customer.creditBalance || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'marketing',
      header: 'דיוור',
      width: '80px',
      align: 'center',
      render: (customer) => (
        customer.acceptsMarketing ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            מאושר
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            לא
          </span>
        )
      ),
    },
    {
      key: 'joined',
      header: 'הצטרפות',
      width: '100px',
      align: 'center',
      render: (customer) => (
        <span className="text-gray-500">{formatDate(customer.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'פעולות',
      width: '100px',
      align: 'left',
      render: (customer) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/shops/${storeSlug}/admin/customers/${customer.id}`}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="צפה בלקוח"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
          <Link
            href={`/shops/${storeSlug}/admin/orders?search=${encodeURIComponent(customer.email)}`}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="הזמנות הלקוח"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </Link>
          <a
            href={`mailto:${customer.email}`}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="שלח מייל"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </a>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={customers}
      columns={columns}
      getRowKey={(customer) => customer.id}
      getRowHref={(customer) => `/shops/${storeSlug}/admin/customers/${customer.id}`}
      tabs={tabs}
      currentTab={currentTab}
      tabParamName="filter"
      selectable
      bulkActions={bulkActions}
      searchable
      searchPlaceholder="חיפוש לפי שם, אימייל או טלפון..."
      searchValue={searchValue}
      pagination={pagination}
      emptyState={
        <EmptyState
          icon="users"
          title="אין לקוחות"
          description={searchValue ? 'לא נמצאו לקוחות התואמים לחיפוש' : 'עדיין אין לקוחות רשומים בחנות'}
        />
      }
    />
  );
}
