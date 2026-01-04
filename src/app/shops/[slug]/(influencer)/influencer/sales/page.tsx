import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentInfluencer } from '@/lib/influencer-auth';
import { db } from '@/lib/db';
import { influencerSales, orders } from '@/lib/db/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

interface SalesPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string; page?: string }>;
}

// Helper functions
function formatCurrency(amount: string | number | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(num);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

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

export default async function InfluencerSalesPage({ params, searchParams }: SalesPageProps) {
  const { slug } = await params;
  const { period = 'all', page = '1' } = await searchParams;
  
  const store = await getStoreBySlug(slug);
  if (!store) notFound();
  
  const basePath = `/shops/${slug}`;
  
  // Check authentication
  const influencer = await getCurrentInfluencer();
  if (!influencer || influencer.storeId !== store.id) {
    redirect(`${basePath}/influencer/login`);
  }

  // Calculate date filter
  let dateFilter = null;
  const now = new Date();
  if (period === 'today') {
    dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'week') {
    dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === 'month') {
    dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'year') {
    dateFilter = new Date(now.getFullYear(), 0, 1);
  }

  // Fetch sales with pagination
  const perPage = 20;
  const currentPage = parseInt(page, 10) || 1;
  const offset = (currentPage - 1) * perPage;

  // Base conditions
  const conditions = [eq(influencerSales.influencerId, influencer.id)];
  if (dateFilter) {
    conditions.push(gte(influencerSales.createdAt, dateFilter));
  }

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(influencerSales)
    .where(and(...conditions));

  const totalPages = Math.ceil(Number(count) / perPage);

  // Fetch sales
  const sales = await db
    .select({
      id: influencerSales.id,
      orderTotal: influencerSales.orderTotal,
      commissionAmount: influencerSales.commissionAmount,
      netCommission: influencerSales.netCommission,
      refundAmount: influencerSales.refundAmount,
      status: influencerSales.status,
      createdAt: influencerSales.createdAt,
      orderNumber: orders.orderNumber,
      orderStatus: orders.status,
      customerName: sql<string>`COALESCE(${orders.shippingAddress}->>'firstName', '') || ' ' || COALESCE(${orders.shippingAddress}->>'lastName', '')`,
    })
    .from(influencerSales)
    .innerJoin(orders, eq(orders.id, influencerSales.orderId))
    .where(and(...conditions))
    .orderBy(desc(influencerSales.createdAt))
    .limit(perPage)
    .offset(offset);

  // Calculate totals for filtered period
  const [totals] = await db
    .select({
      totalSales: sql<string>`COALESCE(SUM(${influencerSales.orderTotal}::numeric), 0)`,
      totalCommission: sql<string>`COALESCE(SUM(${influencerSales.netCommission}::numeric), 0)`,
      totalOrders: sql<number>`COUNT(*)`,
    })
    .from(influencerSales)
    .where(and(...conditions));

  const periods = [
    { id: 'all', label: 'הכל' },
    { id: 'today', label: 'היום' },
    { id: 'week', label: 'שבוע אחרון' },
    { id: 'month', label: 'החודש' },
    { id: 'year', label: 'השנה' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">מכירות</h1>
        <p className="text-gray-500 mt-1">כל ההזמנות שבוצעו עם הקופון שלך</p>
      </div>

      {/* Stats */}
      <div className={`grid gap-2 sm:gap-4 ${influencer.showOrderDetails && influencer.showCommission ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {influencer.showOrderDetails && (
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">סה"כ מכירות</p>
            <p className="text-base sm:text-2xl font-bold text-gray-900">{formatCurrency(totals?.totalSales || 0)}</p>
          </div>
        )}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">מספר הזמנות</p>
          <p className="text-base sm:text-2xl font-bold text-gray-900">{totals?.totalOrders || 0}</p>
        </div>
        {influencer.showCommission && (
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">עמלות</p>
            <p className="text-base sm:text-2xl font-bold text-purple-600">{formatCurrency(totals?.totalCommission || 0)}</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {periods.map((p) => (
            <Link
              key={p.id}
              href={`${basePath}/influencer/sales?period=${p.id}`}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                period === p.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {sales.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-5 py-3 text-right font-medium">הזמנה</th>
                    {influencer.showCustomerNames && (
                      <th className="px-3 sm:px-5 py-3 text-right font-medium hidden sm:table-cell">לקוח</th>
                    )}
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
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <span className="font-medium text-gray-900 text-sm">#{sale.orderNumber}</span>
                      </td>
                      {influencer.showCustomerNames && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4 text-gray-600 text-sm hidden sm:table-cell">
                          {sale.customerName?.trim() || '-'}
                        </td>
                      )}
                      <td className="px-3 sm:px-5 py-3 sm:py-4 text-gray-500 text-xs sm:text-sm whitespace-nowrap">
                        {formatDate(sale.createdAt)}
                      </td>
                      {influencer.showOrderDetails && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4 font-medium text-sm whitespace-nowrap">
                          {formatCurrency(sale.orderTotal)}
                        </td>
                      )}
                      {influencer.showCommission && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4">
                          <span className="font-medium text-purple-600 text-sm whitespace-nowrap">
                            {formatCurrency(sale.netCommission)}
                          </span>
                          {sale.refundAmount && parseFloat(sale.refundAmount) > 0 && (
                            <span className="text-xs text-red-500 mr-1 whitespace-nowrap">
                              (-{formatCurrency(sale.refundAmount)})
                            </span>
                          )}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-3 sm:px-5 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p className="text-xs sm:text-sm text-gray-500">
                  מציג {offset + 1}-{Math.min(offset + perPage, Number(count))} מתוך {count}
                </p>
                <div className="flex gap-2">
                  {currentPage > 1 && (
                    <Link
                      href={`${basePath}/influencer/sales?period=${period}&page=${currentPage - 1}`}
                      className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      הקודם
                    </Link>
                  )}
                  {currentPage < totalPages && (
                    <Link
                      href={`${basePath}/influencer/sales?period=${period}&page=${currentPage + 1}`}
                      className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      הבא
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-1">אין מכירות בתקופה זו</p>
            <p className="text-sm text-gray-400">שתפי את הקופון שלך כדי להתחיל להרוויח</p>
          </div>
        )}
      </div>
    </div>
  );
}

