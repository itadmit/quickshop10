import { db } from '@/lib/db';
import { popups, stores } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PopupsDataTable } from './popups-data-table';
import { PopupForm } from './popup-form';

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          label="סה״כ פופאפים" 
          value={storePopups.length} 
        />
        <StatCard 
          label="פעילים" 
          value={storePopups.filter(p => p.isActive).length} 
          color="green"
        />
        <StatCard 
          label="סה״כ צפיות" 
          value={storePopups.reduce((sum, p) => sum + p.impressions, 0)} 
        />
        <StatCard 
          label="סה״כ המרות" 
          value={storePopups.reduce((sum, p) => sum + p.conversions, 0)} 
          color="blue"
        />
      </div>

      {/* Table */}
      {storePopups.length > 0 ? (
        <PopupsDataTable popups={storePopups} storeId={store.id} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  color = 'gray' 
}: { 
  label: string; 
  value: number; 
  color?: 'gray' | 'green' | 'blue';
}) {
  const colors = {
    gray: 'bg-gray-50 border-gray-200',
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
      <div className="text-sm text-gray-600">{label}</div>
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





