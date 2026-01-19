import { db } from '@/lib/db';
import { stores, productBadges, categories } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { BadgesManager } from './badges-manager';

export const metadata = {
  title: 'מדבקות מוצרים',
  description: 'ניהול מדבקות למוצרים',
};

interface BadgesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BadgesPage({ params }: BadgesPageProps) {
  const { slug } = await params;
  
  // Get store
  const [store] = await db
    .select({ id: stores.id })
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);
  
  if (!store) {
    notFound();
  }
  
  // Get badges
  const badges = await db
    .select()
    .from(productBadges)
    .where(eq(productBadges.storeId, store.id))
    .orderBy(asc(productBadges.sortOrder));
  
  // Get categories for badge form
  const storeCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
    })
    .from(categories)
    .where(eq(categories.storeId, store.id))
    .orderBy(asc(categories.name));
  
  return (
    <div className="p-6">
      <BadgesManager 
        initialBadges={badges}
        categories={storeCategories}
        storeId={store.id}
        storeSlug={slug}
      />
    </div>
  );
}

