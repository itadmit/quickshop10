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
        />
        <StatCard
          label="פתוחות"
          value={stats.open}
          alert={stats.open > 0}
        />
        <StatCard
          label="הושלמו"
          value={stats.completed}
        />
        <StatCard
          label="ערך פתוח"
          value={`₪${Number(stats.totalValue).toFixed(2)}`}
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
