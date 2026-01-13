import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, desc, and, isNull, or } from 'drizzle-orm';
import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MarkReadButton, MarkAllReadButton } from './notification-buttons';

export const dynamic = 'force-dynamic';

interface NotificationsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string }>;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'עכשיו';
  if (minutes < 60) return `לפני ${minutes} דקות`;
  if (hours < 24) return `לפני ${hours} שעות`;
  if (days === 1) return 'אתמול';
  if (days < 7) return `לפני ${days} ימים`;
  
  return date.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function getNotificationIcon(type: string): { icon: string; bgColor: string; textColor: string } {
  switch (type) {
    case 'new_order':
      return { icon: '🛒', bgColor: 'bg-blue-100', textColor: 'text-blue-600' };
    case 'low_stock':
      return { icon: '⚠️', bgColor: 'bg-amber-100', textColor: 'text-amber-600' };
    case 'out_of_stock':
      return { icon: '❌', bgColor: 'bg-red-100', textColor: 'text-red-600' };
    case 'new_customer':
      return { icon: '👤', bgColor: 'bg-green-100', textColor: 'text-green-600' };
    case 'order_cancelled':
      return { icon: '🚫', bgColor: 'bg-gray-100', textColor: 'text-gray-600' };
    default:
      return { icon: '🔔', bgColor: 'bg-gray-100', textColor: 'text-gray-600' };
  }
}

function getNotificationLink(notification: { resourceType: string | null; resourceId: string | null }, storeSlug: string): string | null {
  if (!notification.resourceType || !notification.resourceId) return null;
  
  switch (notification.resourceType) {
    case 'order':
      return `/shops/${storeSlug}/admin/orders/${notification.resourceId}`;
    case 'product':
      return `/shops/${storeSlug}/admin/products/${notification.resourceId}`;
    case 'customer':
      return `/shops/${storeSlug}/admin/contacts?type=customer`;
    default:
      return null;
  }
}

export default async function NotificationsPage({ params, searchParams }: NotificationsPageProps) {
  const { slug } = await params;
  const { filter = 'all' } = await searchParams;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get notifications
  let notificationsList = await db
    .select()
    .from(notifications)
    .where(eq(notifications.storeId, store.id))
    .orderBy(desc(notifications.createdAt))
    .limit(100);

  // Filter
  if (filter === 'unread') {
    notificationsList = notificationsList.filter(n => !n.isRead);
  } else if (filter !== 'all') {
    notificationsList = notificationsList.filter(n => n.type === filter);
  }

  // Stats
  const unreadCount = notificationsList.filter(n => !n.isRead).length;
  
  // Group by date
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  const grouped = {
    today: notificationsList.filter(n => n.createdAt.toDateString() === today),
    yesterday: notificationsList.filter(n => n.createdAt.toDateString() === yesterday),
    older: notificationsList.filter(n => 
      n.createdAt.toDateString() !== today && 
      n.createdAt.toDateString() !== yesterday
    ),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">מרכז התראות</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} התראות שלא נקראו` : 'אין התראות חדשות'}
          </p>
        </div>
        {unreadCount > 0 && (
          <MarkAllReadButton storeId={store.id} />
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <FilterButton href={`/shops/${slug}/admin/notifications?filter=all`} active={filter === 'all'} label="הכל" />
        <FilterButton href={`/shops/${slug}/admin/notifications?filter=unread`} active={filter === 'unread'} label="לא נקראו" />
        <FilterButton href={`/shops/${slug}/admin/notifications?filter=new_order`} active={filter === 'new_order'} label="הזמנות" />
        <FilterButton href={`/shops/${slug}/admin/notifications?filter=low_stock`} active={filter === 'low_stock'} label="מלאי" />
        <FilterButton href={`/shops/${slug}/admin/notifications?filter=new_customer`} active={filter === 'new_customer'} label="לקוחות" />
      </div>

      {/* Notifications List */}
      {notificationsList.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">אין התראות</h3>
          <p className="mt-1 text-sm text-gray-500">
            כשיהיו הזמנות חדשות או עדכונים, הם יופיעו כאן
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today */}
          {grouped.today.length > 0 && (
            <NotificationGroup 
              title="היום" 
              notifications={grouped.today} 
              storeSlug={slug}
            />
          )}

          {/* Yesterday */}
          {grouped.yesterday.length > 0 && (
            <NotificationGroup 
              title="אתמול" 
              notifications={grouped.yesterday} 
              storeSlug={slug}
            />
          )}

          {/* Older */}
          {grouped.older.length > 0 && (
            <NotificationGroup 
              title="קודם" 
              notifications={grouped.older} 
              storeSlug={slug}
            />
          )}
        </div>
      )}
    </div>
  );
}

function FilterButton({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 text-sm rounded-lg transition-colors ${
        active
          ? 'bg-black text-white'
          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {label}
    </Link>
  );
}

interface NotificationGroupProps {
  title: string;
  notifications: Array<{
    id: string;
    type: 'new_order' | 'low_stock' | 'out_of_stock' | 'new_customer' | 'order_cancelled' | 'system';
    title: string;
    message: string | null;
    resourceId: string | null;
    resourceType: string | null;
    isRead: boolean;
    createdAt: Date;
  }>;
  storeSlug: string;
}

function NotificationGroup({ title, notifications, storeSlug }: NotificationGroupProps) {
  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500 mb-3">{title}</h2>
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
        {notifications.map((notification) => {
          const { icon, bgColor, textColor } = getNotificationIcon(notification.type);
          const link = getNotificationLink(notification, storeSlug);

          return (
            <div 
              key={notification.id}
              className={`p-4 flex items-start gap-4 ${
                notification.isRead ? '' : 'bg-blue-50/50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0`}>
                <span className="text-lg">{icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </div>
                {link && (
                  <Link 
                    href={link}
                    className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                  >
                    צפה בפרטים ←
                  </Link>
                )}
              </div>
              {!notification.isRead && (
                <MarkReadButton notificationId={notification.id} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}



