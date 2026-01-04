import { db } from '@/lib/db';
import { automaticDiscounts, categories, products } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, StatCard, StatCardGrid } from '@/components/admin/ui';
import type { Tab } from '@/components/admin/ui';
import { AutoDiscountForm } from './auto-discount-form';
import { AutoDiscountsDataTable } from './auto-discounts-data-table';

export const dynamic = 'force-dynamic';

// ============================================
// Automatic Discounts Page - Server Component
// ============================================

interface AutoDiscountsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string; page?: string }>;
}

export default async function AutoDiscountsPage({ params, searchParams }: AutoDiscountsPageProps) {
  const { slug } = await params;
  const { filter, page } = await searchParams;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get auto discounts, categories and products in parallel ⚡
  const [rawDiscounts, allCategories, allProducts] = await Promise.all([
    db.select().from(automaticDiscounts).where(eq(automaticDiscounts.storeId, store.id)).orderBy(desc(automaticDiscounts.createdAt)),
    db.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.storeId, store.id)),
    db.select({ id: products.id, name: products.name }).from(products).where(eq(products.storeId, store.id)),
  ]);

  // Normalize jsonb fields to string[]
  const allDiscounts = rawDiscounts.map(d => ({
    ...d,
    categoryIds: Array.isArray(d.categoryIds) ? d.categoryIds as string[] : [],
    productIds: Array.isArray(d.productIds) ? d.productIds as string[] : [],
    excludeCategoryIds: Array.isArray(d.excludeCategoryIds) ? d.excludeCategoryIds as string[] : [],
    excludeProductIds: Array.isArray(d.excludeProductIds) ? d.excludeProductIds as string[] : [],
  }));

  // Filter by tab
  let filteredDiscounts = allDiscounts;
  if (filter && filter !== 'all') {
    if (filter === 'active') {
      filteredDiscounts = allDiscounts.filter(d => d.isActive);
    } else if (filter === 'inactive') {
      filteredDiscounts = allDiscounts.filter(d => !d.isActive);
    } else if (filter === 'expired') {
      filteredDiscounts = allDiscounts.filter(d => d.endsAt && new Date(d.endsAt) < new Date());
    }
  }

  // Pagination
  const perPage = 20;
  const currentPage = parseInt(page || '1', 10);
  const totalPages = Math.ceil(filteredDiscounts.length / perPage);
  const paginatedDiscounts = filteredDiscounts.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  ).map(d => ({
    id: d.id,
    name: d.name,
    description: d.description,
    type: d.type,
    value: d.value,
    appliesTo: d.appliesTo,
    categoryIds: d.categoryIds,
    productIds: d.productIds,
    excludeCategoryIds: d.excludeCategoryIds,
    excludeProductIds: d.excludeProductIds,
    minimumAmount: d.minimumAmount,
    minimumQuantity: d.minimumQuantity,
    startsAt: d.startsAt,
    endsAt: d.endsAt,
    priority: d.priority,
    stackable: d.stackable,
    isActive: d.isActive,
    createdAt: d.createdAt,
  }));

  // Stats
  const activeDiscounts = allDiscounts.filter(d => d.isActive);
  const inactiveDiscounts = allDiscounts.filter(d => !d.isActive);
  const expiredDiscounts = allDiscounts.filter(d => d.endsAt && new Date(d.endsAt) < new Date());

  const tabs: Tab[] = [
    { id: 'all', label: 'הכל', count: allDiscounts.length },
    { id: 'active', label: 'פעילים', count: activeDiscounts.length },
    { id: 'inactive', label: 'לא פעילים', count: inactiveDiscounts.length },
    { id: 'expired', label: 'פגי תוקף', count: expiredDiscounts.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="הנחות אוטומטיות"
        description="הנחות שחלות אוטומטית ללא צורך בקוד קופון"
        breadcrumbs={[
          { label: 'קופונים והנחות', href: `/shops/${slug}/admin/discounts` },
          { label: 'הנחות אוטומטיות' },
        ]}
        actions={
          <AutoDiscountForm 
            storeId={store.id} 
            mode="create" 
            categories={allCategories}
            products={allProducts}
          />
        }
      />

      {/* Stats */}
      <StatCardGrid columns={3}>
        <StatCard
          label="הנחות פעילות"
          value={activeDiscounts.length}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          }
        />
        <StatCard
          label="לא פעילות"
          value={inactiveDiscounts.length}
        />
        <StatCard
          label="פגי תוקף"
          value={expiredDiscounts.length}
          alert={expiredDiscounts.length > 0}
        />
      </StatCardGrid>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">מה ההבדל בין קופון להנחה אוטומטית?</p>
            <p className="text-blue-700">
              <strong>קופון</strong> - הלקוח צריך להזין קוד בצ'קאאוט.{' '}
              <strong>הנחה אוטומטית</strong> - חלה אוטומטית כשהתנאים מתקיימים (למשל: 10% הנחה לחברי מועדון, או 20% על קטגוריית סייל).
            </p>
          </div>
        </div>
      </div>

      {/* Back to coupons link */}
      <div className="flex items-center gap-2 text-sm">
        <Link 
          href={`/shops/${slug}/admin/discounts`}
          className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          חזרה לקופונים
        </Link>
      </div>

      {/* Discounts Table */}
      <AutoDiscountsDataTable
        discounts={paginatedDiscounts}
        storeId={store.id}
        categories={allCategories}
        products={allProducts}
        tabs={tabs}
        currentTab={filter || 'all'}
        pagination={{
          currentPage,
          totalPages,
          totalItems: filteredDiscounts.length,
          perPage,
        }}
      />
    </div>
  );
}

