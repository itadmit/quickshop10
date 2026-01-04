import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentInfluencer } from '@/lib/influencer-auth';
import { db } from '@/lib/db';
import { influencerSales, influencerPayouts } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { redirect, notFound } from 'next/navigation';

interface CommissionsPageProps {
  params: Promise<{ slug: string }>;
}

function formatCurrency(amount: string | number | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(num);
}

function formatDate(date: Date | null): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('he-IL', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
  }).format(new Date(date));
}

export default async function InfluencerCommissionsPage({ params }: CommissionsPageProps) {
  const { slug } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) notFound();
  
  const basePath = `/shops/${slug}`;
  
  // Check authentication
  const influencer = await getCurrentInfluencer();
  if (!influencer || influencer.storeId !== store.id) {
    redirect(`${basePath}/influencer/login`);
  }

  // If commission viewing is disabled, redirect to main dashboard
  if (!influencer.showCommission) {
    redirect(`${basePath}/influencer`);
  }

  // Get commission breakdown
  const [commissionStats] = await db
    .select({
      totalEarned: sql<string>`COALESCE(SUM(${influencerSales.commissionAmount}::numeric), 0)`,
      totalRefunded: sql<string>`COALESCE(SUM(${influencerSales.refundAmount}::numeric), 0)`,
      netTotal: sql<string>`COALESCE(SUM(${influencerSales.netCommission}::numeric), 0)`,
      pendingCount: sql<number>`COUNT(*) FILTER (WHERE ${influencerSales.status} = 'pending')`,
      paidCount: sql<number>`COUNT(*) FILTER (WHERE ${influencerSales.status} = 'paid')`,
    })
    .from(influencerSales)
    .where(eq(influencerSales.influencerId, influencer.id));

  // Get pending commissions (unpaid)
  const pendingCommissions = await db
    .select({
      totalPending: sql<string>`COALESCE(SUM(${influencerSales.netCommission}::numeric), 0)`,
    })
    .from(influencerSales)
    .where(
      sql`${influencerSales.influencerId} = ${influencer.id} AND ${influencerSales.status} = 'pending'`
    );

  // Get payouts history
  const payouts = await db
    .select()
    .from(influencerPayouts)
    .where(eq(influencerPayouts.influencerId, influencer.id))
    .orderBy(desc(influencerPayouts.createdAt))
    .limit(10);

  // Get recent sales for commission breakdown
  const recentSales = await db
    .select({
      id: influencerSales.id,
      orderTotal: influencerSales.orderTotal,
      commissionAmount: influencerSales.commissionAmount,
      refundAmount: influencerSales.refundAmount,
      netCommission: influencerSales.netCommission,
      status: influencerSales.status,
      createdAt: influencerSales.createdAt,
    })
    .from(influencerSales)
    .where(eq(influencerSales.influencerId, influencer.id))
    .orderBy(desc(influencerSales.createdAt))
    .limit(10);

  const commissionRate = influencer.commissionValue 
    ? `${influencer.commissionValue}${influencer.commissionType === 'percentage' ? '%' : '₪'}`
    : '-';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">עמלות</h1>
        <p className="text-gray-500 mt-1">מעקב אחר העמלות שהרווחת</p>
      </div>

      {/* Commission Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">שיעור עמלה</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{commissionRate}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">סה"כ הורווח</p>
          <p className="text-lg sm:text-2xl font-bold text-green-600">{formatCurrency(commissionStats?.totalEarned || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">ממתין לתשלום</p>
          <p className="text-lg sm:text-2xl font-bold text-purple-600">{formatCurrency(pendingCommissions[0]?.totalPending || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">החזרים</p>
          <p className="text-lg sm:text-2xl font-bold text-red-500">-{formatCurrency(commissionStats?.totalRefunded || 0)}</p>
        </div>
      </div>

      {/* Net Total Card */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 sm:p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-xs sm:text-sm mb-1">עמלות נטו</p>
            <p className="text-2xl sm:text-4xl font-bold">{formatCurrency(commissionStats?.netTotal || 0)}</p>
            <p className="text-purple-100 text-xs sm:text-sm mt-1 sm:mt-2">
              (לאחר ניכוי החזרים)
            </p>
          </div>
          <div className="text-4xl sm:text-6xl opacity-20 hidden sm:block">💰</div>
        </div>
      </div>

      {/* Payouts History */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">היסטוריית תשלומים</h2>
        </div>
        
        {payouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-right font-medium">תקופה</th>
                  <th className="px-5 py-3 text-right font-medium">מכירות</th>
                  <th className="px-5 py-3 text-right font-medium">עמלה</th>
                  <th className="px-5 py-3 text-right font-medium">סטטוס</th>
                  <th className="px-5 py-3 text-right font-medium">תאריך תשלום</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm">
                      {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
                    </td>
                    <td className="px-5 py-4 font-medium">
                      {formatCurrency(payout.totalSales)}
                    </td>
                    <td className="px-5 py-4 text-purple-600 font-medium">
                      {formatCurrency(payout.netCommission)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        payout.status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : payout.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {payout.status === 'paid' && 'שולם'}
                        {payout.status === 'pending' && 'ממתין'}
                        {payout.status === 'approved' && 'מאושר'}
                        {payout.status === 'cancelled' && 'בוטל'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-sm">
                      {payout.paidAt ? formatDate(payout.paidAt) : '-'}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-1">אין היסטוריית תשלומים</p>
            <p className="text-sm text-gray-400">תשלומים יופיעו כאן כשישולמו</p>
          </div>
        )}
      </div>

      {/* Recent Commission Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">פירוט עמלות אחרון</h2>
        </div>
        
        {recentSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-right font-medium">תאריך</th>
                  <th className="px-5 py-3 text-right font-medium">סכום הזמנה</th>
                  <th className="px-5 py-3 text-right font-medium">עמלה</th>
                  <th className="px-5 py-3 text-right font-medium">החזר</th>
                  <th className="px-5 py-3 text-right font-medium">נטו</th>
                  <th className="px-5 py-3 text-right font-medium">סטטוס</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-gray-500 text-sm">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-5 py-4 font-medium">
                      {formatCurrency(sale.orderTotal)}
                    </td>
                    <td className="px-5 py-4 text-green-600">
                      +{formatCurrency(sale.commissionAmount)}
                    </td>
                    <td className="px-5 py-4 text-red-500">
                      {sale.refundAmount && parseFloat(sale.refundAmount) > 0 
                        ? `-${formatCurrency(sale.refundAmount)}` 
                        : '-'}
                    </td>
                    <td className="px-5 py-4 text-purple-600 font-medium">
                      {formatCurrency(sale.netCommission)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        sale.status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {sale.status === 'paid' ? 'שולם' : 'ממתין'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            אין עמלות עדיין
          </div>
        )}
      </div>
    </div>
  );
}

