import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentInfluencer } from '@/lib/influencer-auth';
import { db } from '@/lib/db';
import { influencerSales, orders, discounts, automaticDiscounts, refunds } from '@/lib/db/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { DateRangePicker } from '@/components/admin/date-range-picker';

interface DashboardPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}

// Helper to format currency
function formatCurrency(amount: string | number | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(num);
}

// Helper to format date
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', { 
    day: '2-digit', 
    month: '2-digit', 
    year: '2-digit' 
  }).format(date);
}

// Format discount description for display
function formatDiscountDescription(discount: {
  type: string;
  value: string | null;
  buyQuantity?: number | null;
  getQuantity?: number | null;
  getDiscountPercent?: number | null;
}): string {
  switch (discount.type) {
    case 'percentage':
      return `${discount.value}% הנחה`;
    case 'fixed_amount':
      return `${formatCurrency(discount.value)} הנחה`;
    case 'free_shipping':
      return 'משלוח חינם';
    case 'buy_x_get_y':
      const buy = discount.buyQuantity || 1;
      const get = discount.getQuantity || 1;
      const discountPercent = discount.getDiscountPercent ?? 100;
      if (discountPercent === 100) {
        return `${buy}+${get} (קנה ${buy} קבל ${get} חינם)`;
      }
      return `${buy}+${get} (${discountPercent}% הנחה על ה-${get})`;
    case 'buy_x_pay_y':
      return 'קנה X שלם Y';
    case 'gift_product':
      return 'מוצר במתנה';
    case 'quantity_discount':
      return 'הנחות כמות';
    case 'spend_x_pay_y':
      return 'קנה ב-X שלם Y';
    default:
      return `${discount.value || ''} הנחה`;
  }
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };
  const labels: Record<string, string> = {
    pending: 'ממתין',
    confirmed: 'אושר',
    processing: 'בטיפול',
    shipped: 'נשלח',
    delivered: 'נמסר',
    cancelled: 'בוטל',
    refunded: 'הוחזר',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

// Helper to parse date range from URL params
// ⚠️ Default must match DateRangePicker default (30d = החודש)
function getDateRange(period?: string, from?: string, to?: string): { start: Date; end: Date; label: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (period === 'custom' && from && to) {
    return {
      start: new Date(from),
      end: new Date(to + 'T23:59:59'),
      label: 'תקופה מותאמת',
    };
  }
  
  switch (period) {
    case 'today':
      return { start: todayStart, end: today, label: 'היום' };
    case 'yesterday':
      const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
      return { start: yesterdayStart, end: yesterdayEnd, label: 'אתמול' };
    case '7d':
      return { start: new Date(Date.now() - 7 * 86400000), end: today, label: 'השבוע' };
    case '90d':
      return { start: new Date(Date.now() - 90 * 86400000), end: today, label: '90 יום' };
    case '6m':
      return { start: new Date(Date.now() - 180 * 86400000), end: today, label: 'חצי שנה' };
    case '1y':
      return { start: new Date(Date.now() - 365 * 86400000), end: today, label: 'שנה' };
    case '30d':
    default:
      // 🔑 Default to 30d (החודש) - must match DateRangePicker default
      return { start: new Date(Date.now() - 30 * 86400000), end: today, label: 'החודש' };
  }
}

export default async function InfluencerDashboardPage({ params, searchParams }: DashboardPageProps) {
  const { slug } = await params;
  const search = await searchParams;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }
  
  const basePath = `/shops/${slug}`;
  
  // Check authentication
  const influencer = await getCurrentInfluencer();
  if (!influencer || influencer.storeId !== store.id) {
    redirect(`${basePath}/influencer/login`);
  }

  // Parse date range from URL params - default to '30d' (current month)
  const { start: dateStart, end: dateEnd, label: periodLabel } = getDateRange(
    search.period,
    search.from,
    search.to
  );

  // Run all queries in parallel for maximum speed
  const [sales, periodStats, periodRefunds, linkedCouponResult, linkedAutoDiscountResult] = await Promise.all([
    // Fetch influencer's sales with order details (filtered by date range)
    db
      .select({
        id: influencerSales.id,
        orderTotal: influencerSales.orderTotal,
        commissionAmount: influencerSales.commissionAmount,
        netCommission: influencerSales.netCommission,
        status: influencerSales.status,
        createdAt: influencerSales.createdAt,
        orderNumber: orders.orderNumber,
        orderStatus: orders.status,
      })
      .from(influencerSales)
      .innerJoin(orders, eq(orders.id, influencerSales.orderId))
      .where(
        and(
          eq(influencerSales.influencerId, influencer.id),
          gte(influencerSales.createdAt, dateStart),
          lte(influencerSales.createdAt, dateEnd)
        )
      )
      .orderBy(desc(influencerSales.createdAt))
      .limit(10),
    
    // Calculate stats for selected period
    db
      .select({
        totalSales: sql<string>`COALESCE(SUM(${influencerSales.orderTotal}::numeric), 0)`,
        totalCommission: sql<string>`COALESCE(SUM(${influencerSales.netCommission}::numeric), 0)`,
        totalOrders: sql<number>`COUNT(*)`,
      })
      .from(influencerSales)
      .where(
        and(
          eq(influencerSales.influencerId, influencer.id),
          gte(influencerSales.createdAt, dateStart),
          lte(influencerSales.createdAt, dateEnd)
        )
      ),
    
    // Get refunds count for selected period
    db
      .select({
        count: sql<number>`COUNT(*)`,
        total: sql<string>`COALESCE(SUM(${refunds.amount}::numeric), 0)`,
      })
      .from(refunds)
      .innerJoin(influencerSales, eq(influencerSales.orderId, refunds.orderId))
      .where(
        and(
          eq(influencerSales.influencerId, influencer.id),
          gte(refunds.createdAt, dateStart),
          lte(refunds.createdAt, dateEnd)
        )
      ),
    
    // Get linked coupon
    influencer.discountId
      ? db.select().from(discounts).where(eq(discounts.id, influencer.discountId)).limit(1)
      : Promise.resolve([]),
    
    // Get linked automatic discount
    influencer.automaticDiscountId
      ? db.select().from(automaticDiscounts).where(eq(automaticDiscounts.id, influencer.automaticDiscountId)).limit(1)
      : Promise.resolve([]),
  ]);

  const linkedCoupon = linkedCouponResult[0] || null;
  const linkedAutoDiscount = linkedAutoDiscountResult[0] || null;
  const stats = periodStats[0] || { totalSales: '0', totalCommission: '0', totalOrders: 0 };
  const refundStats = periodRefunds[0] || { count: 0, total: '0' };

  return (
    <div className="space-y-8">
      {/* Welcome Header with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            שלום, {influencer.name.split(' ')[0]}! 👑
          </h1>
          <p className="text-gray-500 mt-1">
            הנה סיכום הביצועים שלך - {periodLabel}
          </p>
        </div>
        
        {/* Date Range Picker - Server Component friendly */}
        <DateRangePicker />
      </div>

      {/* Stats Grid */}
      <div className={`grid gap-3 sm:gap-4 ${influencer.showCommission ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2'}`}>
        {/* Total Sales - only show if showOrderDetails is true */}
        {influencer.showOrderDetails && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs sm:text-sm text-gray-500">מכירות</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalSales)}
            </p>
          </div>
        )}

        {/* Total Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm text-gray-500">הזמנות</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">
            {stats.totalOrders}
          </p>
        </div>

        {/* Total Commission - only show if showCommission is true */}
        {influencer.showCommission && (
          <div className={`${influencer.showOrderDetails ? 'col-span-2 lg:col-span-1' : ''} bg-white rounded-xl border border-gray-200 p-4 sm:p-6`}>
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-xs sm:text-sm text-gray-500">עמלות</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-purple-600">
              {formatCurrency(stats.totalCommission)}
            </p>
          </div>
        )}
      </div>

      {/* Active Coupon Card */}
      {(linkedCoupon || linkedAutoDiscount || influencer.couponCode) && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs sm:text-sm mb-1">קופון פעיל</p>
              <p className="text-xl sm:text-2xl font-bold tracking-wider">
                {linkedCoupon?.code || influencer.couponCode || linkedAutoDiscount?.name}
              </p>
              <p className="text-purple-100 text-xs sm:text-sm mt-1 sm:mt-2">
                {linkedCoupon && formatDiscountDescription({
                  type: linkedCoupon.type,
                  value: linkedCoupon.value,
                  buyQuantity: linkedCoupon.buyQuantity,
                  getQuantity: linkedCoupon.getQuantity,
                  getDiscountPercent: linkedCoupon.getDiscountPercent,
                })}
                {linkedAutoDiscount && formatDiscountDescription({
                  type: linkedAutoDiscount.type,
                  value: linkedAutoDiscount.value,
                  buyQuantity: linkedAutoDiscount.buyQuantity,
                  getQuantity: linkedAutoDiscount.getQuantity,
                  getDiscountPercent: linkedAutoDiscount.getDiscountPercent,
                })}
              </p>
            </div>
            <div className="text-4xl sm:text-5xl opacity-20 hidden sm:block">🎟️</div>
          </div>
        </div>
      )}

      {/* Refunds Notice */}
      {Number(refundStats.count) > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-orange-800 text-sm sm:text-base">
              {refundStats.count} החזרים בתקופה
            </p>
            <p className="text-xs sm:text-sm text-orange-600">
              סה"כ {formatCurrency(refundStats.total)}
            </p>
          </div>
          <Link 
            href={`${basePath}/influencer/refunds`}
            className="text-xs sm:text-sm text-orange-700 hover:text-orange-900 font-medium whitespace-nowrap"
          >
            צפה בפרטים ←
          </Link>
        </div>
      )}

      {/* Recent Sales Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base">הזמנות אחרונות</h2>
          <Link 
            href={`${basePath}/influencer/sales`}
            className="text-xs sm:text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            הצג הכל ←
          </Link>
        </div>
        
        {sales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-3 sm:px-5 py-3 text-right font-medium">הזמנה</th>
                  <th className="px-3 sm:px-5 py-3 text-right font-medium">תאריך</th>
                  {influencer.showOrderDetails && (
                    <th className="px-3 sm:px-5 py-3 text-right font-medium">סכום</th>
                  )}
                  {influencer.showCommission && (
                    <th className="px-3 sm:px-5 py-3 text-right font-medium">עמלה</th>
                  )}
                  <th className="px-3 sm:px-5 py-3 text-right font-medium">סטטוס</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-5 py-3 sm:py-4 font-medium text-gray-900 text-sm">
                      #{sale.orderNumber}
                    </td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-gray-500 text-xs sm:text-sm whitespace-nowrap">
                      {formatDate(sale.createdAt)}
                    </td>
                    {influencer.showOrderDetails && (
                      <td className="px-3 sm:px-5 py-3 sm:py-4 font-medium text-sm whitespace-nowrap">
                        {formatCurrency(sale.orderTotal)}
                      </td>
                    )}
                    {influencer.showCommission && (
                      <td className="px-3 sm:px-5 py-3 sm:py-4 text-purple-600 font-medium text-sm whitespace-nowrap">
                        {formatCurrency(sale.netCommission)}
                      </td>
                    )}
                    <td className="px-3 sm:px-5 py-3 sm:py-4">
                      <StatusBadge status={sale.orderStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-1">אין הזמנות עדיין</p>
            <p className="text-sm text-gray-400">שתפי את הקופון שלך ותתחילי להרוויח!</p>
          </div>
        )}
      </div>

      {/* All-time Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">סטטיסטיקות כלליות</h3>
        <div className={`grid gap-3 sm:gap-6 ${influencer.showOrderDetails && influencer.showCommission ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {influencer.showOrderDetails && (
            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">סה"כ מכירות</p>
              <p className="text-base sm:text-xl font-bold text-gray-900">
                {formatCurrency(influencer.totalSales)}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs sm:text-sm text-gray-500 mb-1">סה"כ הזמנות</p>
            <p className="text-base sm:text-xl font-bold text-gray-900">
              {influencer.totalOrders}
            </p>
          </div>
          {influencer.showCommission && (
            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">סה"כ עמלות</p>
              <p className="text-base sm:text-xl font-bold text-purple-600">
                {formatCurrency(influencer.totalCommission)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

