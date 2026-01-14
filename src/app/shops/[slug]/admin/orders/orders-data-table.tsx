'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DataTable, Badge, EmptyState } from '@/components/admin/ui';
import type { Column, Tab, BulkAction } from '@/components/admin/ui';
import { printOrders, printOrder } from '@/lib/print-order';
import { archiveOrders, permanentlyDeleteOrders, unarchiveOrders } from './actions';
import { PerPageSelector } from './per-page-selector';

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
  shipmentError: string | null;
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
  sortOrder?: 'newest' | 'oldest';
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
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} | ${hours}:${minutes}`;
}


export function OrdersDataTable({
  orders,
  storeSlug,
  tabs,
  currentTab,
  searchValue,
  sortOrder = 'newest',
  pagination,
}: OrdersDataTableProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ordersToDelete, setOrdersToDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  const isArchiveTab = currentTab === 'archived';

  // Handle sort change
  const handleSortChange = (newSort: 'newest' | 'oldest') => {
    const url = new URL(window.location.href);
    url.searchParams.set('sortOrder', newSort);
    url.searchParams.set('page', '1'); // Reset to first page
    router.push(url.pathname + url.search);
    setShowSortMenu(false);
  };

  // Handle permanent delete confirmation
  const handleDeleteConfirm = async () => {
    if (ordersToDelete.length === 0) return;
    
    setIsDeleting(true);
    try {
      await permanentlyDeleteOrders(ordersToDelete);
      router.refresh();
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setOrdersToDelete([]);
    }
  };

  // Base bulk actions (for all tabs)
  const baseBulkActions: BulkAction[] = [
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
      id: 'print-orders',
      label: 'הדפס הזמנות',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 6 2 18 2 18 9"/>
          <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        printOrders(storeSlug, selectedIds);
      },
    },
  ];

  // Archive-specific bulk actions
  const archiveBulkActions: BulkAction[] = [
    ...baseBulkActions,
    {
      id: 'unarchive',
      label: 'שחזר מארכיון',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        await unarchiveOrders(selectedIds);
        router.refresh();
      },
    },
    {
      id: 'permanent-delete',
      label: 'מחק לצמיתות',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      ),
      variant: 'danger' as const,
      onAction: async (selectedIds) => {
        setOrdersToDelete(selectedIds);
        setShowDeleteModal(true);
      },
    },
  ];

  // Regular bulk actions (not archived)
  const regularBulkActions: BulkAction[] = [
    ...baseBulkActions,
    {
      id: 'archive',
      label: 'העבר לארכיון',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="21 8 21 21 3 21 3 8"/>
          <rect x="1" y="3" width="22" height="5"/>
          <line x1="10" y1="12" x2="14" y2="12"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        await archiveOrders(selectedIds);
        router.refresh();
      },
    },
  ];

  const bulkActions = isArchiveTab ? archiveBulkActions : regularBulkActions;

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
      width: '200px',
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
      width: '120px',
      align: 'center',
      render: (order) => (
        <div className="flex items-center justify-center gap-1">
          {order.shipmentError && (
            <span 
              className="text-red-500 cursor-help" 
              title={`שגיאת שליחה: ${order.shipmentError}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </span>
          )}
          <Badge variant={order.shipmentError ? 'error' : getFulfillmentVariant(order.fulfillmentStatus)}>
            {order.shipmentError ? 'שגיאה' : fulfillmentLabels[order.fulfillmentStatus || 'unfulfilled']}
          </Badge>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'סכום',
      width: '100px',
      align: 'left',
      render: (order) => (
        <span className="font-medium">₪{Number(order.total).toFixed(2)}</span>
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
      width: '100px',
      align: 'left',
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
            onClick={() => printOrder(storeSlug, order.id)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
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
    <>
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
        paginationExtra={
          <div className="flex items-center gap-3">
            {/* Sort Button */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                {sortOrder === 'newest' ? 'חדש לישן' : 'ישן לחדש'}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute left-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[160px]">
                    <button
                      onClick={() => handleSortChange('newest')}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-right hover:bg-gray-50 ${sortOrder === 'newest' ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      חדש לישן
                      {sortOrder === 'newest' && (
                        <svg className="w-4 h-4 mr-auto text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleSortChange('oldest')}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-right hover:bg-gray-50 ${sortOrder === 'oldest' ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      ישן לחדש
                      {sortOrder === 'oldest' && (
                        <svg className="w-4 h-4 mr-auto text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
            
            <PerPageSelector currentPerPage={pagination.perPage} />
          </div>
        }
        emptyState={
          <EmptyState
            icon="orders"
            title="אין הזמנות"
            description={searchValue ? 'לא נמצאו הזמנות התואמות לחיפוש' : 'עדיין לא התקבלו הזמנות בחנות'}
          />
        }
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Warning Icon */}
            <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              מחיקה לצמיתות
            </h3>
            
            {/* Description */}
            <p className="text-gray-600 text-center mb-2">
              האם אתה בטוח שברצונך למחוק{' '}
              <span className="font-semibold text-gray-900">
                {ordersToDelete.length} הזמנות
              </span>
              ?
            </p>
            
            {/* Warning */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-red-700 text-center font-medium">
                ⚠️ שים לב: זוהי פעולה בלתי הפיכה!
              </p>
              <p className="text-xs text-red-600 text-center mt-1">
                ההזמנות יימחקו לצמיתות מהמסד ולא ניתן יהיה לשחזר אותן.
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                ביטול
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    מוחק...
                  </>
                ) : (
                  'מחק לצמיתות'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
