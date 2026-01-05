import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/lib/db/queries';
import { 
  getConversionFunnel,
  getTopSearches,
  getAbandonedCartsStats,
  getRecentAbandonedCarts
} from '@/lib/actions/reports';
import { ReportHeader, getReportPeriodParams, toLegacyPeriod } from '@/components/admin/report-header';
import {
  LightbulbIcon,
  CheckCircleIcon,
} from '@/components/admin/icons';

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

function formatTimeAgo(date: Date | null) {
  if (!date) return '-';
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `לפני ${days} ${days === 1 ? 'יום' : 'ימים'}`;
  if (hours > 0) return `לפני ${hours} ${hours === 1 ? 'שעה' : 'שעות'}`;
  return 'עכשיו';
}

// Loading skeleton
function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-100 mb-2" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 bg-gray-50 mb-1" />
      ))}
    </div>
  );
}

// Conversion Funnel Component - Vertical bar chart style
function ConversionFunnel({ 
  data 
}: { 
  data: Array<{ step: string; count: number; rate: number }> 
}) {
  if (!data.length || data[0].count === 0) {
    return <p className="text-gray-500 text-center py-8">אין נתוני המרה לתקופה זו</p>;
  }

  const maxCount = data[0].count;

  return (
    <div className="space-y-4">
      {data.map((step, i) => {
        const widthPercent = (step.count / maxCount) * 100;
        const dropRate = i > 0 && data[i-1].count > 0 
          ? ((data[i-1].count - step.count) / data[i-1].count * 100) 
          : 0;
        
        return (
          <div key={step.step} className="relative">
            {/* Label row */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{step.step}</span>
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">{formatNumber(step.count)}</span>
                <span className="text-sm text-gray-500">({formatPercent(step.rate)})</span>
                {i > 0 && dropRate > 0 && (
                  <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                    -{formatPercent(dropRate)}
                  </span>
                )}
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="h-8 bg-gray-100 rounded overflow-hidden">
              <div 
                className="h-full bg-gradient-to-l from-black to-gray-700 transition-all duration-500"
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Search Queries Table
function SearchQueriesTable({ 
  queries 
}: { 
  queries: Array<{ query: string; searches: number; clickRate: number; avgResults: number }> 
}) {
  if (!queries.length) {
    return <p className="text-gray-500 text-center py-12">אין נתוני חיפושים לתקופה זו</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-right">
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">#</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">מונח חיפוש</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">חיפושים</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">ממוצע תוצאות</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">שיעור קליק</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {queries.map((query, i) => (
            <tr key={query.query} className="hover:bg-gray-50">
              <td className="py-3 px-4 text-gray-400">{i + 1}</td>
              <td className="py-3 px-4 font-medium">{query.query}</td>
              <td className="py-3 px-4">{formatNumber(query.searches)}</td>
              <td className="py-3 px-4">
                {query.avgResults === 0 ? (
                  <span className="text-red-500">0 תוצאות</span>
                ) : (
                  query.avgResults.toFixed(0)
                )}
              </td>
              <td className="py-3 px-4">
                <span className={query.clickRate >= 40 ? 'text-green-600' : query.clickRate >= 20 ? 'text-amber-600' : 'text-gray-500'}>
                  {formatPercent(query.clickRate)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Abandoned Carts Stats
function AbandonedCartsStats({ 
  stats 
}: { 
  stats: { total: number; totalValue: number; recovered: number; recoveredValue: number; recoveryRate: number; remindersSent: number } 
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="bg-white border border-gray-200 p-4">
        <p className="text-sm text-gray-500">עגלות נטושות</p>
        <p className="text-2xl font-medium mt-1">{formatNumber(stats.total)}</p>
        <p className="text-xs text-gray-400 mt-1">בתקופה הנבחרת</p>
      </div>
      <div className="bg-white border border-gray-200 p-4">
        <p className="text-sm text-gray-500">ערך פוטנציאלי</p>
        <p className="text-2xl font-medium mt-1">{formatCurrency(stats.totalValue)}</p>
      </div>
      <div className="bg-white border border-gray-200 p-4">
        <p className="text-sm text-gray-500">שוחזרו</p>
        <p className="text-2xl font-medium mt-1 text-green-600">{formatNumber(stats.recovered)}</p>
        <p className="text-xs text-gray-400 mt-1">{formatCurrency(stats.recoveredValue)}</p>
      </div>
      <div className="bg-white border border-gray-200 p-4">
        <p className="text-sm text-gray-500">שיעור שחזור</p>
        <p className="text-2xl font-medium mt-1">{formatPercent(stats.recoveryRate)}</p>
      </div>
      <div className="bg-white border border-gray-200 p-4">
        <p className="text-sm text-gray-500">תזכורות נשלחו</p>
        <p className="text-2xl font-medium mt-1">{formatNumber(stats.remindersSent)}</p>
      </div>
      <div className="bg-white border border-gray-200 p-4">
        <p className="text-sm text-gray-500">אבדן פוטנציאלי</p>
        <p className="text-2xl font-medium mt-1 text-red-600">
          {formatCurrency(stats.totalValue - stats.recoveredValue)}
        </p>
      </div>
    </div>
  );
}

// Recent Abandoned Carts Table
function RecentAbandonedCartsTable({ 
  carts 
}: { 
  carts: Array<{ 
    id: string; 
    email: string | null; 
    subtotal: number;
    checkoutStep: string | null;
    reminderSentAt: Date | null;
    createdAt: Date | null;
    items: Array<{ productName: string; quantity: number }>;
  }> 
}) {
  if (!carts.length) {
    return <p className="text-gray-500 text-center py-12">אין עגלות נטושות</p>;
  }

  const stepLabels: Record<string, string> = {
    cart: 'עגלה',
    shipping: 'משלוח',
    payment: 'תשלום',
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-right">
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">לקוח</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">פריטים</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">סכום</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">שלב</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">זמן</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">תזכורת</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {carts.map((cart) => (
            <tr key={cart.id} className="hover:bg-gray-50">
              <td className="py-3 px-4">
                <span className="font-medium">{cart.email || 'אנונימי'}</span>
              </td>
              <td className="py-3 px-4">
                <span className="text-gray-600">
                  {cart.items.length} פריטים
                </span>
              </td>
              <td className="py-3 px-4 font-medium">{formatCurrency(cart.subtotal)}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-0.5 text-xs bg-gray-100">
                  {stepLabels[cart.checkoutStep || ''] || cart.checkoutStep || '-'}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-500 text-sm">
                {formatTimeAgo(cart.createdAt)}
              </td>
              <td className="py-3 px-4">
                {cart.reminderSentAt ? (
                  <span className="text-green-600 text-sm">✓ נשלחה</span>
                ) : (
                  <button className="text-sm text-blue-600 hover:underline">
                    שלח תזכורת
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Content Component
async function BehaviorContent({ 
  storeId, 
  period,
  customRange 
}: { 
  storeId: string; 
  period: '7d' | '30d' | '90d' | 'custom';
  customRange?: { from: Date; to: Date };
}) {
  // Parallel data fetching
  const [funnel, topSearches, abandonedStats, recentAbandoned] = await Promise.all([
    getConversionFunnel(storeId, period, customRange),
    getTopSearches(storeId, period, 20, customRange),
    getAbandonedCartsStats(storeId, period, customRange),
    getRecentAbandonedCarts(storeId, 10),
  ]);

  // Find searches with no results
  const noResultsSearches = topSearches.filter(s => s.avgResults === 0);

  return (
    <>
      {/* Conversion Funnel */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="font-medium mb-4">משפך המרה</h2>
        <ConversionFunnel data={funnel} />
        
        {/* Funnel insights */}
        {funnel.length >= 2 && funnel[0].count > 0 && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-100">
            <h3 className="font-medium text-sm mb-2">תובנות</h3>
            {(() => {
              // Find the biggest drop
              let maxDrop = 0;
              let maxDropIndex = 0;
              for (let i = 1; i < funnel.length; i++) {
                if (funnel[i-1].count > 0) {
                  const drop = (funnel[i-1].count - funnel[i].count) / funnel[i-1].count * 100;
                  if (drop > maxDrop) {
                    maxDrop = drop;
                    maxDropIndex = i;
                  }
                }
              }
              
              const lastStep = funnel[funnel.length - 1];
              const conversionRate = lastStep?.rate || 0;
              
              return (
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• שיעור המרה כולל: <strong>{formatPercent(conversionRate)}</strong></li>
                  {maxDrop > 0 && maxDropIndex > 0 && (
                    <li>• נטישה הגדולה ביותר: בין &quot;{funnel[maxDropIndex-1].step}&quot; ל&quot;{funnel[maxDropIndex].step}&quot; ({formatPercent(maxDrop)})</li>
                  )}
                  <li>• {formatPercent(100 - conversionRate)} מהמבקרים לא השלימו רכישה</li>
                </ul>
              );
            })()}
          </div>
        )}
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Top Searches */}
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="font-medium mb-4">חיפושים מובילים</h2>
          <SearchQueriesTable queries={topSearches.slice(0, 10)} />
        </div>

        {/* No Results Searches */}
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="font-medium mb-4">חיפושים ללא תוצאות</h2>
          {noResultsSearches.length > 0 ? (
            <div className="space-y-2">
              {noResultsSearches.slice(0, 10).map((search) => (
                <div key={search.query} className="flex items-center justify-between p-3 bg-red-50 border border-red-100">
                  <span className="font-medium">{search.query}</span>
                  <span className="text-sm text-gray-500">{search.searches} חיפושים</span>
                </div>
              ))}
              <p className="text-sm text-gray-500 mt-4 flex items-center gap-2">
                <LightbulbIcon size={16} className="text-amber-500" />
                שקול להוסיף מוצרים או סינונימים למונחים אלו
              </p>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8 flex flex-col items-center gap-2">
              <CheckCircleIcon size={24} className="text-green-500" />
              <span>אין חיפושים ללא תוצאות</span>
            </div>
          )}
        </div>
      </div>

      {/* Abandoned Carts Section */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="font-medium mb-4">עגלות נטושות</h2>
        <AbandonedCartsStats stats={abandonedStats} />
      </div>

      {/* Recent Abandoned Carts */}
      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">עגלות נטושות אחרונות</h2>
          <span className="text-sm text-gray-500">לא שוחזרו</span>
        </div>
        <RecentAbandonedCartsTable carts={recentAbandoned} />
      </div>
    </>
  );
}

// Page Component
export default async function BehaviorReportPage({
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
        title="דוח התנהגות"
        description="משפך המרה, חיפושים ועגלות נטושות"
        storeSlug={slug}
        backHref={`/shops/${slug}/admin/reports`}
      />

      <Suspense fallback={<TableSkeleton />}>
        <BehaviorContent storeId={store.id} period={period} customRange={customRange} />
      </Suspense>
    </div>
  );
}

