import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { influencers, discounts, automaticDiscounts, influencerSales } from '@/lib/db/schema';
import { eq, desc, sql, and, gte, lte, inArray } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { InfluencerButtons } from './influencer-buttons';
import { CopyLoginLinkButton } from './copy-login-link-button';
import { DateRangePicker } from '@/components/admin/date-range-picker';
import { parseDateRange } from '@/components/admin/report-header';

interface InfluencersPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}

function formatCurrency(amount: string | number | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(num);
}

export default async function InfluencersPage({ params, searchParams }: InfluencersPageProps) {
  const { slug } = await params;
  const { period, from, to } = await searchParams;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Parse date range from URL params (defaults to 30 days)
  const { startDate, endDate, periodLabel } = parseDateRange({ period, from, to });

  // Fetch influencers with their linked discounts
  const storeInfluencers = await db
    .select({
      id: influencers.id,
      name: influencers.name,
      email: influencers.email,
      phone: influencers.phone,
      instagramHandle: influencers.instagramHandle,
      instagramFollowers: influencers.instagramFollowers,
      commissionType: influencers.commissionType,
      commissionValue: influencers.commissionValue,
      showCommission: influencers.showCommission,
      showCustomerNames: influencers.showCustomerNames,
      showOrderDetails: influencers.showOrderDetails,
      couponCode: influencers.couponCode,
      totalSales: influencers.totalSales,
      totalCommission: influencers.totalCommission,
      totalOrders: influencers.totalOrders,
      isActive: influencers.isActive,
      createdAt: influencers.createdAt,
      discountValue: discounts.value,
      discountType: discounts.type,
      discountCode: discounts.code, // Also get the discount code
    })
    .from(influencers)
    .leftJoin(discounts, eq(discounts.id, influencers.discountId))
    .where(eq(influencers.storeId, store.id))
    .orderBy(desc(influencers.createdAt));

  // Fetch sales data for the selected period for each influencer
  const influencerIds = storeInfluencers.map(i => i.id);
  
  // Get period-specific sales data
  const periodSalesData = influencerIds.length > 0 ? await db
    .select({
      influencerId: influencerSales.influencerId,
      totalSales: sql<string>`COALESCE(SUM(${influencerSales.orderTotal}), 0)`,
      totalCommission: sql<string>`COALESCE(SUM(${influencerSales.commissionAmount}), 0)`,
      totalOrders: sql<number>`COUNT(*)::int`,
    })
    .from(influencerSales)
    .where(and(
      inArray(influencerSales.influencerId, influencerIds),
      gte(influencerSales.createdAt, startDate),
      lte(influencerSales.createdAt, endDate)
    ))
    .groupBy(influencerSales.influencerId) : [];

  // Create a map for quick lookup
  const periodSalesMap = new Map(periodSalesData.map(s => [s.influencerId, s]));

  // Combine influencer data with period-specific sales
  const influencersWithPeriodData = storeInfluencers.map(inf => {
    const periodData = periodSalesMap.get(inf.id);
    return {
      ...inf,
      periodSales: periodData?.totalSales || '0',
      periodCommission: periodData?.totalCommission || '0',
      periodOrders: periodData?.totalOrders || 0,
    };
  });

  // Calculate period totals
  const periodTotalSales = influencersWithPeriodData.reduce((sum, i) => sum + Number(i.periodSales || 0), 0);
  const periodTotalCommission = influencersWithPeriodData.reduce((sum, i) => sum + Number(i.periodCommission || 0), 0);
  const periodTotalOrders = influencersWithPeriodData.reduce((sum, i) => sum + (i.periodOrders || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">משפיענים</h1>
          <p className="text-gray-500 text-sm mt-1">ניהול משפיענים ושותפים שיווקיים</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker />
          <CopyLoginLinkButton slug={slug} />
          <Link
            href={`/shops/${slug}/admin/influencers/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            משפיען חדש
          </Link>
        </div>
      </div>

      {/* Period Stats - filtered by date range */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">סה"כ משפיענים</p>
          <p className="text-2xl font-bold text-gray-900">{storeInfluencers.length}</p>
          <p className="text-xs text-gray-400 mt-1">{storeInfluencers.filter(i => i.isActive).length} פעילים</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">מכירות בתקופה</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(periodTotalSales)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{periodLabel}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">הזמנות בתקופה</p>
          <p className="text-2xl font-bold text-blue-600">{periodTotalOrders}</p>
          <p className="text-xs text-gray-400 mt-1">{periodLabel}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">עמלות בתקופה</p>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(periodTotalCommission)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{periodLabel}</p>
        </div>
      </div>

      {/* Influencers Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {influencersWithPeriodData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-right font-medium">משפיען</th>
                  <th className="px-5 py-3 text-right font-medium">קופון</th>
                  <th className="px-5 py-3 text-right font-medium">עמלה</th>
                  <th className="px-5 py-3 text-right font-medium">מכירות בתקופה</th>
                  <th className="px-5 py-3 text-right font-medium">הזמנות בתקופה</th>
                  <th className="px-5 py-3 text-right font-medium">סה"כ מכירות</th>
                  <th className="px-5 py-3 text-right font-medium">סטטוס</th>
                  <th className="px-5 py-3 text-right font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {influencersWithPeriodData.map((influencer) => (
                  <tr key={influencer.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-medium">
                          {influencer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{influencer.name}</p>
                          <p className="text-sm text-gray-500">{influencer.email}</p>
                          {influencer.instagramHandle && (
                            <p className="text-xs text-pink-600">{influencer.instagramHandle}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {(influencer.couponCode || influencer.discountCode) ? (
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-sm font-mono rounded-lg">
                          {influencer.couponCode || influencer.discountCode}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                      {influencer.discountValue && (
                        <p className="text-xs text-gray-500 mt-1">
                          {influencer.discountValue}{influencer.discountType === 'percentage' ? '%' : '₪'} הנחה
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {influencer.commissionValue ? (
                        <span className="font-medium text-gray-900">
                          {influencer.commissionValue}{influencer.commissionType === 'percentage' ? '%' : '₪'}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">לא מוגדר</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{formatCurrency(influencer.periodSales)}</p>
                      <p className="text-xs text-purple-600">{formatCurrency(influencer.periodCommission)} עמלה</p>
                    </td>
                    <td className="px-5 py-4 font-medium">
                      {influencer.periodOrders}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-500">{formatCurrency(influencer.totalSales)}</p>
                      <p className="text-xs text-gray-400">{influencer.totalOrders} הזמנות</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        influencer.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {influencer.isActive ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/shops/${slug}/admin/influencers/${influencer.id}`}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="עריכה"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <InfluencerButtons influencerId={influencer.id} slug={slug} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : storeInfluencers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 20h14"/>
              </svg>
            </div>
            <p className="text-gray-500 mb-1">אין משפיענים עדיין</p>
            <p className="text-sm text-gray-400 mb-4">הוסף משפיען ראשון כדי להתחיל לעקוב אחרי מכירות</p>
            <Link
              href={`/shops/${slug}/admin/influencers/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            משפיען חדש
          </Link>
          </div>
        ) : null}
      </div>

      {/* Help Card */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100 p-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">איך זה עובד?</h3>
            <p className="text-sm text-gray-600 mb-3">
              צור משפיען, שייך לו קופון, והגדר את אחוז העמלה שלו. המשפיען יקבל גישה לדשבורד ייעודי שבו יוכל לראות את המכירות שלו.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>עמלה:</strong> הגדר כמה % המשפיען מקבל מכל מכירה</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>נראות:</strong> שלוט מה המשפיען רואה בדשבורד (עמלות, שמות לקוחות, פרטי הזמנות)</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>קופון:</strong> שייך קופון ייחודי לכל משפיען למעקב אחרי מכירות</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

