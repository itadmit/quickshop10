import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentInfluencer } from '@/lib/influencer-auth';
import { db } from '@/lib/db';
import { influencerSales, orders, discounts, automaticDiscounts, refunds } from '@/lib/db/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

interface DashboardPageProps {
  params: Promise<{ slug: string }>;
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

export default async function InfluencerDashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params;
  
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

  // Get current month start
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch influencer's sales with order details
  const sales = await db
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
    .where(eq(influencerSales.influencerId, influencer.id))
    .orderBy(desc(influencerSales.createdAt))
    .limit(10);

  // Calculate monthly stats
  const monthlyStats = await db
    .select({
      totalSales: sql<string>`COALESCE(SUM(${influencerSales.orderTotal}::numeric), 0)`,
      totalCommission: sql<string>`COALESCE(SUM(${influencerSales.netCommission}::numeric), 0)`,
      totalOrders: sql<number>`COUNT(*)`,
    })
    .from(influencerSales)
    .where(
      and(
        eq(influencerSales.influencerId, influencer.id),
        gte(influencerSales.createdAt, monthStart)
      )
    );

  // Get refunds count for this month
  const monthlyRefunds = await db
    .select({
      count: sql<number>`COUNT(*)`,
      total: sql<string>`COALESCE(SUM(${refunds.amount}::numeric), 0)`,
    })
    .from(refunds)
    .innerJoin(influencerSales, eq(influencerSales.orderId, refunds.orderId))
    .where(
      and(
        eq(influencerSales.influencerId, influencer.id),
        gte(refunds.createdAt, monthStart)
      )
    );

  // Get linked coupon
  let linkedCoupon = null;
  if (influencer.discountId) {
    const [coupon] = await db
      .select()
      .from(discounts)
      .where(eq(discounts.id, influencer.discountId))
      .limit(1);
    linkedCoupon = coupon;
  }

  // Get linked automatic discount
  let linkedAutoDiscount = null;
  if (influencer.automaticDiscountId) {
    const [autoDiscount] = await db
      .select()
      .from(automaticDiscounts)
      .where(eq(automaticDiscounts.id, influencer.automaticDiscountId))
      .limit(1);
    linkedAutoDiscount = autoDiscount;
  }

  const stats = monthlyStats[0] || { totalSales: '0', totalCommission: '0', totalOrders: 0 };
  const refundStats = monthlyRefunds[0] || { count: 0, total: '0' };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          שלום, {influencer.name.split(' ')[0]}! 👑
        </h1>
        <p className="text-gray-500 mt-1">
          הנה סיכום הביצועים שלך החודש
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Sales */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm text-gray-500">מכירות החודש</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">
            {formatCurrency(stats.totalSales)}
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm text-gray-500">הזמנות החודש</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">
            {stats.totalOrders}
          </p>
        </div>

        {/* Total Commission */}
        <div className="col-span-2 lg:col-span-1 bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm text-gray-500">עמלות החודש</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-purple-600">
            {formatCurrency(stats.totalCommission)}
          </p>
        </div>
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
                {linkedCoupon && `${linkedCoupon.value}${linkedCoupon.type === 'percentage' ? '%' : '₪'} הנחה`}
                {linkedAutoDiscount && `${linkedAutoDiscount.value}${linkedAutoDiscount.type === 'percentage' ? '%' : '₪'} הנחה אוטומטית`}
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
              {refundStats.count} החזרים החודש
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
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-3 sm:px-5 py-3 text-right font-medium">הזמנה</th>
                  <th className="px-3 sm:px-5 py-3 text-right font-medium">תאריך</th>
                  <th className="px-3 sm:px-5 py-3 text-right font-medium">סכום</th>
                  <th className="px-3 sm:px-5 py-3 text-right font-medium">עמלה</th>
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
                    <td className="px-3 sm:px-5 py-3 sm:py-4 font-medium text-sm whitespace-nowrap">
                      {formatCurrency(sale.orderTotal)}
                    </td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-purple-600 font-medium text-sm whitespace-nowrap">
                      {formatCurrency(sale.netCommission)}
                    </td>
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
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          <div>
            <p className="text-xs sm:text-sm text-gray-500 mb-1">סה"כ מכירות</p>
            <p className="text-base sm:text-xl font-bold text-gray-900">
              {formatCurrency(influencer.totalSales)}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-500 mb-1">סה"כ הזמנות</p>
            <p className="text-base sm:text-xl font-bold text-gray-900">
              {influencer.totalOrders}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-500 mb-1">סה"כ עמלות</p>
            <p className="text-base sm:text-xl font-bold text-purple-600">
              {formatCurrency(influencer.totalCommission)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

