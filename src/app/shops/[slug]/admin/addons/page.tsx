import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { getStoreAddons } from './actions';
import { AddonsDataTable } from './addons-data-table';
import Link from 'next/link';

interface AddonsPageProps {
  params: Promise<{ slug: string }>;
}

const fieldTypeLabels: Record<string, string> = {
  text: 'טקסט חופשי',
  select: 'בחירה מרשימה',
  checkbox: 'תיבת סימון',
  radio: 'בחירה בודדת',
  date: 'תאריך',
};

export default async function AddonsPage({ params }: AddonsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const addons = await getStoreAddons(store.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">תוספות מותאמות</h1>
          <p className="mt-1 text-sm text-gray-500">
            צור תוספות למוצרים עם תמחור גמיש
          </p>
        </div>
        <Link
          href={`/shops/${slug}/admin/addons/new`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          תוספת חדשה
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">סה"כ תוספות</div>
          <div className="text-2xl font-semibold mt-1">{addons.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">תוספות פעילות</div>
          <div className="text-2xl font-semibold mt-1 text-green-600">
            {addons.filter(a => a.isActive).length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">עם תוספת מחיר</div>
          <div className="text-2xl font-semibold mt-1 text-blue-600">
            {addons.filter(a => {
              if (Number(a.priceAdjustment) > 0) return true;
              const options = a.options as Array<{ priceAdjustment?: number }>;
              return options?.some(o => (o.priceAdjustment || 0) > 0);
            }).length}
          </div>
        </div>
      </div>

      {/* Table */}
      {addons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M12 8v8"/>
              <path d="M8 12h8"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">אין תוספות עדיין</h3>
          <p className="text-sm text-gray-500 mb-4">
            צור תוספות כמו רקמה אישית, אריזת מתנה ועוד
          </p>
          <Link
            href={`/shops/${slug}/admin/addons/new`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            תוספת ראשונה
          </Link>
        </div>
      ) : (
        <AddonsDataTable 
          addons={addons.map(a => ({
            ...a,
            priceAdjustment: Number(a.priceAdjustment) || 0,
            options: a.options as Array<{ label: string; value: string; priceAdjustment: number }>,
          }))} 
          storeSlug={slug}
          storeId={store.id}
          fieldTypeLabels={fieldTypeLabels}
        />
      )}
    </div>
  );
}

