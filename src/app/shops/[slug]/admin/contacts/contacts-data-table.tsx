'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, useCallback, useRef } from 'react';
import { DataTable, Badge, EmptyState } from '@/components/admin/ui';
import type { Column, Tab, BulkAction } from '@/components/admin/ui';
import { markContactAsRead, updateContactStatus, deleteContact, markAllAsRead } from './actions';

// 📧 Modal לצפייה בהודעה
function MessageModal({ 
  isOpen, 
  onClose, 
  contact 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  contact: { 
    firstName: string | null; 
    lastName: string | null; 
    email: string; 
    metadata?: unknown;
    createdAt: Date;
  } | null;
}) {
  if (!isOpen || !contact) return null;
  
  const metadata = (contact.metadata || {}) as { subject?: string; message?: string; tag?: string };
  const message = metadata.message || '';
  const subject = metadata.subject;
  const tag = metadata.tag;
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">הודעה מ{name}</h3>
                {tag && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                    {tag}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {new Date(contact.createdAt).toLocaleDateString('he-IL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
            {subject && (
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-500">נושא:</span>
                <p className="text-gray-900 mt-1">{subject}</p>
              </div>
            )}
            
            <div>
              <span className="text-sm font-medium text-gray-500">הודעה:</span>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {message || 'אין הודעה'}
                </p>
              </div>
            </div>
            
            {/* Contact info */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-500">
              <a 
                href={`mailto:${contact.email}`}
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <path d="M22 6l-10 7L2 6"/>
                </svg>
                {contact.email}
              </a>
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              סגור
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
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
  // 📧 State for message modal
  const [messageModalContact, setMessageModalContact] = useState<ContactWithCustomer | null>(null);
  
  const handleViewMessage = useCallback((contact: ContactWithCustomer) => {
    setMessageModalContact(contact);
  }, []);

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
      width: '180px',
      render: (contact) => {
        const metadata = (contact.metadata || {}) as { tag?: string };
        const tag = metadata.tag;
        return (
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
            
            {/* Name + Tag */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-gray-900 truncate ${!contact.isRead ? 'font-semibold' : ''}`}>
                  {contact.firstName || contact.lastName 
                    ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                    : '-'}
                </p>
                {tag && (
                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-medium rounded-full whitespace-nowrap">
                    {tag}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'email',
      header: 'אימייל',
      width: '160px',
      render: (contact) => (
        <a 
          href={`mailto:${contact.email}`}
          className="text-blue-600 hover:underline text-sm truncate block"
          onClick={(e) => e.stopPropagation()}
        >
          {contact.email}
        </a>
      ),
    },
    {
      key: 'phone',
      header: 'טלפון',
      width: '110px',
      render: (contact) => (
        <span className="text-gray-600 text-sm">
          {contact.phone || '-'}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'סוג',
      width: '90px',
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
      width: '80px',
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
      width: '80px',
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
      width: '100px',
      render: (contact) => (
        <span className="text-gray-500 text-sm">
          {contact.source ? (sourceLabels[contact.source] || contact.source) : '-'}
        </span>
      ),
    },
    // 📧 עמודת הודעה הוסרה - הודעות נראות דרך תפריט 3 נקודות
    {
      key: 'date',
      header: 'תאריך',
      width: '90px',
      render: (contact) => (
        <span className="text-gray-500 text-sm">
          {new Date(contact.createdAt).toLocaleDateString('he-IL')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      align: 'left',
      render: (contact) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <ContactActions 
            contact={contact} 
            storeId={storeId} 
            onUpdate={() => router.refresh()}
            onViewMessage={() => handleViewMessage(contact)}
          />
        </div>
      ),
    },
  ];

  // Custom row rendering to show expanded details
  const renderExpandedRow = (contact: ContactWithCustomer) => {
    if (expandedId !== contact.id) return null;
    
    const metadata = (contact.metadata || {}) as { subject?: string; message?: string; tag?: string; [key: string]: unknown };
    const hasMetadata = Object.keys(metadata).length > 0;
    const subject = metadata.subject;
    const message = metadata.message;
    const tag = metadata.tag;
    
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
                  {tag && (
                    <div className="flex gap-2 items-center">
                      <dt className="text-gray-500">תגית:</dt>
                      <dd>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                          {tag}
                        </span>
                      </dd>
                    </div>
                  )}
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
                    if (key === 'subject' || key === 'message' || key === 'tag' || key === 'sectionId') return null;
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
      {/* 📧 Message Modal */}
      <MessageModal 
        isOpen={!!messageModalContact}
        onClose={() => setMessageModalContact(null)}
        contact={messageModalContact}
      />
      
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
  onUpdate,
  onViewMessage,
}: { 
  contact: ContactWithCustomer; 
  storeId: string; 
  onUpdate: () => void;
  onViewMessage: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // בדיקה אם יש הודעה
  const metadata = (contact.metadata || {}) as { message?: string };
  const hasMessage = !!metadata.message;

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left - 110, // Adjust for dropdown width
      });
    }
    setIsOpen(!isOpen);
  };

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
        ref={buttonRef}
        onClick={handleToggle}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        disabled={isPending}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
          <div 
            className="fixed z-[101] bg-white border border-gray-200 rounded-xl shadow-xl py-2 min-w-[180px]"
            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
          >
            {/* 📧 צפיה בהודעה - רק אם יש הודעה */}
            {hasMessage && (
              <>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onViewMessage();
                  }}
                  className="w-full px-4 py-2.5 text-sm text-right text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <path d="M22 6l-10 7L2 6"/>
                  </svg>
                  צפיה בהודעה
                </button>
                <div className="mx-3 border-t border-gray-100" />
              </>
            )}
            
            {contact.status !== 'active' && (
              <button
                onClick={() => handleStatusChange('active')}
                className="w-full px-4 py-2.5 text-sm text-right text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                סמן כפעיל
              </button>
            )}
            {contact.status !== 'unsubscribed' && (
              <button
                onClick={() => handleStatusChange('unsubscribed')}
                className="w-full px-4 py-2.5 text-sm text-right text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                הסר מרשימה
              </button>
            )}
            {contact.status !== 'spam' && (
              <button
                onClick={() => handleStatusChange('spam')}
                className="w-full px-4 py-2.5 text-sm text-right text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                סמן כספאם
              </button>
            )}
            <div className="mx-3 border-t border-gray-100 my-1" />
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2.5 text-sm text-right text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              מחק
            </button>
          </div>
        </>
      )}
    </div>
  );
}

