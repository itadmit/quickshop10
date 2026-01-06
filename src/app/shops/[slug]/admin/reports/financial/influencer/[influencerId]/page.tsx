import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getStoreBySlug } from '@/lib/db/queries';
import { getInfluencerOrders } from '@/lib/actions/reports';
import { ReportHeader, getReportPeriodParams } from '@/components/admin/report-header';
import { db } from '@/lib/db';
import { influencers, discounts } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// Format helpers
function formatCurrency(value: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'numeric',
    year: '2-digit',
  });
}

// Loading skeleton
function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-24 bg-gray-100 mb-6" />
      <div className="h-10 bg-gray-100 mb-2" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 bg-gray-50 mb-1" />
      ))}
    </div>
  );
}

// Status badge
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };

  const labels: Record<string, string> = {
    pending: 'ממתין',
    confirmed: 'אושר',
    processing: 'בטיפול',
    completed: 'הושלם',
    shipped: 'נשלח',
    delivered: 'נמסר',
    cancelled: 'בוטל',
    refunded: 'הוחזר',
  };

  return (
    <span className={`px-2 py-0.5 text-xs rounded ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

// Content Component
async function InfluencerOrdersContent({ 
  storeId, 
  storeSlug,
  influencerId, 
  period,
  customRange
}: { 
  storeId: string; 
  storeSlug: string;
  influencerId: string; 
  period: '7d' | '30d' | '90d' | 'custom';
  customRange?: { from: Date; to: Date };
}) {
  // Get influencer details with linked discount codes
  const [influencer] = await db
    .select({
      id: influencers.id,
      name: influencers.name,
      email: influencers.email,
      couponCode: influencers.couponCode,
      discountId: influencers.discountId,
      discountIds: influencers.discountIds,
      commissionType: influencers.commissionType,
      commissionValue: influencers.commissionValue,
      totalSales: influencers.totalSales,
      totalCommission: influencers.totalCommission,
    })
    .from(influencers)
    .where(and(eq(influencers.id, influencerId), eq(influencers.storeId, storeId)))
    .limit(1);

  if (!influencer) {
    notFound();
  }

  // Get linked discount codes if no direct coupon code
  let displayCouponCode = influencer.couponCode;
  if (!displayCouponCode) {
    const discountIdsList = [
      ...(influencer.discountId ? [influencer.discountId] : []),
      ...((influencer.discountIds as string[]) || []),
    ].filter(Boolean);
    
    if (discountIdsList.length > 0) {
      const linkedDiscounts = await db
        .select({ code: discounts.code })
        .from(discounts)
        .where(inArray(discounts.id, discountIdsList))
        .limit(5);
      
      displayCouponCode = linkedDiscounts.map(d => d.code).join(', ') || null;
    }
  }

  const orders = await getInfluencerOrders(storeId, influencerId, period, customRange);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalDiscount = orders.reduce((sum, o) => sum + o.discountAmount, 0);
  const commissionRate = Number(influencer.commissionValue) || 0;
  const estimatedCommission = totalRevenue * (commissionRate / 100);

  return (
    <>
      {/* Influencer Info Card */}
      <div className="bg-purple-50 border border-purple-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-200 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-medium">{influencer.name}</h2>
              <p className="text-sm text-gray-600">{influencer.email}</p>
              <code className="bg-purple-200 text-purple-800 px-2 py-0.5 text-sm mt-1 inline-block">
                {displayCouponCode || 'ללא קוד'}
              </code>
            </div>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-sm text-gray-600">אחוז עמלה</p>
              <p className="text-2xl font-medium">{commissionRate}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">סה״כ מכירות (כולל)</p>
              <p className="text-2xl font-medium">{formatCurrency(Number(influencer.totalSales))}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">סה״כ עמלות (כולל)</p>
              <p className="text-2xl font-medium text-purple-600">{formatCurrency(Number(influencer.totalCommission))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Period Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-500">הזמנות בתקופה</p>
          <p className="text-2xl font-medium mt-1">{orders.length}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-500">הכנסות בתקופה</p>
          <p className="text-2xl font-medium mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-500">הנחות שניתנו</p>
          <p className="text-2xl font-medium mt-1 text-green-600">{formatCurrency(totalDiscount)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-500">עמלה משוערת</p>
          <p className="text-2xl font-medium mt-1 text-purple-600">{formatCurrency(estimatedCommission)}</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="font-medium mb-4">הזמנות עם קוד הקופון</h3>
        
        {orders.length === 0 ? (
          <p className="text-gray-500 text-center py-12">אין הזמנות בתקופה זו</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-right">
                  <th className="py-3 px-4 font-medium text-gray-500 text-sm">מספר הזמנה</th>
                  <th className="py-3 px-4 font-medium text-gray-500 text-sm">לקוח</th>
                  <th className="py-3 px-4 font-medium text-gray-500 text-sm">סכום</th>
                  <th className="py-3 px-4 font-medium text-gray-500 text-sm">הנחה</th>
                  <th className="py-3 px-4 font-medium text-gray-500 text-sm">עמלה</th>
                  <th className="py-3 px-4 font-medium text-gray-500 text-sm">סטטוס</th>
                  <th className="py-3 px-4 font-medium text-gray-500 text-sm">תאריך</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(order => {
                  const commission = order.total * (commissionRate / 100);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link 
                          href={`/shops/${storeSlug}/admin/orders/${order.id}`}
                          className="font-medium text-black hover:underline"
                        >
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4">{order.customerName || '-'}</td>
                      <td className="py-3 px-4 font-medium">{formatCurrency(order.total)}</td>
                      <td className="py-3 px-4 text-green-600">-{formatCurrency(order.discountAmount)}</td>
                      <td className="py-3 px-4 text-purple-600">{formatCurrency(commission)}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// Page Component
export default async function InfluencerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; influencerId: string }>;
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const { slug, influencerId } = await params;
  const resolvedSearchParams = await searchParams;
  
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const { period, customRange } = getReportPeriodParams(resolvedSearchParams);

  return (
    <div>
      <ReportHeader
        title="הזמנות משפיען"
        description="צפייה בכל ההזמנות שנעשו עם קוד הקופון של המשפיען"
        storeSlug={slug}
        backHref={`/shops/${slug}/admin/reports/financial?tab=influencers`}
      />

      <Suspense fallback={<TableSkeleton />}>
        <InfluencerOrdersContent 
          storeId={store.id} 
          storeSlug={slug}
          influencerId={influencerId} 
          period={period} 
          customRange={customRange}
        />
      </Suspense>
    </div>
  );
}

