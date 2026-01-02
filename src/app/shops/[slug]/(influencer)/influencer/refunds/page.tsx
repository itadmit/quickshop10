import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentInfluencer } from '@/lib/influencer-auth';
import { db } from '@/lib/db';
import { influencerSales, orders, refunds } from '@/lib/db/schema';
import { eq, desc, sql, and, gt } from 'drizzle-orm';
import { redirect, notFound } from 'next/navigation';

interface RefundsPageProps {
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

export default async function InfluencerRefundsPage({ params }: RefundsPageProps) {
  const { slug } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) notFound();
  
  const basePath = `/shops/${slug}`;
  
  // Check authentication
  const influencer = await getCurrentInfluencer();
  if (!influencer || influencer.storeId !== store.id) {
    redirect(`${basePath}/influencer/login`);
  }

  // Get refunds related to influencer's sales
  const refundsList = await db
    .select({
      id: refunds.id,
      amount: refunds.amount,
      reason: refunds.reason,
      status: refunds.status,
      createdAt: refunds.createdAt,
      processedAt: refunds.processedAt,
      orderNumber: orders.orderNumber,
      orderTotal: orders.total,
    })
    .from(refunds)
    .innerJoin(orders, eq(orders.id, refunds.orderId))
    .innerJoin(influencerSales, eq(influencerSales.orderId, refunds.orderId))
    .where(eq(influencerSales.influencerId, influencer.id))
    .orderBy(desc(refunds.createdAt))
    .limit(50);

  // Get refund stats
  const [refundStats] = await db
    .select({
      totalRefunds: sql<number>`COUNT(*)`,
      totalAmount: sql<string>`COALESCE(SUM(${refunds.amount}::numeric), 0)`,
      pendingCount: sql<number>`COUNT(*) FILTER (WHERE ${refunds.status} = 'pending')`,
      completedCount: sql<number>`COUNT(*) FILTER (WHERE ${refunds.status} = 'completed')`,
    })
    .from(refunds)
    .innerJoin(influencerSales, eq(influencerSales.orderId, refunds.orderId))
    .where(eq(influencerSales.influencerId, influencer.id));

  // Calculate commission lost to refunds
  const [commissionLost] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${influencerSales.refundAmount}::numeric), 0)`,
    })
    .from(influencerSales)
    .where(
      and(
        eq(influencerSales.influencerId, influencer.id),
        gt(sql`${influencerSales.refundAmount}::numeric`, 0)
      )
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">החזרים</h1>
        <p className="text-gray-500 mt-1">החזרים מהזמנות שנעשו עם הקופון שלך</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">סה"כ החזרים</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{refundStats?.totalRefunds || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">סכום הוחזר</p>
          <p className="text-lg sm:text-2xl font-bold text-red-500">{formatCurrency(refundStats?.totalAmount || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">עמלות שהופחתו</p>
          <p className="text-lg sm:text-2xl font-bold text-orange-500">-{formatCurrency(commissionLost?.total || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">ממתינים</p>
          <p className="text-lg sm:text-2xl font-bold text-yellow-600">{refundStats?.pendingCount || 0}</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-blue-900 text-sm sm:text-base">איך החזרים משפיעים על העמלות?</p>
          <p className="text-xs sm:text-sm text-blue-700 mt-1">
            כאשר לקוח מבקש החזר על הזמנה שבוצעה עם הקופון שלך, העמלה שלך מופחתת בהתאם.
            ההפחתה נעשית באופן יחסי לסכום ההחזר.
          </p>
        </div>
      </div>

      {/* Refunds Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">היסטוריית החזרים</h2>
        </div>
        
        {refundsList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-right font-medium">הזמנה</th>
                  <th className="px-5 py-3 text-right font-medium">סכום מקורי</th>
                  <th className="px-5 py-3 text-right font-medium">סכום החזר</th>
                  <th className="px-5 py-3 text-right font-medium">סיבה</th>
                  <th className="px-5 py-3 text-right font-medium">תאריך</th>
                  <th className="px-5 py-3 text-right font-medium">סטטוס</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {refundsList.map((refund) => (
                  <tr key={refund.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <span className="font-medium text-gray-900">#{refund.orderNumber}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {formatCurrency(refund.orderTotal)}
                    </td>
                    <td className="px-5 py-4 text-red-600 font-medium">
                      -{formatCurrency(refund.amount)}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-sm max-w-[200px] truncate">
                      {refund.reason || '-'}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-sm">
                      {formatDate(refund.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        refund.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : refund.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : refund.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {refund.status === 'completed' && 'הושלם'}
                        {refund.status === 'pending' && 'ממתין'}
                        {refund.status === 'approved' && 'מאושר'}
                        {refund.status === 'rejected' && 'נדחה'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-900 font-medium mb-1">אין החזרים! 🎉</p>
            <p className="text-sm text-gray-500">הלקוחות שלך מרוצים מהרכישות</p>
          </div>
        )}
      </div>
    </div>
  );
}

