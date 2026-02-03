import { db } from '@/lib/db';
import { popups, stores } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { PopupsDataTable } from './popups-data-table';
import { PopupForm } from './popup-form';
import { StatCard, StatCardGrid } from '@/components/admin/ui';

interface PopupsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PopupsPage({ params }: PopupsPageProps) {
  const { slug } = await params;
  
  const store = await db.query.stores.findFirst({
    where: eq(stores.slug, slug),
  });

  if (!store) {
    notFound();
  }

  const storePopups = await db.query.popups.findMany({
    where: eq(popups.storeId, store.id),
    orderBy: desc(popups.createdAt),
  });

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">פופאפים</h1>
          <p className="text-sm text-gray-500 mt-1">
            ניהול פופאפים וחלונות קופצים לחנות
          </p>
        </div>
        <PopupForm storeId={store.id} mode="create" />
      </div>

      {/* Stats */}
      <StatCardGrid columns={4}>
        <StatCard 
          label="סה״כ פופאפים" 
          value={storePopups.length} 
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          }
        />
        <StatCard 
          label="פעילים" 
          value={storePopups.filter(p => p.isActive).length} 
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard 
          label="סה״כ צפיות" 
          value={storePopups.reduce((sum, p) => sum + p.impressions, 0)} 
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
        <StatCard 
          label="סה״כ המרות" 
          value={storePopups.reduce((sum, p) => sum + p.conversions, 0)} 
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </StatCardGrid>

      {/* Table */}
      {storePopups.length > 0 ? (
        <PopupsDataTable popups={storePopups} storeId={store.id} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
      <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">אין פופאפים עדיין</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        צרו פופאפים כדי להציג מבצעים, לאסוף לידים, או להודיע על חדשות
      </p>
    </div>
  );
}











