import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { getStoreBadges, getStoreCategories } from '../actions';
import { BadgeForm } from '../badge-form';

interface EditBadgePageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function EditBadgePage({ params }: EditBadgePageProps) {
  const { slug, id } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const [badges, categories] = await Promise.all([
    getStoreBadges(store.id),
    getStoreCategories(store.id),
  ]);
  
  const badge = badges.find(b => b.id === id);
  
  if (!badge) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">עריכת מדבקה</h1>
        <p className="mt-1 text-sm text-gray-500">
          שינוי הגדרות המדבקה
        </p>
      </div>
      
      <BadgeForm 
        storeId={store.id}
        storeSlug={slug}
        categories={categories}
        badge={badge}
      />
    </div>
  );
}

