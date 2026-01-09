import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { getMetafield } from '../actions';
import { MetafieldForm } from '../metafield-form';
import Link from 'next/link';

interface EditMetafieldPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function EditMetafieldPage({ params }: EditMetafieldPageProps) {
  const { slug, id } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const metafield = await getMetafield(store.id, id);
  
  if (!metafield) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/shops/${slug}/admin/metafields`}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12H19M5 12L12 5M5 12L12 19" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">עריכת שדה: {metafield.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            ערוך את פרטי השדה המותאם
          </p>
        </div>
      </div>

      {/* Form */}
      <MetafieldForm storeId={store.id} storeSlug={slug} metafield={metafield} />
    </div>
  );
}

