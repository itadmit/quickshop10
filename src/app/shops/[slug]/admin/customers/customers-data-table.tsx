'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DataTable, EmptyState } from '@/components/admin/ui';
import type { Column, Tab, BulkAction } from '@/components/admin/ui';
import type { CustomerTag } from '@/lib/db/queries';
import { bulkDeleteCustomers } from './actions';

// ============================================
// CustomersDataTable - Client Component
// Shows customers with tags (מדבקות)
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
  tags: CustomerTag[];
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

// Tag badge configuration
const tagConfig: Record<CustomerTag, { label: string; bgColor: string; textColor: string }> = {
  customer: { label: 'לקוח', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  club_member: { label: 'מועדון', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  newsletter: { label: 'ניוזלטר', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  contact_form: { label: 'יצירת קשר', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
};

// Confirmation Modal Component
function DeleteConfirmModal({
  isOpen,
  count,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  isOpen: boolean;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Warning Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-center text-gray-900 mb-2">
          מחיקת {count} לקוחות
        </h3>

        {/* Warning Message */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-800 text-sm text-center font-medium mb-2">
            ⚠️ פעולה בלתי הפיכה!
          </p>
          <p className="text-red-700 text-sm text-center">
            כל המידע הקשור ללקוחות אלו יימחק לצמיתות:
          </p>
          <ul className="text-red-600 text-xs mt-2 space-y-1 text-center">
            <li>• היסטוריית הזמנות</li>
            <li>• יתרות קרדיט</li>
            <li>• מידע ממועדון לקוחות</li>
            <li>• כל הנתונים האחרים</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            ביטול
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                מוחק...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                מחק לצמיתות
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const result = await bulkDeleteCustomers(pendingDeleteIds);
      if (result.success) {
        setShowDeleteModal(false);
        setPendingDeleteIds([]);
        router.refresh();
      } else {
        alert(result.error || 'שגיאה במחיקה');
      }
    } catch {
      alert('שגיאה במחיקה');
    } finally {
      setIsDeleting(false);
    }
  };

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
        console.log('Add credit to:', selectedIds);
      },
    },
    {
      id: 'delete',
      label: 'מחק',
      variant: 'danger',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18"/>
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
          <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        setPendingDeleteIds(selectedIds);
        setShowDeleteModal(true);
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
      key: 'tags',
      header: 'מדבקות',
      width: '200px',
      render: (customer) => (
        <div className="flex flex-wrap gap-1">
          {customer.tags.length > 0 ? (
            customer.tags.map(tag => (
              <span 
                key={tag}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagConfig[tag].bgColor} ${tagConfig[tag].textColor}`}
              >
                {tagConfig[tag].label}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-xs">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'orders',
      header: 'הזמנות',
      width: '80px',
      align: 'center',
      render: (customer) => (
        <span className={customer.totalOrders ? 'text-gray-900 font-medium' : 'text-gray-400'}>
          {customer.totalOrders || 0}
        </span>
      ),
    },
    {
      key: 'spent',
      header: 'סה״כ קניות',
      width: '100px',
      align: 'center',
      render: (customer) => (
        <span className={Number(customer.totalSpent || 0) > 0 ? 'font-medium' : 'text-gray-400'}>
          ₪{Number(customer.totalSpent || 0).toFixed(0)}
        </span>
      ),
    },
    {
      key: 'credit',
      header: 'קרדיט',
      width: '90px',
      align: 'center',
      render: (customer) => (
        <span className={`font-medium ${
          Number(customer.creditBalance) > 0 
            ? 'text-blue-600' 
            : 'text-gray-400'
        }`}>
          ₪{Number(customer.creditBalance || 0).toFixed(0)}
        </span>
      ),
    },
    {
      key: 'joined',
      header: 'נוצר',
      width: '80px',
      align: 'center',
      render: (customer) => (
        <span className="text-gray-500 text-sm">{formatDate(customer.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      align: 'left',
      render: (customer) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/shops/${storeSlug}/admin/customers/${customer.id}`}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="צפה"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
          {customer.tags.includes('customer') && (
            <Link
              href={`/shops/${storeSlug}/admin/orders?search=${encodeURIComponent(customer.email)}`}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="הזמנות"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </Link>
          )}
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
    <>
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
            description={searchValue ? 'לא נמצאו לקוחות התואמים לחיפוש' : 'עדיין אין לקוחות רשומים'}
          />
        }
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        count={pendingDeleteIds.length}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteModal(false);
          setPendingDeleteIds([]);
        }}
        isDeleting={isDeleting}
      />
    </>
  );
}
