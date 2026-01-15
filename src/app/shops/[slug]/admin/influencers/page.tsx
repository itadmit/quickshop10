import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { influencers, discounts, influencerSales } from '@/lib/db/schema';
import { eq, desc, sql, and, gte, lte, inArray } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CopyLoginLinkButton } from './copy-login-link-button';
import { DateRangePicker } from '@/components/admin/date-range-picker';
import { parseDateRange } from '@/components/admin/report-header';
import { InfluencersDataTable } from './influencers-data-table';
import type { Tab } from '@/components/admin/ui';

interface InfluencersPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string; from?: string; to?: string; search?: string; status?: string }>;
}

function formatCurrency(amount: string | number | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(num);
}

export default async function InfluencersPage({ params, searchParams }: InfluencersPageProps) {
  const { slug } = await params;
  const { period, from, to, search, status } = await searchParams;
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
      discountBuyQuantity: discounts.buyQuantity,
      discountGetQuantity: discounts.getQuantity,
      discountGetPercent: discounts.getDiscountPercent,
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

  // Filter by search (Server-side filtering)
  let filteredInfluencers = influencersWithPeriodData;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredInfluencers = filteredInfluencers.filter(i => 
      i.name.toLowerCase().includes(searchLower) ||
      i.email.toLowerCase().includes(searchLower) ||
      (i.couponCode && i.couponCode.toLowerCase().includes(searchLower)) ||
      (i.discountCode && i.discountCode.toLowerCase().includes(searchLower)) ||
      (i.instagramHandle && i.instagramHandle.toLowerCase().includes(searchLower))
    );
  }

  // Filter by status
  if (status && status !== 'all') {
    if (status === 'active') {
      filteredInfluencers = filteredInfluencers.filter(i => i.isActive);
    } else if (status === 'inactive') {
      filteredInfluencers = filteredInfluencers.filter(i => !i.isActive);
    }
  }

  // Calculate period totals (use filtered data for stats)
  const periodTotalSales = filteredInfluencers.reduce((sum, i) => sum + Number(i.periodSales || 0), 0);
  const periodTotalCommission = filteredInfluencers.reduce((sum, i) => sum + Number(i.periodCommission || 0), 0);
  const periodTotalOrders = filteredInfluencers.reduce((sum, i) => sum + (i.periodOrders || 0), 0);
  
  // Count for tabs (always use all data, not filtered)
  const activeCount = influencersWithPeriodData.filter(i => i.isActive).length;
  const inactiveCount = influencersWithPeriodData.filter(i => !i.isActive).length;

  const tabs: Tab[] = [
    { id: 'all', label: 'הכל', count: storeInfluencers.length },
    { id: 'active', label: 'פעילים', count: activeCount },
    { id: 'inactive', label: 'לא פעילים', count: inactiveCount },
  ];

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
          <p className="text-xs text-gray-400 mt-1">{activeCount} פעילים</p>
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

      {/* Influencers Table with Search */}
      <InfluencersDataTable
        influencers={filteredInfluencers}
        storeSlug={slug}
        tabs={tabs}
        currentTab={status || 'all'}
        searchValue={search}
      />

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

