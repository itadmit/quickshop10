import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { activityLog, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const actionLabels: Record<string, string> = {
  'product.created': 'יצירת מוצר',
  'product.updated': 'עדכון מוצר',
  'product.deleted': 'מחיקת מוצר',
  'order.created': 'הזמנה חדשה',
  'order.updated': 'עדכון הזמנה',
  'order.cancelled': 'ביטול הזמנה',
  'order.fulfilled': 'שליחת הזמנה',
  'category.created': 'יצירת קטגוריה',
  'category.updated': 'עדכון קטגוריה',
  'category.deleted': 'מחיקת קטגוריה',
  'coupon.created': 'יצירת קופון',
  'coupon.updated': 'עדכון קופון',
  'coupon.deleted': 'מחיקת קופון',
  'settings.updated': 'עדכון הגדרות',
  'page.created': 'יצירת עמוד',
  'page.updated': 'עדכון עמוד',
  'page.deleted': 'מחיקת עמוד',
  'team.invited': 'הזמנת חבר צוות',
  'team.removed': 'הסרת חבר צוות',
  'login': 'התחברות',
  'logout': 'התנתקות',
};

const resourceTypeLabels: Record<string, string> = {
  product: 'מוצר',
  order: 'הזמנה',
  category: 'קטגוריה',
  coupon: 'קופון',
  page: 'עמוד',
  settings: 'הגדרות',
  team: 'צוות',
  user: 'משתמש',
};

export default async function ActivityLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const currentPage = parseInt(pageParam || '1');
  const limit = 50;
  const offset = (currentPage - 1) * limit;

  // Get activity logs with user info
  const logs = await db
    .select({
      id: activityLog.id,
      action: activityLog.action,
      resourceType: activityLog.resourceType,
      resourceId: activityLog.resourceId,
      description: activityLog.description,
      changes: activityLog.changes,
      ipAddress: activityLog.ipAddress,
      createdAt: activityLog.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(activityLog)
    .leftJoin(users, eq(users.id, activityLog.userId))
    .where(eq(activityLog.storeId, store.id))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit)
    .offset(offset);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'הרגע';
    if (minutes < 60) return `לפני ${minutes} דקות`;
    if (hours < 24) return `לפני ${hours} שעות`;
    if (days < 7) return `לפני ${days} ימים`;
    return date.toLocaleDateString('he-IL');
  };

  const getActionIcon = (action: string) => {
    if (action.includes('created')) return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M7 1v12M1 7h12" />
      </svg>
    );
    if (action.includes('updated')) return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10.33 1.67a1.57 1.57 0 012.22 2.22L4.17 12.27 1 13l.73-3.17L10.33 1.67z" />
      </svg>
    );
    if (action.includes('deleted')) return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1.75 3.5h10.5M4.67 3.5V2.33a1.17 1.17 0 011.16-1.16h2.34a1.17 1.17 0 011.16 1.16V3.5m1.75 0v8.17a1.17 1.17 0 01-1.16 1.16H4.08a1.17 1.17 0 01-1.16-1.16V3.5h8.16z" />
      </svg>
    );
    if (action.includes('login') || action.includes('logout')) return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9.33 4.67v-1.5a1.17 1.17 0 00-1.16-1.17H3.33a1.17 1.17 0 00-1.16 1.17v7.66a1.17 1.17 0 001.16 1.17h4.84a1.17 1.17 0 001.16-1.17V9.33M5.83 7h6.84M10.5 4.67L12.67 7l-2.17 2.33" />
      </svg>
    );
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="7" cy="7" r="5.5" />
        <path d="M7 4.5v3l2 1" />
      </svg>
    );
  };

  const getActionColor = (action: string) => {
    if (action.includes('created')) return 'text-green-600 bg-green-50';
    if (action.includes('updated')) return 'text-blue-600 bg-blue-50';
    if (action.includes('deleted') || action.includes('cancelled')) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">יומן פעילות</h1>
        <p className="text-gray-500 text-sm mt-1">היסטוריית פעולות בחנות</p>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-xl border border-gray-200">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 8v4l3 3M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
            <p>אין פעילות עדיין</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getActionColor(log.action)}`}>
                    {getActionIcon(log.action)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {actionLabels[log.action] || log.action}
                      </span>
                      {log.resourceType && (
                        <span className="text-sm text-gray-500">
                          • {resourceTypeLabels[log.resourceType] || log.resourceType}
                        </span>
                      )}
                    </div>
                    
                    {log.description && (
                      <p className="text-sm text-gray-600 mt-0.5">{log.description}</p>
                    )}
                    
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{formatTime(log.createdAt)}</span>
                      {log.userName || log.userEmail ? (
                        <span>• {log.userName || log.userEmail}</span>
                      ) : null}
                      {log.ipAddress && (
                        <span className="font-mono">{log.ipAddress}</span>
                      )}
                    </div>
                  </div>

                  {log.resourceId && log.resourceType && (
                    <Link
                      href={getResourceLink(slug, log.resourceType, log.resourceId)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      צפה →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {logs.length === limit && (
          <div className="p-4 border-t border-gray-100 text-center">
            <Link
              href={`/shops/${slug}/admin/activity?page=${currentPage + 1}`}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              טען עוד ←
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function getResourceLink(slug: string, resourceType: string, resourceId: string): string {
  switch (resourceType) {
    case 'product':
      return `/shops/${slug}/admin/products/${resourceId}`;
    case 'order':
      return `/shops/${slug}/admin/orders/${resourceId}`;
    case 'category':
      return `/shops/${slug}/admin/categories`;
    case 'coupon':
      return `/shops/${slug}/admin/discounts`;
    case 'page':
      return `/shops/${slug}/admin/pages/${resourceId}`;
    default:
      return `/shops/${slug}/admin`;
  }
}



