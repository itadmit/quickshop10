import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/lib/db/queries';
import { 
  getTrafficSources,
  getDeviceStats,
  getLandingPages,
  getConversionFunnel,
  getUtmStats
} from '@/lib/actions/reports';
import { ReportHeader, getReportPeriodParams } from '@/components/admin/report-header';
import {
  SmartphoneIcon,
  MonitorIcon,
  TabletIcon,
} from '@/components/admin/icons';

// Redis traffic sources (realtime data)
async function getRedisTrafficSources(storeId: string, from: Date, to: Date) {
  try {
    const pageStats = await import('@/lib/upstash/page-stats');
    return await pageStats.getTrafficSourcesForRange(storeId, from, to, 50);
  } catch {
    return null;
  }
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

// Source name labels
const sourceLabels: Record<string, string> = {
  google: 'Google',
  facebook: 'Facebook',
  fb: 'Facebook',
  instagram: 'Instagram',
  ig: 'Instagram',
  tiktok: 'TikTok',
  email: 'אימייל',
  direct: 'ישיר',
  referral: 'הפניות',
  pos: 'קופה (POS)',
  manual: 'ידני',
  newsletter: 'ניוזלטר',
  sms: 'SMS',
};

// Sources that don't have website visits (manual entry)
const offlineSourcesSet = new Set(['pos', 'manual']);

// Combined Traffic Sources Table - unified data from Redis + Orders
function UnifiedTrafficSourcesTable({ 
  sources 
}: { 
  sources: Array<{ 
    source: string; 
    visits: number; 
    orders: number; 
    revenue: number; 
    conversionRate: number;
    isOffline: boolean;
  }> 
}) {
  if (!sources.length) {
    return <p className="text-gray-500 text-center py-12">אין נתוני תנועה לתקופה זו</p>;
  }

  const totalVisits = sources.filter(s => !s.isOffline).reduce((sum, s) => sum + s.visits, 0);
  const totalOrders = sources.reduce((sum, s) => sum + s.orders, 0);
  const totalRevenue = sources.reduce((sum, s) => sum + s.revenue, 0);

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
                <div className="flex items-center gap-2">
                  {sourceLabels[source.source] || source.source}
                  {source.isOffline && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                      לא באתר
                    </span>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                {source.isOffline ? (
                  <span className="text-gray-400">—</span>
                ) : (
                  formatNumber(source.visits)
                )}
              </td>
              <td className="py-3 px-4">
                {source.isOffline ? (
                  <span className="text-gray-400">—</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 max-w-20">
                      <div 
                        className="h-full bg-blue-500"
                        style={{ width: `${totalVisits > 0 ? (source.visits / totalVisits) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500">
                      {totalVisits > 0 ? ((source.visits / totalVisits) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                )}
              </td>
              <td className="py-3 px-4">
                {source.orders > 0 ? (
                  <span className="font-medium">{formatNumber(source.orders)}</span>
                ) : (
                  <span className="text-gray-400">0</span>
                )}
              </td>
              <td className="py-3 px-4 font-medium">
                {source.revenue > 0 ? formatCurrency(source.revenue) : <span className="text-gray-400">₪0</span>}
              </td>
              <td className="py-3 px-4">
                {source.isOffline ? (
                  <span className="text-gray-400">—</span>
                ) : source.conversionRate > 0 ? (
                  <span className={`${source.conversionRate >= 3 ? 'text-green-600' : source.conversionRate >= 1 ? 'text-amber-600' : 'text-gray-500'}`}>
                    {formatPercent(source.conversionRate)}
                  </span>
                ) : (
                  <span className="text-gray-400">0%</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        {/* Totals row */}
        <tfoot>
          <tr className="bg-gray-50 font-medium">
            <td className="py-3 px-4">סה״כ</td>
            <td className="py-3 px-4">{formatNumber(totalVisits)}</td>
            <td className="py-3 px-4">100%</td>
            <td className="py-3 px-4">{formatNumber(totalOrders)}</td>
            <td className="py-3 px-4">{formatCurrency(totalRevenue)}</td>
            <td className="py-3 px-4">
              <span className={`${(totalOrders / totalVisits) * 100 >= 3 ? 'text-green-600' : 'text-gray-600'}`}>
                {totalVisits > 0 ? formatPercent((totalOrders / totalVisits) * 100) : '0%'}
              </span>
            </td>
          </tr>
        </tfoot>
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

// Merge Redis visits with Orders data
function mergeTrafficData(
  redisSources: Array<{ source: string; visits: number }> | null,
  orderSources: Array<{ source: string; sessions: number; orders: number; revenue: number; conversionRate: number }>
) {
  const mergedMap = new Map<string, {
    source: string;
    visits: number;
    orders: number;
    revenue: number;
    conversionRate: number;
    isOffline: boolean;
  }>();

  // First, add all Redis sources (website visits)
  if (redisSources) {
    for (const rs of redisSources) {
      mergedMap.set(rs.source, {
        source: rs.source,
        visits: rs.visits,
        orders: 0,
        revenue: 0,
        conversionRate: 0,
        isOffline: false,
      });
    }
  }

  // Then, merge/add order sources
  for (const os of orderSources) {
    const existing = mergedMap.get(os.source);
    const isOffline = offlineSourcesSet.has(os.source);
    
    if (existing) {
      // Update existing with order data
      existing.orders = os.orders;
      existing.revenue = os.revenue;
      existing.conversionRate = existing.visits > 0 ? (os.orders / existing.visits) * 100 : 0;
    } else {
      // Add new source from orders
      mergedMap.set(os.source, {
        source: os.source,
        visits: isOffline ? 0 : os.sessions, // Use estimated sessions only for online sources
        orders: os.orders,
        revenue: os.revenue,
        conversionRate: isOffline ? 0 : os.conversionRate,
        isOffline,
      });
    }
  }

  // Convert to array and sort by visits (online first), then by orders
  return Array.from(mergedMap.values()).sort((a, b) => {
    // Offline sources go last
    if (a.isOffline !== b.isOffline) return a.isOffline ? 1 : -1;
    // Then sort by visits
    if (b.visits !== a.visits) return b.visits - a.visits;
    // Then by orders
    return b.orders - a.orders;
  });
}

// Content Component
async function TrafficContent({ 
  storeId, 
  period,
  customRange 
}: { 
  storeId: string; 
  period: '7d' | '30d' | '90d' | 'custom';
  customRange?: { from: Date; to: Date };
}) {
  // Calculate date range for Redis
  const getDateRange = () => {
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    let from: Date;
    switch (period) {
      case '7d':
        from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        return customRange || { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to };
    }
    from.setHours(0, 0, 0, 0);
    return { from, to };
  };
  const dateRange = getDateRange();

  // Parallel data fetching (including Redis traffic sources)
  const [orderSources, devices, landingPages, funnel, utmStats, redisSources] = await Promise.all([
    getTrafficSources(storeId, period, customRange),
    getDeviceStats(storeId, period, customRange),
    getLandingPages(storeId, period, 10, customRange),
    getConversionFunnel(storeId, period, customRange),
    getUtmStats(storeId, period, customRange),
    getRedisTrafficSources(storeId, dateRange.from, dateRange.to),
  ]);

  // Merge Redis visits with order conversions
  const unifiedSources = mergeTrafficData(redisSources, orderSources);
  
  // Calculate totals
  const totalVisits = unifiedSources.filter(s => !s.isOffline).reduce((sum, s) => sum + s.visits, 0);
  const totalOrders = unifiedSources.reduce((sum, s) => sum + s.orders, 0);
  const totalRevenue = unifiedSources.reduce((sum, s) => sum + s.revenue, 0);
  const onlineOrders = unifiedSources.filter(s => !s.isOffline).reduce((sum, s) => sum + s.orders, 0);

  return (
    <>
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500">ביקורים באתר</p>
          <p className="text-2xl font-medium mt-1">{formatNumber(totalVisits)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500">סה״כ הזמנות</p>
          <p className="text-2xl font-medium mt-1">{formatNumber(totalOrders)}</p>
          {totalOrders !== onlineOrders && (
            <p className="text-xs text-gray-400 mt-1">{formatNumber(onlineOrders)} מהאתר</p>
          )}
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500">שיעור המרה (אתר)</p>
          <p className="text-2xl font-medium mt-1">
            {formatPercent(totalVisits > 0 ? (onlineOrders / totalVisits) * 100 : 0)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500">סה״כ הכנסות</p>
          <p className="text-2xl font-medium mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Unified Traffic Sources Table */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="font-medium mb-4">מקורות תנועה והמרות</h2>
        <UnifiedTrafficSourcesTable sources={unifiedSources} />
      </div>

      {/* UTM Stats Section */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="font-medium mb-4">פרמטרי UTM</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* UTM Medium */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-3">UTM Medium</h3>
            {utmStats.byMedium.length > 0 ? (
              <div className="space-y-2">
                {utmStats.byMedium.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{item.medium}</span>
                    <span className="font-medium">{formatNumber(item.sessions)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">אין נתונים</p>
            )}
          </div>
          
          {/* UTM Campaign */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-3">UTM Campaign</h3>
            {utmStats.byCampaign.length > 0 ? (
              <div className="space-y-2">
                {utmStats.byCampaign.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 truncate max-w-[150px]" title={item.campaign}>
                      {item.campaign}
                    </span>
                    <span className="font-medium">{formatNumber(item.sessions)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">אין נתונים</p>
            )}
          </div>
          
          {/* UTM Content */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-3">UTM Content</h3>
            {utmStats.byContent.length > 0 ? (
              <div className="space-y-2">
                {utmStats.byContent.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 truncate max-w-[150px]" title={item.content}>
                      {item.content}
                    </span>
                    <span className="font-medium">{formatNumber(item.sessions)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">אין נתונים</p>
            )}
          </div>
        </div>
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
        title="דוח תנועה"
        description="מקורות תנועה, UTM, מכשירים ודפי נחיתה"
        storeSlug={slug}
        backHref={`/shops/${slug}/admin/reports`}
      />

      <Suspense fallback={<TableSkeleton />}>
        <TrafficContent storeId={store.id} period={period} customRange={customRange} />
      </Suspense>
    </div>
  );
}
