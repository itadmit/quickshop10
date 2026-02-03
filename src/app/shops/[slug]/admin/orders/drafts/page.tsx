import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { draftOrders } from '@/lib/db/schema';
import { eq, desc, isNull, isNotNull, and, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { PageHeader, Button, StatCard, StatCardGrid } from '@/components/admin/ui';
import { DraftsDataTable } from './drafts-data-table';

// ============================================
// Draft Orders Page - Server Component
// ============================================

interface DraftOrdersPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string; page?: string }>;
}

export default async function DraftOrdersPage({ params, searchParams }: DraftOrdersPageProps) {
  const { slug } = await params;
  const { filter, page } = await searchParams;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Build filter condition
  let filterCondition = eq(draftOrders.storeId, store.id);
  
  if (filter === 'open') {
    filterCondition = and(filterCondition, isNull(draftOrders.completedAt))!;
  } else if (filter === 'completed') {
    filterCondition = and(filterCondition, isNotNull(draftOrders.completedAt))!;
  }

  // Get draft orders and stats in parallel ⚡
  const [drafts, [stats]] = await Promise.all([
    db
      .select({
        id: draftOrders.id,
        customerName: draftOrders.customerName,
        customerEmail: draftOrders.customerEmail,
        items: draftOrders.items,
        subtotal: draftOrders.subtotal,
        total: draftOrders.total,
        notes: draftOrders.notes,
        completedAt: draftOrders.completedAt,
        orderId: draftOrders.orderId,
        createdAt: draftOrders.createdAt,
      })
      .from(draftOrders)
      .where(filterCondition)
      .orderBy(desc(draftOrders.createdAt))
      .limit(100),
    db
      .select({
        total: sql<number>`COUNT(*)::int`,
        open: sql<number>`COUNT(*) FILTER (WHERE ${draftOrders.completedAt} IS NULL)::int`,
        completed: sql<number>`COUNT(*) FILTER (WHERE ${draftOrders.completedAt} IS NOT NULL)::int`,
        totalValue: sql<string>`COALESCE(SUM(CASE WHEN ${draftOrders.completedAt} IS NULL THEN ${draftOrders.total}::numeric ELSE 0 END), 0)`,
      })
      .from(draftOrders)
      .where(eq(draftOrders.storeId, store.id)),
  ]);

  // Pagination
  const perPage = 20;
  const currentPage = parseInt(page || '1', 10);
  const totalPages = Math.ceil(drafts.length / perPage);
  const paginatedDrafts = drafts.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const tabs = [
    { id: 'all', label: 'הכל', count: stats.total },
    { id: 'open', label: 'פתוחות', count: stats.open },
    { id: 'completed', label: 'הושלמו', count: stats.completed },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="הזמנות טיוטה"
        description="יצירת הזמנות ידנית ללקוחות"
        actions={
          <Button href={`/shops/${slug}/admin/orders/drafts/new`} variant="primary" icon="plus">
            טיוטה חדשה
          </Button>
        }
      />

      {/* Stats */}
      <StatCardGrid columns={4}>
        <StatCard
          label="סה״כ טיוטות"
          value={stats.total}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
        <StatCard
          label="פתוחות"
          value={stats.open}
          alert={stats.open > 0}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="הושלמו"
          value={stats.completed}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="ערך פתוח"
          value={`₪${Number(stats.totalValue).toFixed(2)}`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </StatCardGrid>

      {/* Drafts Table */}
      <DraftsDataTable
        drafts={paginatedDrafts}
        storeSlug={slug}
        tabs={tabs}
        currentTab={filter || 'all'}
        pagination={{
          currentPage,
          totalPages,
          totalItems: drafts.length,
          perPage,
        }}
      />

      {/* Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">מה זה הזמנות טיוטה?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="font-medium text-gray-900 mb-1">יצירת הזמנה ידנית</p>
            <p className="text-gray-500">צרו הזמנה עבור לקוח שהתקשר או שלח הודעה - ללא צורך בצ׳קאאוט.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">שליחה ללקוח</p>
            <p className="text-gray-500">שלחו ללקוח קישור לתשלום או סמנו את ההזמנה כשולמה ידנית.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">המרה להזמנה</p>
            <p className="text-gray-500">בסיום, הטיוטה הופכת להזמנה רגילה עם כל הפרטים.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
