import { db } from '@/lib/db';
import { discounts, influencers, gamificationWins } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, StatCard, StatCardGrid } from '@/components/admin/ui';
import type { Tab } from '@/components/admin/ui';
import { DiscountsDataTable } from './discounts-data-table';

export const dynamic = 'force-dynamic';

// ============================================
// Discounts Page - Server Component
// ============================================

interface DiscountsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string; search?: string; page?: string }>;
}

export default async function DiscountsPage({ params, searchParams }: DiscountsPageProps) {
  const { slug } = await params;
  const { filter, search, page } = await searchParams;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get all coupons
  const allCoupons = await db.select().from(discounts).where(eq(discounts.storeId, store.id)).orderBy(desc(discounts.createdAt));

  // Get all influencers for assignment
  const storeInfluencers = await db
    .select({ id: influencers.id, name: influencers.name, email: influencers.email, discountId: influencers.discountId })
    .from(influencers)
    .where(eq(influencers.storeId, store.id))
    .orderBy(influencers.name);

  // Get all gamification wins with discountIds (coupons created by plugins)
  const gamificationDiscounts = await db
    .select({ discountId: gamificationWins.discountId })
    .from(gamificationWins)
    .where(eq(gamificationWins.campaignId, gamificationWins.campaignId)); // Just get all
  
  const gamificationDiscountIds = new Set(
    gamificationDiscounts
      .map(g => g.discountId)
      .filter((id): id is string => id !== null)
  );

  // Create a map of discountId -> influencer name
  const influencerByDiscountId = new Map<string, string>();
  storeInfluencers.forEach(inf => {
    if (inf.discountId) {
      influencerByDiscountId.set(inf.discountId, inf.name);
    }
  });

  // Enrich coupons with influencer name, source, and normalize jsonb fields
  const couponsWithInfluencer = allCoupons.map(coupon => ({
    ...coupon,
    influencerName: influencerByDiscountId.get(coupon.id) || null,
    source: gamificationDiscountIds.has(coupon.id) ? 'gamification' as const : 'dashboard' as const,
    // Normalize jsonb fields
    quantityTiers: Array.isArray(coupon.quantityTiers) 
      ? (coupon.quantityTiers as Array<{ minQuantity: number; discountPercent: number }>)
      : null,
    giftProductIds: Array.isArray(coupon.giftProductIds) 
      ? (coupon.giftProductIds as string[])
      : null,
  }));

  // Filter by tab
  let filteredCoupons = couponsWithInfluencer;
  if (filter && filter !== 'all') {
    if (filter === 'active') {
      filteredCoupons = couponsWithInfluencer.filter(c => c.isActive);
    } else if (filter === 'inactive') {
      filteredCoupons = couponsWithInfluencer.filter(c => !c.isActive);
    } else if (filter === 'expired') {
      filteredCoupons = couponsWithInfluencer.filter(c => c.endsAt && new Date(c.endsAt) < new Date());
    } else if (filter === 'plugins') {
      filteredCoupons = couponsWithInfluencer.filter(c => c.source === 'gamification');
    } else if (filter === 'dashboard') {
      filteredCoupons = couponsWithInfluencer.filter(c => c.source === 'dashboard');
    }
  }

  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    filteredCoupons = filteredCoupons.filter(c => 
      c.code.toLowerCase().includes(searchLower) ||
      c.title?.toLowerCase().includes(searchLower)
    );
  }

  // Pagination
  const perPage = 20;
  const currentPage = parseInt(page || '1', 10);
  const totalPages = Math.ceil(filteredCoupons.length / perPage);
  const paginatedCoupons = filteredCoupons.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // Count for tabs
  const activeCoupons = couponsWithInfluencer.filter(c => c.isActive);
  const inactiveCoupons = couponsWithInfluencer.filter(c => !c.isActive);
  const expiredCoupons = couponsWithInfluencer.filter(c => c.endsAt && new Date(c.endsAt) < new Date());
  const pluginCoupons = couponsWithInfluencer.filter(c => c.source === 'gamification');
  const dashboardCoupons = couponsWithInfluencer.filter(c => c.source === 'dashboard');
  const totalUsage = couponsWithInfluencer.reduce((sum, c) => sum + (c.usageCount || 0), 0);

  const tabs: Tab[] = [
    { id: 'all', label: 'הכל', count: couponsWithInfluencer.length },
    { id: 'active', label: 'פעילים', count: activeCoupons.length },
    { id: 'dashboard', label: 'מהדשבורד', count: dashboardCoupons.length },
    { id: 'plugins', label: 'מתוספים', count: pluginCoupons.length },
    { id: 'inactive', label: 'לא פעילים', count: inactiveCoupons.length },
    { id: 'expired', label: 'פגי תוקף', count: expiredCoupons.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="קופונים"
        description={`${activeCoupons.length} קופונים פעילים`}
        actions={
          <Link
            href={`/shops/${slug}/admin/discounts/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            קופון חדש
          </Link>
        }
      />

      {/* Stats */}
      <StatCardGrid columns={3}>
        <StatCard
          label="קופונים פעילים"
          value={activeCoupons.length}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="9" r="2"/>
              <circle cx="15" cy="15" r="2"/>
              <line x1="16" y1="8" x2="8" y2="16"/>
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
          }
        />
        <StatCard
          label="סה״כ שימושים"
          value={totalUsage}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/>
              <path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          }
        />
        <StatCard
          label="לא פעילים"
          value={inactiveCoupons.length}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          }
        />
      </StatCardGrid>

      {/* Coupons Table */}
      <DiscountsDataTable
        coupons={paginatedCoupons}
        storeId={store.id}
        storeSlug={slug}
        tabs={tabs}
        currentTab={filter || 'all'}
        searchValue={search}
        influencers={storeInfluencers}
        pagination={{
          currentPage,
          totalPages,
          totalItems: filteredCoupons.length,
          perPage,
        }}
      />
    </div>
  );
}
