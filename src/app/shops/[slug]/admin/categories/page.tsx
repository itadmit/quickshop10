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
      parentId: categories.parentId,
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

  const rawCategories = await getCategoriesWithProductCount(store.id);
  
  // Sort categories: parents first, then their children underneath
  const sortedCategories: typeof rawCategories = [];
  const parentCategories = rawCategories.filter(c => !c.parentId).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  
  for (const parent of parentCategories) {
    sortedCategories.push(parent);
    // Add children of this parent
    const children = rawCategories
      .filter(c => c.parentId === parent.id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    sortedCategories.push(...children);
  }
  
  // Add any orphaned subcategories (shouldn't happen but just in case)
  const addedIds = new Set(sortedCategories.map(c => c.id));
  for (const cat of rawCategories) {
    if (!addedIds.has(cat.id)) {
      sortedCategories.push(cat);
    }
  }
  
  const allCategories = sortedCategories;

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

  // Prepare parent categories list for the form
  const parentCategoriesForForm = allCategories.map(c => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="קטגוריות"
        description={`${allCategories.length} קטגוריות בחנות`}
        actions={
          <CategoryForm 
            storeId={store.id} 
            storeSlug={slug}
            mode="create" 
            allCategories={parentCategoriesForForm}
          />
        }
      />

      <CategoriesDataTable
        categories={paginatedCategories}
        allCategories={allCategories}
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
