import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getStoreBySlug } from '@/lib/db/queries';
import { getReportsDashboard } from '@/lib/actions/reports';
import { DateRangePicker } from '@/components/admin/date-range-picker';

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

// Sales Chart Component
function SalesChart({ data }: { data: Array<{ date: string; revenue: number; orders: number }> }) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        אין נתונים לתקופה זו
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  
  return (
    <div className="h-64">
      <div className="h-56 flex items-end gap-0.5">
        {data.map((day, i) => {
          const heightPercent = (day.revenue / maxRevenue) * 100;
          const date = new Date(day.date);
          const dayLabel = date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
          
          return (
            <div 
              key={i} 
              className="flex-1 group relative"
              style={{ height: '100%' }}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                <div className="bg-black text-white text-xs px-3 py-2 rounded shadow-lg whitespace-nowrap">
                  <div className="font-medium">{dayLabel}</div>
                  <div>{formatCurrency(day.revenue)}</div>
                  <div className="text-gray-300">{day.orders} הזמנות</div>
                </div>
              </div>
              
              {/* Bar */}
              <div className="absolute bottom-0 left-0 right-0 flex items-end h-full">
                <div 
                  className="w-full bg-black hover:bg-gray-700 transition-colors rounded-t-sm"
                  style={{ height: `${Math.max(heightPercent, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* X-axis labels */}
      <div className="h-8 flex gap-0.5 mt-1">
        {data.map((day, i) => {
          const date = new Date(day.date);
          const showLabel = data.length <= 14 || i % Math.ceil(data.length / 10) === 0;
          return (
            <div key={i} className="flex-1 text-center overflow-hidden">
              {showLabel && (
                <span className="text-[9px] text-gray-400">
                  {date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}
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
        <div key={product.id} className="flex items-center gap-4 py-3">
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

// Dashboard Content
async function DashboardContent({ storeId, period }: { storeId: string; period: '7d' | '30d' | '90d' }) {
  const dashboard = await getReportsDashboard(storeId, period);

  return (
    <>
      {/* Stats Cards */}
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

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
        {/* Sales Chart */}
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <h3 className="font-medium text-sm sm:text-base mb-3 sm:mb-4">מכירות לפי יום</h3>
          <SalesChart data={dashboard.salesByDay} />
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <h3 className="font-medium text-sm sm:text-base mb-3 sm:mb-4">משפך המרה</h3>
          <ConversionFunnel data={dashboard.conversionFunnel} />
        </div>
      </div>

      {/* Lists Row */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
        {/* Top Products */}
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-medium text-sm sm:text-base">מוצרים מובילים</h3>
            <Link href="reports/sales" className="text-xs sm:text-sm text-gray-500 hover:text-black">
              כל המוצרים ←
            </Link>
          </div>
          <TopProductsList products={dashboard.topProducts} />
        </div>

        {/* Traffic Sources */}
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
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
        <div className="mt-4 sm:mt-6 bg-amber-50 border border-amber-200 p-3 sm:p-4">
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
  const { period: periodParam } = await searchParams;
  
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  // Map period to days for the report function
  const periodToDays: Record<string, number> = {
    'today': 1,
    'yesterday': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '6m': 180,
    '1y': 365,
  };

  const validPeriods = ['today', 'yesterday', '7d', '30d', '90d', '6m', '1y', 'custom'];
  const period = validPeriods.includes(periodParam || '') 
    ? periodParam as string
    : '30d';

  // Convert to the format expected by getReportsDashboard
  const reportPeriod = period === 'today' || period === 'yesterday' ? '7d' 
    : period === '6m' || period === '1y' ? '90d'
    : (period as '7d' | '30d' | '90d');

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium">דוחות ואנליטיקס</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">ניתוח ביצועי החנות</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Picker */}
          <DateRangePicker basePath={`/shops/${slug}/admin/reports`} />
          
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

      {/* Quick Access to Reports - MOVED TO TOP */}
      <div className="mb-6 sm:mb-8">
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
            description="גיפט קארדים, קרדיטים ומשפיענים"
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

      {/* Dashboard Content with Suspense */}
      <Suspense fallback={
        <>
          <StatsSkeleton />
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </>
      }>
        <DashboardContent storeId={store.id} period={reportPeriod} />
      </Suspense>
    </div>
  );
}

