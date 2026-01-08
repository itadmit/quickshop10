import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { giftCards } from '@/lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { PageHeader, Button, StatCard, StatCardGrid, Badge } from '@/components/admin/ui';
import { GiftCardsDataTable } from './gift-cards-data-table';

export const dynamic = 'force-dynamic';

// ============================================
// Gift Cards Page - Server Component
// ============================================

interface GiftCardsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string; page?: string }>;
}

export default async function GiftCardsPage({ params, searchParams }: GiftCardsPageProps) {
  const { slug } = await params;
  const { filter, page } = await searchParams;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Build filter condition
  let filterCondition = eq(giftCards.storeId, store.id);
  
  if (filter === 'active') {
    filterCondition = and(filterCondition, eq(giftCards.status, 'active'))!;
  } else if (filter === 'used') {
    filterCondition = and(filterCondition, eq(giftCards.status, 'used'))!;
  } else if (filter === 'expired') {
    filterCondition = and(filterCondition, eq(giftCards.status, 'expired'))!;
  }

  // Get gift cards and stats in parallel ⚡
  const [cards, [stats]] = await Promise.all([
    db
      .select({
        id: giftCards.id,
        code: giftCards.code,
        initialBalance: giftCards.initialBalance,
        currentBalance: giftCards.currentBalance,
        status: giftCards.status,
        recipientEmail: giftCards.recipientEmail,
        recipientName: giftCards.recipientName,
        senderName: giftCards.senderName,
        message: giftCards.message,
        expiresAt: giftCards.expiresAt,
        lastUsedAt: giftCards.lastUsedAt,
        createdAt: giftCards.createdAt,
      })
      .from(giftCards)
      .where(filterCondition)
      .orderBy(desc(giftCards.createdAt))
      .limit(100),
    db
      .select({
        total: sql<number>`COUNT(*)::int`,
        active: sql<number>`COUNT(*) FILTER (WHERE ${giftCards.status} = 'active')::int`,
        used: sql<number>`COUNT(*) FILTER (WHERE ${giftCards.status} = 'used')::int`,
        expired: sql<number>`COUNT(*) FILTER (WHERE ${giftCards.status} = 'expired')::int`,
        totalValue: sql<string>`COALESCE(SUM(${giftCards.initialBalance}::numeric), 0)`,
        activeBalance: sql<string>`COALESCE(SUM(CASE WHEN ${giftCards.status} = 'active' THEN ${giftCards.currentBalance}::numeric ELSE 0 END), 0)`,
      })
      .from(giftCards)
      .where(eq(giftCards.storeId, store.id)),
  ]);

  // Pagination
  const perPage = 20;
  const currentPage = parseInt(page || '1', 10);
  const totalPages = Math.ceil(cards.length / perPage);
  const paginatedCards = cards.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const tabs = [
    { id: 'all', label: 'הכל', count: stats.total },
    { id: 'active', label: 'פעילים', count: stats.active },
    { id: 'used', label: 'נוצלו', count: stats.used },
    { id: 'expired', label: 'פגי תוקף', count: stats.expired },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="גיפט קארדס"
        description="ניהול כרטיסי מתנה לחנות"
        actions={
          <Button href={`/shops/${slug}/admin/gift-cards/new`} variant="primary" icon="plus">
            גיפט קארד חדש
          </Button>
        }
      />

      {/* Stats */}
      <StatCardGrid columns={4}>
        <StatCard
          label="סה״כ כרטיסים"
          value={stats.total}
        />
        <StatCard
          label="פעילים"
          value={stats.active}
        />
        <StatCard
          label="ערך כולל הונפק"
          value={`₪${Number(stats.totalValue).toFixed(2)}`}
        />
        <StatCard
          label="יתרה פעילה"
          value={`₪${Number(stats.activeBalance).toFixed(2)}`}
        />
      </StatCardGrid>

      {/* Gift Cards Table */}
      <GiftCardsDataTable
        cards={paginatedCards}
        storeSlug={slug}
        tabs={tabs}
        currentTab={filter || 'all'}
        pagination={{
          currentPage,
          totalPages,
          totalItems: cards.length,
          perPage,
        }}
      />

      {/* Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">מה זה גיפט קארדס?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="font-medium text-gray-900 mb-1">כרטיס מתנה דיגיטלי</p>
            <p className="text-gray-500">לקוחות יכולים לרכוש גיפט קארד ולשלוח לחברים ומשפחה.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">שימוש בקניה</p>
            <p className="text-gray-500">הנמען מזין את הקוד בצ׳קאאוט והיתרה מנוכה מסכום ההזמנה.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">מעקב יתרות</p>
            <p className="text-gray-500">כל שימוש נרשם והלקוח יכול לראות את היתרה שנותרה.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
