'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { DataTable, Badge, EmptyState } from '@/components/admin/ui';
import type { Column, Tab, BulkAction } from '@/components/admin/ui';
import { markContactAsRead, updateContactStatus, deleteContact, markAllAsRead } from './actions';
// Contact with customer relation - flexible type for customers tab
interface ContactWithCustomer {
  id: string;
  storeId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  type: 'newsletter' | 'club_member' | 'contact_form' | 'popup_form' | 'customer';
  status: 'active' | 'unsubscribed' | 'spam';
  source: string | null;
  sourceUrl?: string | null;
  popupId?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: unknown;
  customerId: string | null;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    totalOrders: number | null;
    totalSpent: string | null;
  } | null;
}

interface ContactsDataTableProps {
  contacts: ContactWithCustomer[];
  storeId: string;
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

const typeLabels: Record<string, { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'purple' }> = {
  customer: { label: 'לקוח', color: 'success' },
  newsletter: { label: 'ניוזלטר', color: 'info' },
  club_member: { label: 'מועדון', color: 'purple' },
  contact_form: { label: 'יצירת קשר', color: 'warning' },
  popup_form: { label: 'פופאפ', color: 'default' },
};

// תרגום ערכי מקור (source) לעברית
const sourceLabels: Record<string, string> = {
  checkout: 'צ׳קאאוט',
  contact_page: 'עמוד יצירת קשר',
  registration: 'הרשמה',
  popup: 'פופאפ',
  newsletter: 'ניוזלטר',
  import: 'יבוא',
  manual: 'ידני',
  api: 'API',
  homepage: 'עמוד הבית',
  product_page: 'עמוד מוצר',
  category_page: 'עמוד קטגוריה',
  cart: 'עגלה',
  account: 'אזור אישי',
};

const statusLabels: Record<string, { label: string; color: 'default' | 'success' | 'warning' | 'error' }> = {
  active: { label: 'פעיל', color: 'success' },
  unsubscribed: { label: 'הוסר', color: 'default' },
  spam: { label: 'ספאם', color: 'error' },
};

export function ContactsDataTable({
  contacts,
  storeId,
  tabs,
  currentTab,
  searchValue,
  pagination,
}: ContactsDataTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleMarkAsRead = async (contactId: string) => {
    startTransition(async () => {
      await markContactAsRead(contactId, storeId);
      router.refresh();
    });
  };

  const handleMarkAllAsRead = async () => {
    startTransition(async () => {
      await markAllAsRead(storeId, currentTab !== 'all' ? currentTab as 'newsletter' | 'club_member' | 'contact_form' | 'popup_form' : undefined);
      router.refresh();
    });
  };

  const bulkActions: BulkAction[] = [
    {
      id: 'mark_read',
      label: 'סמן כנקרא',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        for (const id of selectedIds) {
          await markContactAsRead(id, storeId);
        }
        router.refresh();
      },
    },
    {
      id: 'unsubscribe',
      label: 'הסר מרשימה',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" strokeLinecap="round"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        for (const id of selectedIds) {
          await updateContactStatus(id, storeId, 'unsubscribed');
        }
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
        if (!confirm(`האם למחוק ${selectedIds.length} אנשי קשר?`)) return;
        for (const id of selectedIds) {
          await deleteContact(id, storeId);
        }
        router.refresh();
      },
    },
  ];

  const columns: Column<ContactWithCustomer>[] = [
    {
      key: 'contact',
      header: 'איש קשר',
      render: (contact) => (
        <div 
          className={`flex items-center gap-3 cursor-pointer ${!contact.isRead ? 'font-medium' : ''}`}
          onClick={() => {
            if (!contact.isRead) {
              handleMarkAsRead(contact.id);
            }
            setExpandedId(expandedId === contact.id ? null : contact.id);
          }}
        >
          {/* Unread indicator */}
          {!contact.isRead && (
            <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
          )}
          
          {/* Avatar */}
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-gray-600 font-medium text-sm">
              {(contact.firstName?.[0] || contact.email[0]).toUpperCase()}
            </span>
          </div>
          
          {/* Info */}
          <div className="min-w-0">
            <p className={`text-gray-900 truncate ${!contact.isRead ? 'font-semibold' : ''}`}>
              {contact.firstName || contact.lastName 
                ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                : contact.email}
            </p>
            {(contact.firstName || contact.lastName) && (
              <p className="text-sm text-gray-500 truncate">{contact.email}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'טלפון',
      width: '130px',
      render: (contact) => (
        <span className="text-gray-600 text-sm">
          {contact.phone || '-'}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'סוג',
      width: '110px',
      align: 'center',
      render: (contact) => {
        const typeInfo = typeLabels[contact.type] || { label: contact.type, color: 'default' as const };
        return (
          <Badge variant={typeInfo.color}>
            {typeInfo.label}
          </Badge>
        );
      },
    },
    {
      key: 'customer',
      header: 'לקוח',
      width: '100px',
      align: 'center',
      render: (contact) => {
        const orders = contact.customer?.totalOrders || 0;
        // לקוח = רק מי שרכש לפחות פעם אחת
        if (orders === 0) {
          return <span className="text-gray-400 text-sm">-</span>;
        }
        return (
          <div className="text-center">
            <Badge variant="success">לקוח</Badge>
            <p className="text-xs text-gray-500 mt-0.5">{orders} הזמנות</p>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'סטטוס',
      width: '90px',
      align: 'center',
      render: (contact) => {
        const statusInfo = statusLabels[contact.status] || { label: contact.status, color: 'default' as const };
        return (
          <Badge variant={statusInfo.color}>
            {statusInfo.label}
          </Badge>
        );
      },
    },
    {
      key: 'source',
      header: 'מקור',
      width: '120px',
      render: (contact) => (
        <span className="text-gray-500 text-sm">
          {contact.source ? (sourceLabels[contact.source] || contact.source) : '-'}
        </span>
      ),
    },
    {
      key: 'message',
      header: 'הודעה',
      width: '250px',
      render: (contact) => {
        const metadata = (contact.metadata || {}) as { message?: string };
        const message = metadata.message;
        if (!message) return <span className="text-gray-400 text-sm">-</span>;
        
        const isLong = message.length > 40;
        const truncated = isLong ? message.slice(0, 40) + '...' : message;
        
        return (
          <div className="group relative">
            <p className="text-gray-600 text-sm">
              {truncated}
            </p>
            {/* Full message popup on hover */}
            {isLong && (
              <div className="hidden group-hover:block absolute z-50 top-full right-0 mt-1 p-3 bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm whitespace-pre-wrap text-sm text-gray-700">
                {message}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'date',
      header: 'תאריך',
      width: '100px',
      render: (contact) => (
        <span className="text-gray-500 text-sm">
          {new Date(contact.createdAt).toLocaleDateString('he-IL')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      align: 'left',
      render: (contact) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <ContactActions 
            contact={contact} 
            storeId={storeId} 
            onUpdate={() => router.refresh()}
          />
        </div>
      ),
    },
  ];

  // Custom row rendering to show expanded details
  const renderExpandedRow = (contact: ContactWithCustomer) => {
    if (expandedId !== contact.id) return null;
    
    const metadata = (contact.metadata || {}) as { subject?: string; message?: string; [key: string]: unknown };
    const hasMetadata = Object.keys(metadata).length > 0;
    const subject = metadata.subject;
    const message = metadata.message;
    
    return (
      <tr className="bg-gray-50">
        <td colSpan={8} className="px-6 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Contact Details */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">פרטי קשר</h4>
              <dl className="space-y-1">
                <div className="flex gap-2">
                  <dt className="text-gray-500">אימייל:</dt>
                  <dd className="text-gray-900">{contact.email}</dd>
                </div>
                {contact.phone && (
                  <div className="flex gap-2">
                    <dt className="text-gray-500">טלפון:</dt>
                    <dd className="text-gray-900">{contact.phone}</dd>
                  </div>
                )}
                {contact.source && (
                  <div className="flex gap-2">
                    <dt className="text-gray-500">מקור:</dt>
                    <dd className="text-gray-900">{contact.source}</dd>
                  </div>
                )}
              </dl>
            </div>
            
            {/* Metadata / Message */}
            {hasMetadata && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">מידע נוסף</h4>
                <dl className="space-y-1">
                  {subject && (
                    <div className="flex gap-2">
                      <dt className="text-gray-500">נושא:</dt>
                      <dd className="text-gray-900">{String(subject)}</dd>
                    </div>
                  )}
                  {message && (
                    <div>
                      <dt className="text-gray-500 mb-1">הודעה:</dt>
                      <dd className="text-gray-900 bg-white p-3 rounded border border-gray-200 whitespace-pre-wrap">
                        {String(message)}
                      </dd>
                    </div>
                  )}
                  {/* Other metadata fields */}
                  {Object.entries(metadata).map(([key, value]) => {
                    if (key === 'subject' || key === 'message') return null;
                    return (
                      <div key={key} className="flex gap-2">
                        <dt className="text-gray-500">{key}:</dt>
                        <dd className="text-gray-900">{String(value)}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div>
      {/* Mark all as read button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleMarkAllAsRead}
          disabled={isPending}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          סמן הכל כנקרא
        </button>
      </div>

      <DataTable
        data={contacts}
        columns={columns}
        getRowKey={(contact) => contact.id}
        tabs={tabs}
        currentTab={currentTab}
        tabParamName="type"
        selectable
        bulkActions={bulkActions}
        searchable
        searchPlaceholder="חיפוש לפי שם, אימייל או טלפון..."
        searchValue={searchValue}
        pagination={pagination}
        emptyState={
          <EmptyState
            icon="users"
            title="אין אנשי קשר"
            description={searchValue ? 'לא נמצאו אנשי קשר התואמים לחיפוש' : 'אנשי קשר יופיעו כאן כשמישהו ימלא טופס'}
          />
        }
      />
    </div>
  );
}

// Actions dropdown component
function ContactActions({ 
  contact, 
  storeId, 
  onUpdate 
}: { 
  contact: ContactWithCustomer; 
  storeId: string; 
  onUpdate: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (status: 'active' | 'unsubscribed' | 'spam') => {
    startTransition(async () => {
      await updateContactStatus(contact.id, storeId, status);
      setIsOpen(false);
      onUpdate();
    });
  };

  const handleDelete = () => {
    if (!confirm('האם למחוק את איש הקשר?')) return;
    startTransition(async () => {
      await deleteContact(contact.id, storeId);
      setIsOpen(false);
      onUpdate();
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        disabled={isPending}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px]">
            {contact.status !== 'active' && (
              <button
                onClick={() => handleStatusChange('active')}
                className="w-full px-4 py-2 text-sm text-right text-gray-700 hover:bg-gray-50"
              >
                סמן כפעיל
              </button>
            )}
            {contact.status !== 'unsubscribed' && (
              <button
                onClick={() => handleStatusChange('unsubscribed')}
                className="w-full px-4 py-2 text-sm text-right text-gray-700 hover:bg-gray-50"
              >
                הסר מרשימה
              </button>
            )}
            {contact.status !== 'spam' && (
              <button
                onClick={() => handleStatusChange('spam')}
                className="w-full px-4 py-2 text-sm text-right text-gray-700 hover:bg-gray-50"
              >
                סמן כספאם
              </button>
            )}
            <hr className="my-1" />
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-sm text-right text-red-600 hover:bg-red-50"
            >
              מחק
            </button>
          </div>
        </>
      )}
    </div>
  );
}

