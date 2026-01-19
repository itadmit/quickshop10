import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { getStoreBadges, getStoreCategories } from './actions';
import { BadgesDataTable } from './badges-data-table';
import Link from 'next/link';

interface BadgesPageProps {
  params: Promise<{ slug: string }>;
}

const appliesToLabels: Record<string, string> = {
  manual: 'ידני',
  category: 'לפי קטגוריה',
  new: 'מוצרים חדשים',
  featured: 'מוצרים מומלצים',
  sale: 'מוצרים במבצע',
};

const positionLabels: Record<string, string> = {
  'top-right': 'ימין למעלה',
  'top-left': 'שמאל למעלה',
  'bottom-right': 'ימין למטה',
  'bottom-left': 'שמאל למטה',
};

export default async function BadgesPage({ params }: BadgesPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const [badges, categories] = await Promise.all([
    getStoreBadges(store.id),
    getStoreCategories(store.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">מדבקות</h1>
          <p className="mt-1 text-sm text-gray-500">
            הוסף מדבקות כמו "חדש", "מבצע", "מומלץ" למוצרים
          </p>
        </div>
        <Link
          href={`/shops/${slug}/admin/badges/new`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          מדבקה חדשה
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">סה"כ מדבקות</div>
          <div className="text-2xl font-semibold mt-1">{badges.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">מדבקות פעילות</div>
          <div className="text-2xl font-semibold mt-1 text-green-600">
            {badges.filter(b => b.isActive).length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">מדבקות אוטומטיות</div>
          <div className="text-2xl font-semibold mt-1 text-blue-600">
            {badges.filter(b => b.appliesTo !== 'manual').length}
          </div>
        </div>
      </div>

      {/* Table */}
      {badges.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">אין מדבקות עדיין</h3>
          <p className="text-sm text-gray-500 mb-4">
            צור מדבקות להדגשת מוצרים בחנות שלך
          </p>
          <Link
            href={`/shops/${slug}/admin/badges/new`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            מדבקה ראשונה
          </Link>
        </div>
      ) : (
        <BadgesDataTable 
          badges={badges} 
          storeSlug={slug}
          storeId={store.id}
          categories={categories}
          appliesToLabels={appliesToLabels}
          positionLabels={positionLabels}
        />
      )}
    </div>
  );
}

