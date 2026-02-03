import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { abandonedCarts, customers } from '@/lib/db/schema';
import { eq, desc, isNull, isNotNull, sql, and, gte } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { PageHeader, StatCard, StatCardGrid } from '@/components/admin/ui';
import { AbandonedCartsDataTable } from './abandoned-data-table';

// ============================================
// Abandoned Carts Page - Server Component
// ============================================

interface AbandonedCartsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string; page?: string }>;
}

export default async function AbandonedCartsPage({ params, searchParams }: AbandonedCartsPageProps) {
  const { slug } = await params;
  const { filter, page } = await searchParams;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Build filter condition
  let filterCondition = eq(abandonedCarts.storeId, store.id);
  
  if (filter === 'not_sent') {
    filterCondition = and(filterCondition, isNull(abandonedCarts.reminderSentAt), isNull(abandonedCarts.recoveredAt))!;
  } else if (filter === 'sent') {
    filterCondition = and(filterCondition, isNotNull(abandonedCarts.reminderSentAt), isNull(abandonedCarts.recoveredAt))!;
  } else if (filter === 'recovered') {
    filterCondition = and(filterCondition, isNotNull(abandonedCarts.recoveredAt))!;
  }

  // 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get abandoned carts and stats in parallel ⚡
  const [carts, stats] = await Promise.all([
    db
      .select({
        id: abandonedCarts.id,
        email: abandonedCarts.email,
        items: abandonedCarts.items,
        subtotal: abandonedCarts.subtotal,
        checkoutStep: abandonedCarts.checkoutStep,
        reminderSentAt: abandonedCarts.reminderSentAt,
        reminderCount: abandonedCarts.reminderCount,
        recoveredAt: abandonedCarts.recoveredAt,
        createdAt: abandonedCarts.createdAt,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
      })
      .from(abandonedCarts)
      .leftJoin(customers, eq(customers.id, abandonedCarts.customerId))
      .where(filterCondition)
      .orderBy(desc(abandonedCarts.createdAt))
      .limit(100),
    db
      .select({
        total: sql<number>`COUNT(*)::int`,
        notSent: sql<number>`COUNT(*) FILTER (WHERE ${abandonedCarts.reminderSentAt} IS NULL AND ${abandonedCarts.recoveredAt} IS NULL)::int`,
        sent: sql<number>`COUNT(*) FILTER (WHERE ${abandonedCarts.reminderSentAt} IS NOT NULL AND ${abandonedCarts.recoveredAt} IS NULL)::int`,
        recovered: sql<number>`COUNT(*) FILTER (WHERE ${abandonedCarts.recoveredAt} IS NOT NULL)::int`,
        totalValue: sql<string>`COALESCE(SUM(CASE WHEN ${abandonedCarts.recoveredAt} IS NULL THEN ${abandonedCarts.subtotal}::numeric ELSE 0 END), 0)`,
        recoveredValue: sql<string>`COALESCE(SUM(CASE WHEN ${abandonedCarts.recoveredAt} IS NOT NULL THEN ${abandonedCarts.subtotal}::numeric ELSE 0 END), 0)`,
      })
      .from(abandonedCarts)
      .where(and(
        eq(abandonedCarts.storeId, store.id),
        gte(abandonedCarts.createdAt, thirtyDaysAgo)
      )),
  ]);

  const { total, notSent, sent, recovered, totalValue } = stats[0];
  const recoveryRate = total > 0 ? ((recovered / total) * 100).toFixed(1) : '0';

  // Pagination
  const perPage = 20;
  const currentPage = parseInt(page || '1', 10);
  const totalPages = Math.ceil(carts.length / perPage);
  const paginatedCarts = carts.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const tabs = [
    { id: 'all', label: 'הכל', count: total },
    { id: 'not_sent', label: 'לא נשלח', count: notSent },
    { id: 'sent', label: 'נשלח', count: sent },
    { id: 'recovered', label: 'שוחזר', count: recovered },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="עגלות נטושות"
        description="30 ימים אחרונים"
      />

      {/* Stats */}
      <StatCardGrid columns={4}>
        <StatCard
          label="עגלות נטושות"
          value={total}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          label="ערך פוטנציאלי"
          value={`₪${Number(totalValue).toFixed(2)}`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="שוחזרו"
          value={recovered}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="שיעור שחזור"
          value={`${recoveryRate}%`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </StatCardGrid>

      {/* Abandoned Carts Table */}
      <AbandonedCartsDataTable
        carts={paginatedCarts}
        storeSlug={slug}
        tabs={tabs}
        currentTab={filter || 'all'}
        pagination={{
          currentPage,
          totalPages,
          totalItems: carts.length,
          perPage,
        }}
      />

      {/* Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">איך זה עובד?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="font-medium text-gray-900 mb-1">1. זיהוי עגלה נטושה</p>
            <p className="text-gray-500">כשלקוח מתחיל תהליך רכישה ולא משלים, העגלה נשמרת אוטומטית.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">2. שליחת תזכורת</p>
            <p className="text-gray-500">ניתן לשלוח אימייל עם קישור לשחזור העגלה ישירות לתשלום.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">3. מעקב שחזור</p>
            <p className="text-gray-500">כשלקוח משלים הזמנה דרך הקישור, העגלה מסומנת כשוחזרה.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
