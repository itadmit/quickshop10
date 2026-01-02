import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getStoreBySlug } from '@/lib/db/queries';
import { 
  getTrafficSources,
  getDeviceStats,
  getLandingPages,
  getConversionFunnel
} from '@/lib/actions/reports';
import {
  SmartphoneIcon,
  MonitorIcon,
  TabletIcon,
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

// Traffic Sources Table
function TrafficSourcesTable({ 
  sources 
}: { 
  sources: Array<{ source: string; sessions: number; orders: number; revenue: number; conversionRate: number }> 
}) {
  if (!sources.length) {
    return <p className="text-gray-500 text-center py-12">אין נתוני תנועה לתקופה זו</p>;
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

  const totalSessions = sources.reduce((sum, s) => sum + s.sessions, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-right">
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">מקור</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">ביקורים</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">% מסה״כ</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">הזמנות</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">הכנסות</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">שיעור המרה</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sources.map((source) => (
            <tr key={source.source} className="hover:bg-gray-50">
              <td className="py-3 px-4 font-medium">
                {sourceLabels[source.source] || source.source}
              </td>
              <td className="py-3 px-4">{formatNumber(source.sessions)}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 max-w-20">
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: `${totalSessions > 0 ? (source.sessions / totalSessions) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500">
                    {totalSessions > 0 ? ((source.sessions / totalSessions) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">{formatNumber(source.orders)}</td>
              <td className="py-3 px-4 font-medium">{formatCurrency(source.revenue)}</td>
              <td className="py-3 px-4">
                <span className={`${source.conversionRate >= 3 ? 'text-green-600' : source.conversionRate >= 1 ? 'text-amber-600' : 'text-gray-500'}`}>
                  {formatPercent(source.conversionRate)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Device Stats Component
function DeviceStats({ 
  devices 
}: { 
  devices: Array<{ deviceType: string; sessions: number; pageViews: number }> 
}) {
  if (!devices.length) {
    return <p className="text-gray-500 text-center py-12">אין נתוני מכשירים</p>;
  }

  const deviceLabels: Record<string, string> = {
    mobile: 'מובייל',
    desktop: 'דסקטופ',
    tablet: 'טאבלט',
    unknown: 'אחר',
  };

  const deviceIcons: Record<string, React.ReactNode> = {
    mobile: <SmartphoneIcon size={24} className="text-gray-600" />,
    desktop: <MonitorIcon size={24} className="text-gray-600" />,
    tablet: <TabletIcon size={24} className="text-gray-600" />,
    unknown: <MonitorIcon size={24} className="text-gray-400" />,
  };

  const totalSessions = devices.reduce((sum, d) => sum + d.sessions, 0);

  return (
    <div className="space-y-4">
      {devices.map((device) => {
        const percentage = totalSessions > 0 ? (device.sessions / totalSessions) * 100 : 0;
        return (
          <div key={device.deviceType} className="flex items-center gap-4">
            <span className="w-8 flex justify-center">{deviceIcons[device.deviceType] || deviceIcons.unknown}</span>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{deviceLabels[device.deviceType] || device.deviceType}</span>
                <span className="text-gray-500">{formatNumber(device.sessions)} ({formatPercent(percentage)})</span>
              </div>
              <div className="h-3 bg-gray-100">
                <div 
                  className="h-full bg-black transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Landing Pages Table
function LandingPagesTable({ 
  pages 
}: { 
  pages: Array<{ page: string; sessions: number }> 
}) {
  if (!pages.length) {
    return <p className="text-gray-500 text-center py-12">אין נתוני דפי נחיתה</p>;
  }

  const totalSessions = pages.reduce((sum, p) => sum + p.sessions, 0);

  const pageLabels: Record<string, string> = {
    '/': 'דף הבית',
    '/category/women': 'קטגוריה: נשים',
    '/category/men': 'קטגוריה: גברים',
    '/category/accessories': 'קטגוריה: אקססוריז',
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-right">
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">דף נחיתה</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">ביקורים</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">% מסה״כ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {pages.map((page) => {
            // Extract path from full URL if needed
            const path = page.page?.includes('http') 
              ? new URL(page.page).pathname 
              : page.page;
            
            return (
              <tr key={page.page} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <span className="font-medium">{pageLabels[path] || path}</span>
                  <span className="text-gray-400 text-sm mr-2">{path}</span>
                </td>
                <td className="py-3 px-4">{formatNumber(page.sessions)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 max-w-20">
                      <div 
                        className="h-full bg-green-500"
                        style={{ width: `${totalSessions > 0 ? (page.sessions / totalSessions) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500">
                      {totalSessions > 0 ? ((page.sessions / totalSessions) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Funnel Component
function ConversionFunnel({ 
  data 
}: { 
  data: Array<{ step: string; count: number; rate: number }> 
}) {
  if (!data.length || data[0].count === 0) {
    return <p className="text-gray-500 text-center py-8">אין נתוני המרה לתקופה זו</p>;
  }

  const maxCount = data[0].count;
  const colors = ['bg-blue-500', 'bg-blue-400', 'bg-blue-300', 'bg-green-400', 'bg-green-500'];

  return (
    <div className="space-y-3">
      {data.map((step, i) => (
        <div key={step.step}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{step.step}</span>
            <span className="text-gray-500">
              {formatNumber(step.count)} ({formatPercent(step.rate)})
            </span>
          </div>
          <div className="h-8 bg-gray-100 overflow-hidden flex items-center">
            <div 
              className={`h-full ${colors[i] || 'bg-gray-400'} transition-all duration-500 flex items-center justify-end px-2`}
              style={{ width: `${(step.count / maxCount) * 100}%` }}
            >
              {step.count / maxCount > 0.15 && (
                <span className="text-white text-xs font-medium">
                  {formatNumber(step.count)}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Content Component
async function TrafficContent({ storeId, period }: { storeId: string; period: '7d' | '30d' | '90d' }) {
  // Parallel data fetching
  const [sources, devices, landingPages, funnel] = await Promise.all([
    getTrafficSources(storeId, period),
    getDeviceStats(storeId, period),
    getLandingPages(storeId, period, 10),
    getConversionFunnel(storeId, period),
  ]);

  // Calculate totals
  const totalSessions = sources.reduce((sum, s) => sum + s.sessions, 0);
  const totalOrders = sources.reduce((sum, s) => sum + s.orders, 0);
  const totalRevenue = sources.reduce((sum, s) => sum + s.revenue, 0);

  return (
    <>
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500">סה״כ ביקורים</p>
          <p className="text-2xl font-medium mt-1">{formatNumber(totalSessions)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500">הזמנות</p>
          <p className="text-2xl font-medium mt-1">{formatNumber(totalOrders)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500">שיעור המרה כולל</p>
          <p className="text-2xl font-medium mt-1">
            {formatPercent(totalSessions > 0 ? (totalOrders / totalSessions) * 100 : 0)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500">הכנסות מתנועה</p>
          <p className="text-2xl font-medium mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Traffic Sources */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="font-medium mb-4">מקורות תנועה</h2>
        <TrafficSourcesTable sources={sources} />
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Devices */}
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="font-medium mb-4">מכשירים</h2>
          <DeviceStats devices={devices} />
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="font-medium mb-4">משפך המרה</h2>
          <ConversionFunnel data={funnel} />
        </div>
      </div>

      {/* Landing Pages */}
      <div className="bg-white border border-gray-200 p-6 mt-8">
        <h2 className="font-medium mb-4">דפי נחיתה מובילים</h2>
        <LandingPagesTable pages={landingPages} />
      </div>
    </>
  );
}

// Page Component
export default async function TrafficReportPage({
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

  const period = (['7d', '30d', '90d'].includes(periodParam || '') 
    ? periodParam 
    : '30d') as '7d' | '30d' | '90d';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/shops/${slug}/admin/reports`}
            className="text-gray-400 hover:text-black"
          >
            ← חזרה
          </Link>
          <div>
            <h1 className="text-2xl font-medium">דוח תנועה</h1>
            <p className="text-gray-500 text-sm mt-1">מקורות תנועה, UTM, מכשירים ודפי נחיתה</p>
          </div>
        </div>
        
        {/* Period Selector */}
        <div className="flex gap-1 bg-gray-100 p-1">
          {[
            { value: '7d', label: '7 ימים' },
            { value: '30d', label: '30 יום' },
            { value: '90d', label: '90 יום' },
          ].map((option) => (
            <Link
              key={option.value}
              href={`?period=${option.value}`}
              className={`px-4 py-2 text-sm transition-colors ${
                period === option.value
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <Suspense fallback={<TableSkeleton />}>
        <TrafficContent storeId={store.id} period={period} />
      </Suspense>
    </div>
  );
}

