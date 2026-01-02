import { getStoreBySlug, getStoreProductsAdmin, getCategoriesByStore } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { PageHeader, Button } from '@/components/admin/ui';
import type { Tab } from '@/components/admin/ui';
import { ProductsDataTable } from './products-data-table';

// ============================================
// Products Page - Server Component
// ============================================

interface ProductsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; category?: string; search?: string; page?: string }>;
}

export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const { slug } = await params;
  const { status, category, search, page } = await searchParams;
  
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Fetch products and categories in parallel ⚡
  const [allProducts, categories] = await Promise.all([
    getStoreProductsAdmin(store.id),
    getCategoriesByStore(store.id),
  ]);
  
  // Filter by status tab
  let filteredProducts = allProducts;
  if (status && status !== 'all') {
    if (status === 'active') {
      filteredProducts = allProducts.filter(p => p.isActive);
    } else if (status === 'draft') {
      filteredProducts = allProducts.filter(p => !p.isActive);
    } else if (status === 'low_stock') {
      filteredProducts = allProducts.filter(p => 
        p.trackInventory && p.inventory !== null && p.inventory <= 5 && p.inventory > 0
      );
    } else if (status === 'out_of_stock') {
      filteredProducts = allProducts.filter(p => 
        p.trackInventory && (p.inventory === null || p.inventory === 0)
      );
    }
  }
  
  // Filter by category
  if (category) {
    filteredProducts = filteredProducts.filter(p => p.categoryId === category);
  }
  
  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      p.slug.toLowerCase().includes(searchLower)
    );
  }
  
  // Pagination
  const perPage = 20;
  const currentPage = parseInt(page || '1', 10);
  const totalPages = Math.ceil(filteredProducts.length / perPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );
  
  // Count for tabs
  const activeCount = allProducts.filter(p => p.isActive).length;
  const draftCount = allProducts.filter(p => !p.isActive).length;
  const lowStockCount = allProducts.filter(p => 
    p.trackInventory && p.inventory !== null && p.inventory <= 5 && p.inventory > 0
  ).length;
  const outOfStockCount = allProducts.filter(p => 
    p.trackInventory && (p.inventory === null || p.inventory === 0)
  ).length;

  const tabs: Tab[] = [
    { id: 'all', label: 'הכל', count: allProducts.length },
    { id: 'active', label: 'פעילים', count: activeCount },
    { id: 'draft', label: 'טיוטה', count: draftCount },
    { id: 'low_stock', label: 'מלאי נמוך', count: lowStockCount },
    { id: 'out_of_stock', label: 'אזל', count: outOfStockCount },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="מוצרים"
        description={`${allProducts.length} מוצרים בקטלוג`}
        actions={
          <Button href={`/shops/${slug}/admin/products/new`} variant="primary" icon="plus">
            הוסף מוצר
          </Button>
        }
      />

      <ProductsDataTable
        products={paginatedProducts}
        storeSlug={slug}
        tabs={tabs}
        currentTab={status || 'all'}
        searchValue={search}
        pagination={{
          currentPage,
          totalPages,
          totalItems: filteredProducts.length,
          perPage,
        }}
      />
    </div>
  );
}
