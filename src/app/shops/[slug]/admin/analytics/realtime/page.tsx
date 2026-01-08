/**
 * Realtime Analytics Dashboard
 * 
 * SPEED PRINCIPLES (REQUIREMENTS.md):
 * - Server Component - HTML rendered on server, no hydration
 * - All data from Redis - sub-millisecond reads
 * - Minimal client code - only refresh timer
 */

import { unstable_noStore as noStore } from 'next/cache';
import { db } from '@/lib/db';
import { orders, stores } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { RealtimeRefresh } from './realtime-client';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Lazy load Redis stats
async function getRedisStats() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  try {
    return await import('@/lib/upstash/page-stats');
  } catch {
    return null;
  }
}

async function getRealtimeData(storeId: string) {
  noStore();

  const redisStats = await getRedisStats();

  const [
    onlineUsersCount,
    todayPageViews,
    topPages,
    trafficSources,
    deviceBreakdown,
    hourlyTraffic,
    funnelData,
    recentOrders,
  ] = await Promise.all([
    redisStats?.getOnlineUsersCount(storeId) ?? 0,
    redisStats?.getTodayPageViews(storeId) ?? 0,
    redisStats?.getTopPages(storeId, undefined, 5) ?? [],
    redisStats?.getTrafficSources(storeId, undefined, 5) ?? [],
    redisStats?.getDeviceBreakdown(storeId) ?? { desktop: 0, mobile: 0, tablet: 0 },
    redisStats?.getHourlyTraffic(storeId) ?? [],
    redisStats?.getTodayFunnel(storeId) ?? {
      productViews: 0,
      addToCart: 0,
      beginCheckout: 0,
      purchases: 0,
      revenue: 0,
      orders: 0,
    },
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        total: orders.total,
        status: orders.status,
        createdAt: orders.createdAt,
        customerName: orders.customerName,
      })
      .from(orders)
      .where(eq(orders.storeId, storeId))
      .orderBy(desc(orders.createdAt))
      .limit(10),
  ]);

  return {
    live: {
      onlineUsers: onlineUsersCount,
      todayPageViews,
      topPages,
      trafficSources,
      devices: deviceBreakdown,
      hourlyTraffic,
    },
    sales: {
      todayRevenue: funnelData.revenue,
      todayOrders: funnelData.orders,
    },
    funnel: {
      productViews: funnelData.productViews,
      addToCart: funnelData.addToCart,
      checkoutStarted: funnelData.beginCheckout,
      purchases: funnelData.purchases,
    },
    recentOrders: recentOrders.map((o) => ({
      ...o,
      total: parseFloat(String(o.total)),
    })),
    redisEnabled: !!redisStats,
  };
}

async function getStore(slug: string) {
  const [store] = await db
    .select({ id: stores.id, name: stores.name })
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);
  return store;
}

export default async function RealtimeAnalyticsPage({ params }: PageProps) {
  const { slug } = await params;
  const store = await getStore(slug);

  if (!store) {
    return <div className="p-8 text-center text-gray-500">חנות לא נמצאה</div>;
  }

  const data = await getRealtimeData(store.id);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col md:flex-row overflow-hidden" dir="rtl">
      
      {/* Right Panel - Live Metrics */}
      <div className="w-full md:w-[400px] bg-white border-l border-gray-200 z-10 flex flex-col h-[calc(100vh-64px)] overflow-y-auto shadow-xl">
        
        {/* Panel Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-gray-900">פעילות חיה</h2>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
          <p className="text-sm text-gray-500">מתעדכן בזמן אמת</p>
        </div>

        <div className="p-6 space-y-8 flex-1">
          
          {/* Main Metric: Online Users */}
          <div className="text-center py-4 bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100">
            <div className="text-sm text-indigo-600 font-medium mb-2 flex items-center justify-center gap-2">
              <UsersIcon />
              מבקרים באתר כרגע
            </div>
            <div className="text-6xl font-extrabold text-indigo-900 tracking-tight">
              {data.live.onlineUsers}
            </div>
          </div>

          {/* Funnel */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">התנהגות גולשים</h3>
            <div className="space-y-3">
              <FunnelStep
                icon={<EyeIcon />}
                label="צפיות במוצרים"
                value={data.funnel.productViews}
                color="blue"
              />
              <FunnelStep
                icon={<CartIcon />}
                label="הוספה לעגלה"
                value={data.funnel.addToCart}
                color="purple"
                percentage={data.funnel.productViews > 0 
                  ? Math.round((data.funnel.addToCart / data.funnel.productViews) * 100)
                  : 0
                }
              />
              <FunnelStep
                icon={<CreditCardIcon />}
                label="התחלת צ׳קאאוט"
                value={data.funnel.checkoutStarted}
                color="orange"
                percentage={data.funnel.addToCart > 0
                  ? Math.round((data.funnel.checkoutStarted / data.funnel.addToCart) * 100)
                  : 0
                }
              />
              <FunnelStep
                icon={<CheckIcon />}
                label="רכישות"
                value={data.funnel.purchases}
                color="green"
                percentage={data.funnel.checkoutStarted > 0
                  ? Math.round((data.funnel.purchases / data.funnel.checkoutStarted) * 100)
                  : 0
                }
              />
            </div>
          </div>

          {/* Sales - Dark Card */}
          <div className="bg-gray-900 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-gray-400 text-xs mb-1">סה״כ מכירות היום</p>
                <h3 className="text-2xl font-bold">₪{data.sales.todayRevenue.toFixed(2)}</h3>
              </div>
              <div className="text-left">
                <p className="text-gray-400 text-xs mb-1">הזמנות</p>
                <h3 className="text-xl font-bold">{data.sales.todayOrders}</h3>
              </div>
            </div>
            {/* Mini Chart */}
            <div className="h-16 flex items-end gap-1">
              {(data.live.hourlyTraffic.length > 0 ? data.live.hourlyTraffic.slice(-12) : Array(12).fill({ views: 0 })).map((h, i) => {
                const maxViews = Math.max(...data.live.hourlyTraffic.map(x => x.views), 1);
                const height = Math.max(8, (h.views / maxViews) * 100);
                return (
                  <div
                    key={i}
                    className="flex-1 bg-green-500 rounded-sm transition-all"
                    style={{ height: `${height}%`, opacity: 0.4 + (i * 0.05) }}
                  />
                );
              })}
            </div>
          </div>

          {/* Devices */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">התקנים</h3>
            <div className="grid grid-cols-3 gap-4">
              <DeviceCard icon={<DesktopIcon />} label="מחשב" value={data.live.devices.desktop} />
              <DeviceCard icon={<MobileIcon />} label="נייד" value={data.live.devices.mobile} />
              <DeviceCard icon={<TabletIcon />} label="טאבלט" value={data.live.devices.tablet} />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-auto bg-gray-100 border-t border-gray-200 p-4 flex items-center justify-between">
          <RealtimeRefresh refreshInterval={30} />
          <Link
            href={`/shops/${slug}/admin/reports`}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            חזרה לדוחות
          </Link>
        </div>
      </div>

      {/* Left Area - Orders & Sources */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">אנליטיקה בזמן אמת</h1>
            <p className="text-gray-500 text-sm mt-1">נתונים חיים מהחנות שלך</p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">צפיות בדפים היום</div>
              <div className="text-3xl font-bold text-gray-900">{data.live.todayPageViews.toLocaleString('he-IL')}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">הזמנות היום</div>
              <div className="text-3xl font-bold text-gray-900">{data.sales.todayOrders}</div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">הזמנות אחרונות</h3>
            {data.recentOrders.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {data.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium text-gray-900">#{order.orderNumber}</div>
                      <div className="text-xs text-gray-500">{order.customerName || 'לקוח אורח'}</div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-900">₪{order.total.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">
                        {order.createdAt && new Date(order.createdAt).toLocaleTimeString('he-IL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">אין הזמנות עדיין</div>
            )}
          </div>

          {/* Two Column Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Traffic Sources */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">מקורות תנועה</h3>
              {data.live.trafficSources.length > 0 ? (
                <div className="space-y-3">
                  {data.live.trafficSources.map((source, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-xs font-bold text-gray-400">#{i + 1}</span>
                        <span className="text-gray-700 text-sm">{source.source}</span>
                      </div>
                      <span className="font-medium text-gray-900 text-sm">{source.visits}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm">אין נתוני מקורות</div>
              )}
            </div>

            {/* Top Pages */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">דפים פופולריים</h3>
              {data.live.topPages.length > 0 ? (
                <div className="space-y-3">
                  {data.live.topPages.map((page, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="w-5 text-xs font-bold text-gray-400">#{i + 1}</span>
                        <span className="text-gray-700 text-sm truncate">{page.page === '/' ? 'דף הבית' : page.page}</span>
                      </div>
                      <span className="font-medium text-gray-900 text-sm mr-2">{page.views}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm">אין נתוני דפים</div>
              )}
            </div>
          </div>

          {/* Redis Status */}
          {!data.redisEnabled && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-amber-800 text-sm">Redis לא מוגדר</div>
                  <div className="text-xs text-amber-600">הוסף UPSTASH_REDIS_REST_URL ו-UPSTASH_REDIS_REST_TOKEN לנתונים בזמן אמת</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ============ Icons ============

function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function DesktopIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function MobileIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function TabletIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

// ============ Components ============

function FunnelStep({
  icon,
  label,
  value,
  color,
  percentage,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'purple' | 'orange' | 'green';
  percentage?: number;
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
  };

  return (
    <div className="group flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${colors[color]} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {percentage !== undefined && percentage > 0 && (
          <span className="text-xs text-gray-400">({percentage}%)</span>
        )}
        <span className="font-bold text-gray-900">{value}</span>
      </div>
    </div>
  );
}

function DeviceCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded-xl">
      <div className="text-gray-400 flex justify-center mb-2">{icon}</div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
