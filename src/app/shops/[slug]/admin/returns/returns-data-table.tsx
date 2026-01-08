'use client';

import { useRouter } from 'next/navigation';
import { DataTable, Column, Tab, BulkAction } from '@/components/admin/ui/data-table';

type ReturnRequest = {
  id: string;
  requestNumber: string;
  type: string;
  status: string;
  reason: string;
  requestedResolution: string;
  totalValue: string;
  items: unknown;
  createdAt: Date;
  orderNumber: string;
  customerName: string | null;
  customerLastName: string | null;
  customerEmail: string | null;
};

interface ReturnsDataTableProps {
  requests: ReturnRequest[];
  storeSlug: string;
  tabs: Tab[];
  currentTab: string;
  searchValue?: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'ממתין', color: 'bg-amber-100 text-amber-700' },
  under_review: { label: 'בבדיקה', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'אושר', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'נדחה', color: 'bg-red-100 text-red-700' },
  awaiting_shipment: { label: 'ממתין לשליחה', color: 'bg-purple-100 text-purple-700' },
  item_received: { label: 'התקבל', color: 'bg-indigo-100 text-indigo-700' },
  completed: { label: 'הושלם', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'בוטל', color: 'bg-gray-100 text-gray-600' },
};

const typeLabels: Record<string, string> = {
  return: 'החזרה',
  exchange: 'החלפה',
};

const reasonLabels: Record<string, string> = {
  wrong_size: 'מידה לא מתאימה',
  defective: 'פגם במוצר',
  not_as_described: 'לא כמתואר',
  changed_mind: 'שינוי דעה',
  wrong_item: 'מוצר שגוי',
  damaged_shipping: 'נזק במשלוח',
  other: 'אחר',
};

const resolutionLabels: Record<string, string> = {
  exchange: 'החלפה',
  store_credit: 'קרדיט',
  refund: 'זיכוי',
  partial_refund: 'זיכוי חלקי',
};

export function ReturnsDataTable({
  requests,
  storeSlug,
  tabs,
  currentTab,
  searchValue,
}: ReturnsDataTableProps) {
  const router = useRouter();

  const columns: Column<ReturnRequest>[] = [
    {
      key: 'requestNumber',
      header: 'מס\' בקשה',
      width: '110px',
      render: (request) => (
        <span className="font-medium text-gray-900">{request.requestNumber}</span>
      ),
    },
    {
      key: 'orderNumber',
      header: 'הזמנה',
      width: '100px',
      render: (request) => (
        <span className="text-gray-600">#{request.orderNumber}</span>
      ),
    },
    {
      key: 'customer',
      header: 'לקוח',
      render: (request) => (
        <div>
          <p className="font-medium text-gray-900">
            {request.customerName} {request.customerLastName}
          </p>
          {request.customerEmail && (
            <p className="text-xs text-gray-500">{request.customerEmail}</p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'סוג',
      width: '80px',
      render: (request) => (
        <span className="text-gray-600 text-sm">{typeLabels[request.type] || request.type}</span>
      ),
    },
    {
      key: 'reason',
      header: 'סיבה',
      width: '120px',
      render: (request) => (
        <span className="text-gray-600 text-sm">{reasonLabels[request.reason] || request.reason}</span>
      ),
    },
    {
      key: 'resolution',
      header: 'פתרון מבוקש',
      width: '100px',
      render: (request) => (
        <span className="text-gray-600 text-sm">{resolutionLabels[request.requestedResolution]}</span>
      ),
    },
    {
      key: 'totalValue',
      header: 'סכום',
      width: '90px',
      render: (request) => (
        <span className="font-medium">₪{Number(request.totalValue).toFixed(2)}</span>
      ),
    },
    {
      key: 'status',
      header: 'סטטוס',
      width: '110px',
      render: (request) => {
        const status = statusLabels[request.status] || statusLabels.pending;
        return (
          <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${status.color}`}>
            {status.label}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'תאריך',
      width: '100px',
      render: (request) => (
        <span className="text-gray-500 text-sm">
          {new Date(request.createdAt).toLocaleDateString('he-IL')}
        </span>
      ),
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      id: 'approve',
      label: 'אשר בקשות',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        // TODO: Implement bulk approve
        console.log('Approve:', selectedIds);
      },
    },
    {
      id: 'reject',
      label: 'דחה בקשות',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        // TODO: Implement bulk reject
        console.log('Reject:', selectedIds);
      },
    },
  ];

  return (
    <DataTable<ReturnRequest>
      data={requests}
      columns={columns}
      getRowKey={(request: ReturnRequest) => request.id}
      getRowHref={(request: ReturnRequest) => `/shops/${storeSlug}/admin/returns/${request.id}`}
      tabs={tabs}
      currentTab={currentTab}
      searchValue={searchValue}
      searchPlaceholder="חיפוש בקשות..."
      bulkActions={bulkActions}
      emptyState={
        <div className="text-center py-8">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 mx-auto mb-4">
            <path d="M9 14l-4-4 4-4"/>
            <path d="M5 10h11a4 4 0 1 1 0 8h-1"/>
          </svg>
          <h3 className="text-lg font-medium text-gray-700 mb-1">אין בקשות</h3>
          <p className="text-sm text-gray-500">לא נמצאו בקשות החזרה או החלפה</p>
        </div>
      }
    />
  );
}

