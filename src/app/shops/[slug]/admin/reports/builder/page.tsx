import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/lib/db/queries';
import { getStoreCategories } from '@/lib/actions/custom-reports';
import { ReportBuilder } from './report-builder';
import Link from 'next/link';

// ============================================
// Report Builder Page - Server Component
// Fast initial load, categories pre-fetched
// ============================================

export default async function ReportBuilderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  // Pre-fetch categories for filter (parallel would be even faster if we had more data)
  const categories = await getStoreCategories(store.id);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link 
            href={`/shops/${slug}/admin/reports`}
            className="hover:text-gray-700 transition-colors"
          >
            דוחות
          </Link>
          <span>←</span>
          <span>בילדר דוחות</span>
        </div>
        <h1 className="text-2xl font-medium">בילדר דוחות</h1>
        <p className="text-gray-500 mt-1">
          צור דוחות מותאמים אישית על מוצרים, הזמנות, לקוחות, קופונים ומלאי
        </p>
      </div>

      {/* Report Builder - Client Component */}
      <ReportBuilder 
        storeId={store.id} 
        categories={categories}
      />
    </div>
  );
}

