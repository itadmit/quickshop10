import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/lib/db/queries';
import { getShippingStats } from '@/lib/actions/reports';
import { ReportHeader, toLegacyPeriod } from '@/components/admin/report-header';

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
async function ShippingContent({ storeId, period }: { storeId: string; period: '7d' | '30d' | '90d' }) {
  const stats = await getShippingStats(storeId, period);

  return (
    <>
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <p className="text-sm text-gray-500">סה״כ הזמנות</p>
          <p className="text-xl sm:text-2xl font-medium mt-1">{formatNumber(stats.totalOrders)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <p className="text-sm text-gray-500">משלוחים בתשלום</p>
          <p className="text-xl sm:text-2xl font-medium mt-1">{formatNumber(stats.paidShippingOrders)}</p>
          <p className="text-xs text-gray-400 mt-1">{formatCurrency(stats.totalPaidShipping)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <p className="text-sm text-gray-500">משלוחים חינם</p>
          <p className="text-xl sm:text-2xl font-medium mt-1 text-green-600">{formatNumber(stats.freeShippingOrders)}</p>
          <p className="text-xs text-gray-400 mt-1">{formatPercent(stats.freeShippingPercentage)} מההזמנות</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <p className="text-sm text-gray-500">ממוצע עלות משלוח</p>
          <p className="text-xl sm:text-2xl font-medium mt-1">{formatCurrency(stats.averageShipping)}</p>
          <p className="text-xs text-gray-400 mt-1">לא כולל משלוח חינם</p>
        </div>
      </div>

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

  const period = toLegacyPeriod(resolvedSearchParams);

  return (
    <div>
      <ReportHeader
        title="דוח משלוחים"
        description="ניתוח משלוחים בתשלום וחינמיים"
        storeSlug={slug}
        backHref={`/shops/${slug}/admin/reports`}
      />

      <Suspense fallback={<TableSkeleton />}>
        <ShippingContent storeId={store.id} period={period} />
      </Suspense>
    </div>
  );
}


