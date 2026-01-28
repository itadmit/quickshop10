import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getStoreBySlug } from '@/lib/db/queries';
import { getReportsDashboard } from '@/lib/actions/reports';
import { DateRangePicker } from '@/components/admin/date-range-picker';
import { getReportPeriodParams } from '@/components/admin/report-header';

// Components
import { StatCard } from '@/components/admin/ui';
import {
  ChartBarIcon,
  UsersIcon,
  GlobeIcon,
  SearchIcon,
  WalletIcon,
  PackageIcon,
  AlertTriangleIcon,
  ArrowLeftIcon,
} from '@/components/admin/icons';

// Skeleton
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white border border-gray-200 p-3 sm:p-6 animate-pulse">
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-16 sm:w-20 mb-2" />
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-20 sm:w-28" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white border border-gray-200 p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
      <div className="h-64 bg-gray-100 rounded" />
    </div>
  );
}

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

// Quick Report Card
function QuickReportCard({ 
  title, 
  href, 
  icon,
  description 
}: { 
  title: string; 
  href: string; 
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Link 
      href={href}
      className="block bg-white border border-gray-200 p-4 sm:p-6 hover:border-black transition-colors group"
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-gray-600 [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6">{icon}</span>
          <h3 className="font-medium text-sm sm:text-base mt-2 group-hover:underline">{title}</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">{description}</p>
        </div>
        <ArrowLeftIcon className="text-gray-400 group-hover:text-black transition-colors flex-shrink-0" size={16} />
      </div>
    </Link>
  );
}

// Sales Chart Component - Improved Design
function SalesChart({ data }: { data: Array<{ date: string; revenue: number; orders: number }> }) {
  if (!data.length) {
    return (
      <div className="h-72 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
        <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm">אין נתונים לתקופה זו</p>
      </div>
    );
  }

  // Check if data is by hour (contains time in date string)
  const isByHour = data[0]?.date.includes(' ') && data[0]?.date.includes(':');

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
  
  // Y-axis ticks
  const yAxisTicks = [0, maxRevenue * 0.25, maxRevenue * 0.5, maxRevenue * 0.75, maxRevenue];
  
  return (
    <div className="h-72">
      {/* Summary Stats */}
      <div className="flex items-center gap-6 mb-4 text-sm">
        <div>
          <span className="text-gray-500">סה״כ: </span>
          <span className="font-semibold">{formatCurrency(totalRevenue)}</span>
        </div>
        <div>
          <span className="text-gray-500">הזמנות: </span>
          <span className="font-semibold">{formatNumber(totalOrders)}</span>
        </div>
      </div>

      <div className="flex h-48">
        {/* Y-axis */}
        <div className="flex flex-col justify-between text-[10px] text-gray-400 pl-2 w-14 text-left">
          {yAxisTicks.reverse().map((tick, i) => (
            <span key={i} className="leading-none">
              {tick >= 1000 ? `₪${(tick/1000).toFixed(1)}K` : `₪${Math.round(tick)}`}
            </span>
          ))}
        </div>
        
        {/* Chart Area */}
        <div className="flex-1 relative">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-gray-100 w-full" />
            ))}
          </div>
          
          {/* Bars */}
          <div className="relative flex items-end gap-1 h-full">
        {data.map((day, i) => {
          const height = (day.revenue / maxRevenue) * 100;
          
          // Format label based on whether it's by hour or by day
          let label = '';
          if (isByHour) {
            const hourMatch = day.date.match(/\s(\d{2}):/);
            const hour = hourMatch ? parseInt(hourMatch[1]) : 0;
            label = `${hour}:00`;
          } else {
          const date = new Date(day.date);
                label = date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
          }
          
          return (
            <div 
              key={i} 
                  className="flex-1 group relative h-full flex items-end"
            >
              {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs px-3 py-2.5 rounded-lg shadow-xl whitespace-nowrap border border-gray-700">
                      <div className="font-semibold text-gray-100 mb-1">{label}</div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                        <span>{formatCurrency(day.revenue)}</span>
                      </div>
                      <div className="text-gray-400 text-[11px] mt-0.5">{day.orders} הזמנות</div>
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
              
              {/* Bar */}
                <div 
                    className="w-full bg-gradient-to-t from-gray-800 to-gray-600 hover:from-gray-700 hover:to-gray-500 transition-all duration-200 rounded-t cursor-pointer"
                    style={{ 
                      height: `${Math.max(height, 3)}%`,
                      minHeight: day.revenue > 0 ? '4px' : '2px'
                    }}
                />
            </div>
          );
        })}
          </div>
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className="flex mt-2 mr-14">
        {data.map((day, i) => {
          // For hours: show every 3 hours
          // For days: show based on data length
          const showLabel = isByHour
            ? i % 3 === 0
            : data.length <= 10 || i % Math.ceil(data.length / 8) === 0;
          
          let label = '';
          if (isByHour) {
            const hourMatch = day.date.match(/\s(\d{2}):/);
            const hour = hourMatch ? parseInt(hourMatch[1]) : 0;
            label = `${hour}:00`;
          } else {
          const date = new Date(day.date);
            label = date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
          }
          
          return (
            <div key={i} className="flex-1 text-center">
              {showLabel && (
                <span className="text-[10px] text-gray-500 font-medium">
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Top Products Component
function TopProductsList({ 
  products 
}: { 
  products: Array<{ id: string; name: string; image: string | null; revenue: number; quantity: number }> 
}) {
  if (!products.length) {
    return <p className="text-gray-500 text-center py-8">אין נתוני מוצרים לתקופה זו</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {products.map((product, i) => (
        <div key={`${product.id}-${i}`} className="flex items-center gap-4 py-3">
          <span className="text-gray-400 text-sm w-4">{i + 1}</span>
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name}
              className="w-10 h-10 object-cover bg-gray-100"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-100" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{product.name}</p>
            <p className="text-xs text-gray-500">{product.quantity} יחידות</p>
          </div>
          <span className="font-medium">{formatCurrency(product.revenue)}</span>
        </div>
      ))}
    </div>
  );
}

// Traffic Sources Component
function TrafficSourcesList({ 
  sources 
}: { 
  sources: Array<{ source: string; sessions: number; orders: number; conversionRate: number }> 
}) {
  if (!sources.length) {
    return <p className="text-gray-500 text-center py-8">אין נתוני תנועה לתקופה זו</p>;
  }

  const sourceLabels: Record<string, string> = {
    google: 'Google',
    facebook: 'Facebook',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    email: 'אימייל',
    direct: 'ישיר',
    referral: 'הפניות',
  };

  return (
    <div className="divide-y divide-gray-100">
      {sources.slice(0, 5).map((source) => (
        <div key={source.source} className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium">{sourceLabels[source.source] || source.source}</p>
            <p className="text-xs text-gray-500">{formatNumber(source.sessions)} ביקורים</p>
          </div>
          <div className="text-left">
            <p className="font-medium">{source.orders} הזמנות</p>
            <p className="text-xs text-gray-500">{formatPercent(source.conversionRate)} המרה</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Conversion Funnel Component
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
    <div className="space-y-3">
      {data.map((step, i) => (
        <div key={step.step}>
          <div className="flex justify-between text-sm mb-1">
            <span>{step.step}</span>
            <span className="text-gray-500">
              {formatNumber(step.count)} ({formatPercent(step.rate)})
            </span>
          </div>
          <div className="h-6 bg-gray-100 overflow-hidden">
            <div 
              className="h-full bg-black/80 transition-all duration-500"
              style={{ width: `${(step.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Stats Cards Only - for top section
async function StatsContent({ 
  storeId, 
  period,
  customRange 
}: { 
  storeId: string; 
  period: '7d' | '30d' | '90d' | 'custom';
  customRange?: { from: Date; to: Date };
}) {
  const dashboard = await getReportsDashboard(storeId, period, customRange);

  return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="סה״כ הכנסות"
          value={formatCurrency(dashboard.salesOverview.totalRevenue)}
          subLabel={`${dashboard.salesOverview.totalOrders} הזמנות`}
        />
        <StatCard
          label="ממוצע הזמנה"
          value={formatCurrency(dashboard.salesOverview.averageOrderValue)}
        />
        <StatCard
          label="לקוחות חדשים"
          value={formatNumber(dashboard.salesOverview.newCustomers)}
          subLabel={`מתוך ${dashboard.salesOverview.totalCustomers}`}
        />
        <StatCard
          label="שיעור המרה"
          value={formatPercent(dashboard.salesOverview.conversionRate)}
        />
      </div>
  );
}

// Charts and Lists Content - for bottom section
async function ChartsContent({ 
  storeId, 
  period,
  customRange 
}: { 
  storeId: string; 
  period: '7d' | '30d' | '90d' | 'custom';
  customRange?: { from: Date; to: Date };
}) {
  const dashboard = await getReportsDashboard(storeId, period, customRange);

  return (
    <>
      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Sales Chart - Improved Design */}
        <div className="bg-white border border-gray-200 p-4 sm:p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sm sm:text-base">מכירות לפי יום</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-block w-3 h-3 bg-black rounded-sm"></span>
              הכנסות
            </div>
          </div>
          <SalesChart data={dashboard.salesByDay} />
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white border border-gray-200 p-4 sm:p-6 rounded-lg shadow-sm">
          <h3 className="font-medium text-sm sm:text-base mb-4">משפך המרה</h3>
          <ConversionFunnel data={dashboard.conversionFunnel} />
        </div>
      </div>

      {/* Lists Row */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
        {/* Top Products */}
        <div className="bg-white border border-gray-200 p-4 sm:p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-medium text-sm sm:text-base">מוצרים מובילים</h3>
            <Link href="reports/sales" className="text-xs sm:text-sm text-gray-500 hover:text-black">
              כל המוצרים ←
            </Link>
          </div>
          <TopProductsList products={dashboard.topProducts} />
        </div>

        {/* Traffic Sources */}
        <div className="bg-white border border-gray-200 p-4 sm:p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-medium text-sm sm:text-base">מקורות תנועה</h3>
            <Link href="reports/traffic" className="text-xs sm:text-sm text-gray-500 hover:text-black">
              כל המקורות ←
            </Link>
          </div>
          <TrafficSourcesList sources={dashboard.trafficSources} />
        </div>
      </div>

      {/* Inventory Alert */}
      {(dashboard.inventoryStats.lowStock > 0 || dashboard.inventoryStats.outOfStock > 0) && (
        <div className="mt-4 sm:mt-6 bg-amber-50 border border-amber-200 p-3 sm:p-4 rounded-lg">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertTriangleIcon className="text-amber-600 flex-shrink-0 mt-0.5 w-4 h-4 sm:w-5 sm:h-5" size={20} />
            <div>
              <p className="font-medium text-sm sm:text-base text-amber-800">התראת מלאי</p>
              <p className="text-xs sm:text-sm text-amber-700 mt-1">
                {dashboard.inventoryStats.outOfStock > 0 && (
                  <span>{dashboard.inventoryStats.outOfStock} מוצרים אזלו מהמלאי. </span>
                )}
                {dashboard.inventoryStats.lowStock > 0 && (
                  <span>{dashboard.inventoryStats.lowStock} מוצרים במלאי נמוך.</span>
                )}
              </p>
              <Link 
                href="reports/inventory" 
                className="text-xs sm:text-sm text-amber-800 underline mt-2 inline-block"
              >
                צפה בדוח מלאי
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Page Component
export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const { period, customRange } = getReportPeriodParams(resolvedSearchParams);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium">דוחות ואנליטיקס</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">ניתוח ביצועי החנות</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Picker - uses current pathname automatically */}
          <DateRangePicker />
          
          {/* Realtime Button */}
          <Link
            href={`/shops/${slug}/admin/analytics/realtime`}
            className="flex items-center gap-2 px-3 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            זמן אמת
          </Link>
        </div>
      </div>

      {/* Stats Cards - TOP */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsContent storeId={store.id} period={period} customRange={customRange} />
      </Suspense>

      {/* Quick Access to Reports - BETWEEN STATS AND CHARTS */}
      <div className="mt-6 sm:mt-8">
        <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">דוחות מפורטים</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <QuickReportCard
            title="דוח מכירות"
            href="reports/sales"
            icon={<ChartBarIcon size={24} />}
            description="מכירות, הזמנות ומוצרים מובילים"
          />
          <QuickReportCard
            title="דוח קופונים"
            href="reports/coupons"
            icon={
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="9" cy="9" r="2"/>
                <circle cx="15" cy="15" r="2"/>
                <line x1="16" y1="8" x2="8" y2="16"/>
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
            }
            description="שימוש בקופונים והנחות"
          />
          <QuickReportCard
            title="דוח משלוחים"
            href="reports/shipping"
            icon={
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
              </svg>
            }
            description="משלוחים בתשלום וחינמיים"
          />
          <QuickReportCard
            title="דוח פיננסי"
            href="reports/financial"
            icon={<WalletIcon size={24} />}
            description="קרדיטים ומשפיענים"
          />
          <QuickReportCard
            title="דוח גיפט קארדים"
            href="reports/gift-cards"
            icon={
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            }
            description="יתרות, שימוש ומעקב"
          />
          <QuickReportCard
            title="דוח לקוחות"
            href="reports/customers"
            icon={<UsersIcon size={24} />}
            description="פילוח לקוחות, VIP ובסיכון"
          />
          <QuickReportCard
            title="דוח תנועה"
            href="reports/traffic"
            icon={<GlobeIcon size={24} />}
            description="מקורות תנועה, UTM ומכשירים"
          />
          <QuickReportCard
            title="דוח התנהגות"
            href="reports/behavior"
            icon={<SearchIcon size={24} />}
            description="משפך המרה, חיפושים ועגלות נטושות"
          />
          <QuickReportCard
            title="דוח מלאי"
            href="reports/inventory"
            icon={<PackageIcon size={24} />}
            description="רמות מלאי ומוצרים נמוכים"
          />
        </div>
      </div>

      {/* Charts and Lists - BOTTOM */}
      <div className="mt-6 sm:mt-8">
      <Suspense fallback={
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
      }>
          <ChartsContent storeId={store.id} period={period} customRange={customRange} />
      </Suspense>
      </div>
    </div>
  );
}


