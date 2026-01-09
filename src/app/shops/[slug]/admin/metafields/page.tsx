import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { getStoreMetafields } from './actions';
import { MetafieldsDataTable } from './metafields-data-table';
import Link from 'next/link';

interface MetafieldsPageProps {
  params: Promise<{ slug: string }>;
}

const fieldTypeLabels: Record<string, string> = {
  text: 'טקסט קצר',
  textarea: 'טקסט ארוך',
  number: 'מספר',
  date: 'תאריך',
  url: 'קישור (URL)',
  boolean: 'כן/לא',
};

export default async function MetafieldsPage({ params }: MetafieldsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const metafields = await getStoreMetafields(store.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">שדות מותאמים</h1>
          <p className="mt-1 text-sm text-gray-500">
            הגדר שדות מותאמים אישית למוצרים
          </p>
        </div>
        <Link
          href={`/shops/${slug}/admin/metafields/new`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          שדה חדש
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">סה"כ שדות</div>
          <div className="text-2xl font-semibold mt-1">{metafields.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">שדות פעילים</div>
          <div className="text-2xl font-semibold mt-1 text-green-600">
            {metafields.filter(m => m.isActive).length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">מוצגים במוצר</div>
          <div className="text-2xl font-semibold mt-1 text-purple-600">
            {metafields.filter(m => m.showOnProduct).length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">נשמרים בהזמנה</div>
          <div className="text-2xl font-semibold mt-1 text-blue-600">
            {metafields.filter(m => m.showInCheckout).length}
          </div>
        </div>
      </div>

      {/* Table */}
      {metafields.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 9h6"/>
              <path d="M9 13h6"/>
              <path d="M9 17h4"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">אין שדות מותאמים עדיין</h3>
          <p className="text-sm text-gray-500 mb-4">
            צור שדות כמו חומר, ארץ ייצור, הוראות טיפול ועוד
          </p>
          <Link
            href={`/shops/${slug}/admin/metafields/new`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            שדה ראשון
          </Link>
        </div>
      ) : (
        <MetafieldsDataTable 
          metafields={metafields} 
          storeSlug={slug}
          storeId={store.id}
          fieldTypeLabels={fieldTypeLabels}
        />
      )}
    </div>
  );
}

