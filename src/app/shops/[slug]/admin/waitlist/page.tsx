import { db } from '@/lib/db';
import { productWaitlist, products, productVariants, stores } from '@/lib/db/schema';
import { eq, desc, and, count, isNull, not } from 'drizzle-orm';
import { notFound } from 'next/headers';
import { PageHeader } from '@/components/admin/ui';
import type { Tab } from '@/components/admin/ui';
import { WaitlistDataTable } from './waitlist-data-table';
import { Bell } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface WaitlistPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

export default async function WaitlistPage({ params, searchParams }: WaitlistPageProps) {
  const { slug } = await params;
  const { status, search, page } = await searchParams;
  
  const store = await db.query.stores.findFirst({
    where: eq(stores.slug, slug),
  });

  if (!store) {
    notFound();
  }

  // Get counts
  const [totalCount, pendingCount, notifiedCount] = await Promise.all([
    db.select({ count: count() }).from(productWaitlist).where(eq(productWaitlist.storeId, store.id)),
    db.select({ count: count() }).from(productWaitlist).where(and(eq(productWaitlist.storeId, store.id), eq(productWaitlist.isNotified, false))),
    db.select({ count: count() }).from(productWaitlist).where(and(eq(productWaitlist.storeId, store.id), eq(productWaitlist.isNotified, true))),
  ]);

  // Build query conditions
  const conditions = [eq(productWaitlist.storeId, store.id)];
  if (status === 'pending') {
    conditions.push(eq(productWaitlist.isNotified, false));
  } else if (status === 'notified') {
    conditions.push(eq(productWaitlist.isNotified, true));
  }

  // Get waitlist entries with product and variant data
  let allEntries = await db
    .select({
      id: productWaitlist.id,
      email: productWaitlist.email,
      firstName: productWaitlist.firstName,
      phone: productWaitlist.phone,
      productId: productWaitlist.productId,
      productName: products.name,
      productSlug: products.slug,
      variantId: productWaitlist.variantId,
      variantTitle: productVariants.title,
      isNotified: productWaitlist.isNotified,
      notifiedAt: productWaitlist.notifiedAt,
      createdAt: productWaitlist.createdAt,
    })
    .from(productWaitlist)
    .leftJoin(products, eq(products.id, productWaitlist.productId))
    .leftJoin(productVariants, eq(productVariants.id, productWaitlist.variantId))
    .where(and(...conditions))
    .orderBy(desc(productWaitlist.createdAt));

  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    allEntries = allEntries.filter(e => 
      e.email.toLowerCase().includes(searchLower) ||
      e.firstName?.toLowerCase().includes(searchLower) ||
      e.productName?.toLowerCase().includes(searchLower) ||
      e.phone?.toLowerCase().includes(searchLower)
    );
  }

  // Pagination
  const perPage = 25;
  const currentPage = parseInt(page || '1', 10);
  const totalPages = Math.ceil(allEntries.length / perPage);
  const paginatedEntries = allEntries.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // Transform data for component
  const entries = paginatedEntries.map(e => ({
    id: e.id,
    email: e.email,
    firstName: e.firstName,
    phone: e.phone,
    product: {
      id: e.productId,
      name: e.productName || 'מוצר לא נמצא',
      slug: e.productSlug || '',
    },
    variant: e.variantId ? {
      id: e.variantId,
      title: e.variantTitle || '',
    } : null,
    isNotified: e.isNotified,
    notifiedAt: e.notifiedAt,
    createdAt: e.createdAt,
  }));

  // Tabs
  const tabs: Tab[] = [
    { id: 'all', label: 'הכל', count: totalCount[0].count },
    { id: 'pending', label: 'ממתינים', count: pendingCount[0].count },
    { id: 'notified', label: 'נשלח', count: notifiedCount[0].count },
  ];

  const basePath = `/shops/${slug}`;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="רשימת המתנה"
        description="לקוחות המחכים להתעדכן על מוצרים שאזל מלאיים"
        icon={Bell}
        tabs={tabs}
        currentTab={status || 'all'}
        searchPlaceholder="חפש לפי אימייל, שם או מוצר"
        basePath={`${basePath}/admin/waitlist`}
      />

      <div className="mt-6">
        <WaitlistDataTable 
          entries={entries} 
          storeSlug={slug}
          basePath={basePath}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const isActive = p === currentPage;
            const params = new URLSearchParams();
            if (status) params.set('status', status);
            if (search) params.set('search', search);
            params.set('page', String(p));
            
            return (
              <a
                key={p}
                href={`?${params.toString()}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

