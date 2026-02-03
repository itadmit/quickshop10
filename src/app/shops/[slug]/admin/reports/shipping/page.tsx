import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/lib/db/queries';
import { getShippingStats } from '@/lib/actions/reports';
import { ReportHeader, getReportPeriodParams } from '@/components/admin/report-header';
import { StatCard, StatCardGrid } from '@/components/admin/ui';

// Format helpers
function formatCurrency(value: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('he-IL').format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
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
      <div className="h-64 bg-gray-100" />
    </div>
  );
}

// Shipping Methods Chart
function ShippingMethodsChart({ 
  byMethod 
}: { 
  byMethod: Array<{ method: string; orders: number; revenue: number }> 
}) {
  if (!byMethod.length) {
    return <p className="text-gray-500 text-center py-8">אין נתוני משלוחים</p>;
  }

  const maxOrders = Math.max(...byMethod.map(m => m.orders), 1);

  return (
    <div className="space-y-4">
      {byMethod.map(method => (
        <div key={method.method}>
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium">{method.method}</span>
            <div className="text-left">
              <span className="font-medium">{formatNumber(method.orders)} הזמנות</span>
              <span className="text-gray-500 mr-3">{formatCurrency(method.revenue)}</span>
            </div>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-black rounded-full transition-all duration-500"
              style={{ width: `${(method.orders / maxOrders) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Content Component
async function ShippingContent({ 
  storeId, 
  period,
  customRange 
}: { 
  storeId: string; 
  period: '7d' | '30d' | '90d' | 'custom';
  customRange?: { from: Date; to: Date };
}) {
  const stats = await getShippingStats(storeId, period, customRange);

  return (
    <>
      {/* Stats Row */}
      <StatCardGrid columns={4} className="mb-6">
        <StatCard
          label="סה״כ הזמנות"
          value={formatNumber(stats.totalOrders)}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          label="משלוחים בתשלום"
          value={formatNumber(stats.paidShippingOrders)}
          subtitle={formatCurrency(stats.totalPaidShipping)}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          }
        />
        <StatCard
          label="משלוחים חינם"
          value={formatNumber(stats.freeShippingOrders)}
          subtitle={`${formatPercent(stats.freeShippingPercentage)} מההזמנות`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          }
        />
        <StatCard
          label="ממוצע עלות משלוח"
          value={formatCurrency(stats.averageShipping)}
          subtitle="לא כולל משלוח חינם"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </StatCardGrid>

      {/* Summary Cards */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Paid vs Free */}
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="font-medium mb-4">התפלגות משלוחים</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-6 bg-gray-100 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-black"
                  style={{ width: `${stats.totalOrders > 0 ? (stats.paidShippingOrders / stats.totalOrders) * 100 : 0}%` }}
                />
                <div 
                  className="h-full bg-green-500"
                  style={{ width: `${stats.freeShippingPercentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-black rounded" />
                  <span>בתשלום ({formatNumber(stats.paidShippingOrders)})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded" />
                  <span>חינם ({formatNumber(stats.freeShippingOrders)})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="bg-black text-white p-6">
          <h2 className="font-medium mb-4">סיכום הכנסות משלוח</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">הכנסות ממשלוחים בתשלום</span>
              <span className="font-medium text-lg">{formatCurrency(stats.totalPaidShipping)}</span>
            </div>
            <div className="flex justify-between items-center text-green-400">
              <span>משלוחים חינמיים (הטבות/הנחות)</span>
              <span>{formatNumber(stats.freeShippingOrders)} הזמנות</span>
            </div>
            <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
              <span className="text-gray-400">ממוצע הכנסה למשלוח</span>
              <span className="font-medium">
                {stats.totalOrders > 0 
                  ? formatCurrency(stats.totalPaidShipping / stats.totalOrders)
                  : formatCurrency(0)
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Methods */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="font-medium mb-4">שיטות משלוח</h2>
        <ShippingMethodsChart byMethod={stats.byMethod} />
      </div>
    </>
  );
}

// Page Component
export default async function ShippingReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const { period, customRange } = getReportPeriodParams(resolvedSearchParams);

  return (
    <div>
      <ReportHeader
        title="דוח משלוחים"
        description="ניתוח משלוחים בתשלום וחינמיים"
        storeSlug={slug}
        backHref={`/shops/${slug}/admin/reports`}
      />

      <Suspense fallback={<TableSkeleton />}>
        <ShippingContent storeId={store.id} period={period} customRange={customRange} />
      </Suspense>
    </div>
  );
}


