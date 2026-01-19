import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { getStoreCategories } from '../actions';
import { BadgeForm } from '../badge-form';

interface NewBadgePageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewBadgePage({ params }: NewBadgePageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const categories = await getStoreCategories(store.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">מדבקה חדשה</h1>
        <p className="mt-1 text-sm text-gray-500">
          צור מדבקה להדגשת מוצרים
        </p>
      </div>
      
      <BadgeForm 
        storeId={store.id}
        storeSlug={slug}
        categories={categories}
      />
    </div>
  );
}

