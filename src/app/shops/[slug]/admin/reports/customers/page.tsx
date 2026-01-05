import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/lib/db/queries';
import { 
  getCustomerSegments,
  getTopCustomers,
  getNewVsReturning,
  getSalesOverview 
} from '@/lib/actions/reports';
import { ReportHeader, getReportPeriodParams } from '@/components/admin/report-header';
import {
  StarIcon,
  RefreshCwIcon,
  SparklesIcon,
  AlertTriangleIcon,
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

function formatDate(date: Date | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'numeric',
    year: '2-digit',
  });
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

// Customer Segments Component
function CustomerSegments({ 
  segments 
}: { 
  segments: Array<{ segment: string; count: number; percentage: number }> 
}) {
  const segmentColors: Record<string, string> = {
    'VIP': 'bg-amber-500',
    'חוזרים': 'bg-green-500',
    'חדשים': 'bg-blue-500',
    'בסיכון': 'bg-red-500',
  };

  const segmentIcons: Record<string, React.ReactNode> = {
    'VIP': <StarIcon className="text-amber-500" size={20} />,
    'חוזרים': <RefreshCwIcon className="text-green-600" size={20} />,
    'חדשים': <SparklesIcon className="text-blue-500" size={20} />,
    'בסיכון': <AlertTriangleIcon className="text-red-500" size={20} />,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {segments.map((segment) => (
        <div key={segment.segment} className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            {segmentIcons[segment.segment] || <span className="w-5 h-5" />}
            <span className="font-medium">{segment.segment}</span>
          </div>
          <p className="text-3xl font-medium">{formatNumber(segment.count)}</p>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100">
                <div 
                  className={`h-full ${segmentColors[segment.segment] || 'bg-gray-400'}`}
                  style={{ width: `${segment.percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-500">{segment.percentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Top Customers Table
function TopCustomersTable({ 
  customers 
}: { 
  customers: Array<{ 
    id: string; 
    firstName: string | null; 
    lastName: string | null; 
    email: string; 
    totalOrders: number | null; 
    totalSpent: number;
    createdAt: Date | null;
  }> 
}) {
  if (!customers.length) {
    return <p className="text-gray-500 text-center py-12">אין לקוחות להצגה</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-right">
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">#</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">לקוח</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">אימייל</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">הזמנות</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">סה״כ רכישות</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">הצטרף</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">סטטוס</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {customers.map((customer, i) => {
            const isVIP = customer.totalSpent >= 3000;
            const isNew = customer.createdAt && 
              new Date(customer.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            return (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                      {(customer.firstName?.[0] || customer.email[0]).toUpperCase()}
                    </div>
                    <span className="font-medium">
                      {customer.firstName || customer.lastName 
                        ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                        : 'אורח'
                      }
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">{customer.email}</td>
                <td className="py-3 px-4">{customer.totalOrders || 0}</td>
                <td className="py-3 px-4 font-medium">{formatCurrency(customer.totalSpent)}</td>
                <td className="py-3 px-4 text-gray-500">{formatDate(customer.createdAt)}</td>
                <td className="py-3 px-4">
                  {isVIP && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-100 text-amber-700">
                      <StarIcon size={12} /> VIP
                    </span>
                  )}
                  {isNew && !isVIP && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700">
                      <SparklesIcon size={12} /> חדש
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// New vs Returning Chart
function NewVsReturningChart({ 
  data 
}: { 
  data: Array<{ date: string; newCustomers: number; returningCustomers: number }> 
}) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        אין נתונים לתקופה זו
      </div>
    );
  }

  // Check if data is by hour (contains time in date string)
  const isByHour = data[0]?.date.includes(' ') && data[0]?.date.includes(':');
  
  const maxValue = Math.max(...data.map(d => d.newCustomers + d.returningCustomers), 1);

  return (
    <div className="h-64">
      <div className="flex items-end gap-1 h-52">
        {data.map((day, i) => {
          const newHeight = (day.newCustomers / maxValue) * 100;
          const returningHeight = (day.returningCustomers / maxValue) * 100;
          
          // Format label based on whether it's by hour or by day
          let label = '';
          if (isByHour) {
            const hourMatch = day.date.match(/\s(\d{2}):/);
            const hour = hourMatch ? parseInt(hourMatch[1]) : 0;
            label = `${hour}:00`;
          } else {
            label = new Date(day.date).toLocaleDateString('he-IL');
          }
          
          return (
            <div 
              key={i} 
              className="flex-1 flex flex-col items-center group relative"
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                <div className="bg-black text-white text-xs px-3 py-2 rounded shadow-lg whitespace-nowrap">
                  <div className="font-medium">{label}</div>
                  <div className="text-blue-300">{day.newCustomers} חדשים</div>
                  <div className="text-green-300">{day.returningCustomers} חוזרים</div>
                </div>
              </div>
              
              <div className="w-full flex flex-col-reverse h-full justify-start">
                <div 
                  className="w-full bg-blue-500 hover:bg-blue-600 transition-colors"
                  style={{ height: `${Math.max(newHeight, 2)}%` }}
                />
                <div 
                  className="w-full bg-green-500 hover:bg-green-600 transition-colors"
                  style={{ height: `${Math.max(returningHeight, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* X-axis labels */}
      <div className="h-12 flex gap-1 mt-1">
        {data.map((day, i) => {
          const showLabel = isByHour
            ? i % 3 === 0 // Show every 3 hours
            : data.length <= 14 || i % Math.ceil(data.length / 10) === 0;
          
          let label = '';
          if (isByHour) {
            const hourMatch = day.date.match(/\s(\d{2}):/);
            const hour = hourMatch ? parseInt(hourMatch[1]) : 0;
            label = `${hour}:00`;
          } else {
            label = new Date(day.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
          }
          
          return (
            <div key={i} className="flex-1 text-center">
              {showLabel && (
                <span className="text-[9px] text-gray-400">
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500" />
          <span className="text-sm text-gray-600">חדשים</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500" />
          <span className="text-sm text-gray-600">חוזרים</span>
        </div>
      </div>
    </div>
  );
}

// Content Component
async function CustomersContent({ 
  storeId, 
  period,
  customRange 
}: { 
  storeId: string; 
  period: '7d' | '30d' | '90d' | 'custom';
  customRange?: { from: Date; to: Date };
}) {
  // Parallel data fetching
  const [segments, topCustomers, newVsReturning, overview] = await Promise.all([
    getCustomerSegments(storeId),
    getTopCustomers(storeId, 20),
    getNewVsReturning(storeId, period, customRange),
    getSalesOverview(storeId, period, customRange),
  ]);

  return (
    <>
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500">סה״כ לקוחות</p>
          <p className="text-2xl font-medium mt-1">{formatNumber(overview.totalCustomers)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500">לקוחות חדשים</p>
          <p className="text-2xl font-medium mt-1">{formatNumber(overview.newCustomers)}</p>
          <p className="text-xs text-gray-400 mt-1">בתקופה הנבחרת</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500">לקוחות חוזרים</p>
          <p className="text-2xl font-medium mt-1">{formatNumber(overview.returningCustomers)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500">ממוצע להזמנה</p>
          <p className="text-2xl font-medium mt-1">{formatCurrency(overview.averageOrderValue)}</p>
        </div>
      </div>

      {/* Segments */}
      <div className="mb-8">
        <h2 className="font-medium mb-4">פילוח לקוחות</h2>
        <CustomerSegments segments={segments} />
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* New vs Returning */}
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="font-medium mb-4">חדשים מול חוזרים</h2>
          <NewVsReturningChart data={newVsReturning} />
        </div>

        {/* Segment Descriptions */}
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="font-medium mb-4">הגדרות פילוח</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100">
              <StarIcon className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium">לקוחות VIP</p>
                <p className="text-sm text-gray-600">לקוחות שרכשו מעל ₪3,000</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-100">
              <RefreshCwIcon className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium">לקוחות חוזרים</p>
                <p className="text-sm text-gray-600">לקוחות עם 2+ הזמנות שרכשו פחות מ-₪3,000</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100">
              <SparklesIcon className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium">לקוחות חדשים</p>
                <p className="text-sm text-gray-600">לקוחות שהצטרפו ב-30 הימים האחרונים</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100">
              <AlertTriangleIcon className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium">לקוחות בסיכון</p>
                <p className="text-sm text-gray-600">לקוחות שלא רכשו מעל 90 יום</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white border border-gray-200 p-6 mt-8">
        <h2 className="font-medium mb-4">לקוחות מובילים</h2>
        <TopCustomersTable customers={topCustomers} />
      </div>
    </>
  );
}

// Page Component
export default async function CustomersReportPage({
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
        title="דוח לקוחות"
        description="פילוח לקוחות, VIP ולקוחות בסיכון"
        storeSlug={slug}
        backHref={`/shops/${slug}/admin/reports`}
      />

      <Suspense fallback={<TableSkeleton />}>
        <CustomersContent storeId={store.id} period={period} customRange={customRange} />
      </Suspense>
    </div>
  );
}

