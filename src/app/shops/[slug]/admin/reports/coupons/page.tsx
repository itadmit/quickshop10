import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getStoreBySlug } from '@/lib/db/queries';
import { getCouponStats, getCouponOrders, getGamificationCouponCodes } from '@/lib/actions/reports';
import { ReportHeader, getReportPeriodParams } from '@/components/admin/report-header';
import { CouponsTable } from './coupons-table';

// Format helpers
function formatCurrency(value: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('he-IL').format(value);
}

// Loading skeleton
function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100" />
        ))}
      </div>
      <div className="h-10 bg-gray-100 mb-2" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 bg-gray-50 mb-1" />
      ))}
    </div>
  );
}

// Content Component
async function CouponsContent({ 
  storeId, 
  storeSlug, 
  period,
  customRange,
  source,
}: { 
  storeId: string; 
  storeSlug: string; 
  period: '7d' | '30d' | '90d' | 'custom';
  customRange?: { from: Date; to: Date };
  source?: 'all' | 'dashboard' | 'plugins';
}) {
  // Get all coupon stats and gamification coupon codes in parallel
  const [{ coupons: allCoupons, totals: allTotals }, gamificationCodes] = await Promise.all([
    getCouponStats(storeId, period, customRange),
    getGamificationCouponCodes(storeId),
  ]);

  // Filter coupons based on source
  const gamificationCodesSet = new Set(gamificationCodes);
  let filteredCoupons = allCoupons;
  
  if (source === 'dashboard') {
    filteredCoupons = allCoupons.filter(c => !gamificationCodesSet.has(c.code));
  } else if (source === 'plugins') {
    filteredCoupons = allCoupons.filter(c => gamificationCodesSet.has(c.code));
  }

  // Calculate totals for filtered
  const totals = {
    totalCouponsUsed: filteredCoupons.length,
    totalOrders: filteredCoupons.reduce((sum, c) => sum + c.orders, 0),
    totalRevenue: filteredCoupons.reduce((sum, c) => sum + c.revenue, 0),
    totalDiscounts: filteredCoupons.reduce((sum, c) => sum + c.discountTotal, 0),
  };

  // Count for tabs
  const dashboardCount = allCoupons.filter(c => !gamificationCodesSet.has(c.code)).length;
  const pluginsCount = allCoupons.filter(c => gamificationCodesSet.has(c.code)).length;

  // Get orders for top 10 coupons in parallel
  const top10Coupons = filteredCoupons.slice(0, 10);
  const couponOrdersResults = await Promise.all(
    top10Coupons.map(c => 
      getCouponOrders(storeId, c.code, period, customRange).then(orders => ({ code: c.code, orders }))
    )
  );
  
  const couponOrdersMap: Record<string, typeof couponOrdersResults[0]['orders']> = {};
  couponOrdersResults.forEach(({ code, orders }) => {
    couponOrdersMap[code] = orders;
  });

  return (
    <>
      {/* Source Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <Link
          href={`/shops/${storeSlug}/admin/reports/coupons?source=all`}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            !source || source === 'all'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          הכל ({allCoupons.length})
        </Link>
        <Link
          href={`/shops/${storeSlug}/admin/reports/coupons?source=dashboard`}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            source === 'dashboard'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          מהדשבורד ({dashboardCount})
        </Link>
        <Link
          href={`/shops/${storeSlug}/admin/reports/coupons?source=plugins`}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            source === 'plugins'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          מתוספים ({pluginsCount})
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <p className="text-sm text-gray-500">קופונים שימושיים</p>
          <p className="text-xl sm:text-2xl font-medium mt-1">{formatNumber(totals.totalCouponsUsed)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <p className="text-sm text-gray-500">הזמנות עם קופון</p>
          <p className="text-xl sm:text-2xl font-medium mt-1">{formatNumber(totals.totalOrders)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <p className="text-sm text-gray-500">הכנסות מקופונים</p>
          <p className="text-xl sm:text-2xl font-medium mt-1">{formatCurrency(totals.totalRevenue)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <p className="text-sm text-gray-500">סה״כ הנחות שניתנו</p>
          <p className="text-xl sm:text-2xl font-medium mt-1 text-green-600">{formatCurrency(totals.totalDiscounts)}</p>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">שימוש בקופונים</h2>
          <p className="text-sm text-gray-500">לחץ על קופון לצפייה בהזמנות</p>
        </div>
        <div className="overflow-x-auto">
          <CouponsTable 
            coupons={filteredCoupons} 
            couponOrdersMap={couponOrdersMap}
            storeSlug={storeSlug}
          />
        </div>
      </div>
    </>
  );
}

// Page Component
export default async function CouponsReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string; from?: string; to?: string; source?: 'all' | 'dashboard' | 'plugins' }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const { period, customRange } = getReportPeriodParams(resolvedSearchParams);
  const source = resolvedSearchParams.source || 'all';

  return (
    <div>
      <ReportHeader
        title="דוח קופונים"
        description="שימוש בקופונים והנחות לפי תקופה"
        storeSlug={slug}
        backHref={`/shops/${slug}/admin/reports`}
      />

      <Suspense fallback={<TableSkeleton />}>
        <CouponsContent 
          storeId={store.id} 
          storeSlug={slug} 
          period={period} 
          customRange={customRange} 
          source={source}
        />
      </Suspense>
    </div>
  );
}
