import { db } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
import { eq, count, asc } from 'drizzle-orm';
import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/ui';
import type { Tab } from '@/components/admin/ui';
import { CategoryForm } from './category-form';
import { CategoriesDataTable } from './categories-data-table';

export const dynamic = 'force-dynamic';

// ============================================
// Categories Page - Server Component
// ============================================

interface CategoriesPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string; search?: string; page?: string }>;
}

async function getCategoriesWithProductCount(storeId: string) {
  const result = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      imageUrl: categories.imageUrl,
      sortOrder: categories.sortOrder,
      isActive: categories.isActive,
      createdAt: categories.createdAt,
      productCount: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .where(eq(categories.storeId, storeId))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder));
  
  return result;
}

export default async function CategoriesPage({ params, searchParams }: CategoriesPageProps) {
  const { slug } = await params;
  const { filter, search, page } = await searchParams;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const allCategories = await getCategoriesWithProductCount(store.id);

  // Filter by tab
  let filteredCategories = allCategories;
  if (filter && filter !== 'all') {
    if (filter === 'active') {
      filteredCategories = allCategories.filter(c => c.isActive);
    } else if (filter === 'hidden') {
      filteredCategories = allCategories.filter(c => !c.isActive);
    } else if (filter === 'empty') {
      filteredCategories = allCategories.filter(c => c.productCount === 0);
    }
  }

  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    filteredCategories = filteredCategories.filter(c => 
      c.name.toLowerCase().includes(searchLower) ||
      c.slug.toLowerCase().includes(searchLower) ||
      c.description?.toLowerCase().includes(searchLower)
    );
  }

  // Pagination
  const perPage = 20;
  const currentPage = parseInt(page || '1', 10);
  const totalPages = Math.ceil(filteredCategories.length / perPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // Count for tabs
  const activeCount = allCategories.filter(c => c.isActive).length;
  const hiddenCount = allCategories.filter(c => !c.isActive).length;
  const emptyCount = allCategories.filter(c => c.productCount === 0).length;

  const tabs: Tab[] = [
    { id: 'all', label: 'הכל', count: allCategories.length },
    { id: 'active', label: 'פעילות', count: activeCount },
    { id: 'hidden', label: 'מוסתרות', count: hiddenCount },
    { id: 'empty', label: 'ריקות', count: emptyCount },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="קטגוריות"
        description={`${allCategories.length} קטגוריות בחנות`}
        actions={
          <CategoryForm storeId={store.id} mode="create" />
        }
      />

      <CategoriesDataTable
        categories={paginatedCategories}
        storeSlug={slug}
        storeId={store.id}
        tabs={tabs}
        currentTab={filter || 'all'}
        searchValue={search}
        pagination={{
          currentPage,
          totalPages,
          totalItems: filteredCategories.length,
          perPage,
        }}
      />
    </div>
  );
}
