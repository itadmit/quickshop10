import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentInfluencer } from '@/lib/influencer-auth';
import { db } from '@/lib/db';
import { discounts, automaticDiscounts, influencerSales } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { redirect, notFound } from 'next/navigation';
import { CopyButton } from './copy-button';

interface CouponsPageProps {
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

export default async function InfluencerCouponsPage({ params }: CouponsPageProps) {
  const { slug } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) notFound();
  
  const basePath = `/shops/${slug}`;
  
  // Check authentication
  const influencer = await getCurrentInfluencer();
  if (!influencer || influencer.storeId !== store.id) {
    redirect(`${basePath}/influencer/login`);
  }

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

  // Get usage stats for linked coupon
  const [couponStats] = await db
    .select({
      totalUses: sql<number>`COUNT(*)`,
      totalSales: sql<string>`COALESCE(SUM(${influencerSales.orderTotal}::numeric), 0)`,
      totalCommission: sql<string>`COALESCE(SUM(${influencerSales.netCommission}::numeric), 0)`,
    })
    .from(influencerSales)
    .where(eq(influencerSales.influencerId, influencer.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">הקופונים שלי</h1>
        <p className="text-gray-500 mt-1">קופונים והנחות המשויכים אליך</p>
      </div>

      {/* Active Coupons */}
      <div className="space-y-4">
        {linkedCoupon && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs sm:text-sm mb-1">קוד קופון</p>
                  <p className="text-xl sm:text-3xl font-bold tracking-wider">{linkedCoupon.code}</p>
                </div>
                <div className="text-4xl sm:text-5xl opacity-30 hidden sm:block">🎟️</div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              {/* Discount Info */}
              <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">סוג הנחה</p>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                    {linkedCoupon.type === 'percentage' && `${linkedCoupon.value}%`}
                    {linkedCoupon.type === 'fixed_amount' && formatCurrency(linkedCoupon.value)}
                    {linkedCoupon.type === 'free_shipping' && 'משלוח חינם'}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">מינימום הזמנה</p>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                    {linkedCoupon.minimumAmount ? formatCurrency(linkedCoupon.minimumAmount) : 'ללא'}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">תוקף</p>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                    {linkedCoupon.endsAt ? formatDate(linkedCoupon.endsAt) : 'ללא הגבלה'}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">סטטוס</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    linkedCoupon.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {linkedCoupon.isActive ? 'פעיל' : 'לא פעיל'}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="border-t border-gray-200 pt-4 sm:pt-6">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-3 sm:mb-4">ביצועים</h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{couponStats?.totalUses || 0}</p>
                    <p className="text-xs sm:text-sm text-gray-500">שימושים</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                    <p className="text-sm sm:text-2xl font-bold text-gray-900">{formatCurrency(couponStats?.totalSales || 0)}</p>
                    <p className="text-xs sm:text-sm text-gray-500">מכירות</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 sm:p-4 text-center">
                    <p className="text-sm sm:text-2xl font-bold text-purple-600">{formatCurrency(couponStats?.totalCommission || 0)}</p>
                    <p className="text-xs sm:text-sm text-gray-500">עמלות</p>
                  </div>
                </div>
              </div>

              {/* Copy Button */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 sm:gap-3">
                  <input
                    type="text"
                    value={linkedCoupon.code}
                    readOnly
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 border border-gray-200 rounded-lg font-mono text-sm sm:text-lg text-center"
                  />
                  <CopyButton text={linkedCoupon.code} />
                </div>
              </div>
            </div>
          </div>
        )}

        {linkedAutoDiscount && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{linkedAutoDiscount.name}</h3>
                <p className="text-sm text-gray-500">הנחה אוטומטית</p>
              </div>
              <div className="mr-auto">
                <span className="text-lg font-bold text-green-600">
                  {linkedAutoDiscount.type === 'percentage' && `${linkedAutoDiscount.value}%`}
                  {linkedAutoDiscount.type === 'fixed_amount' && formatCurrency(linkedAutoDiscount.value)}
                </span>
              </div>
            </div>
            {linkedAutoDiscount.description && (
              <p className="mt-4 text-sm text-gray-600">{linkedAutoDiscount.description}</p>
            )}
          </div>
        )}

        {!linkedCoupon && !linkedAutoDiscount && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-1">אין קופונים משויכים</p>
            <p className="text-sm text-gray-400">פנה למנהל החנות לקבלת קופון</p>
          </div>
        )}
      </div>

      {/* Direct link / coupon code */}
      {influencer.couponCode && (
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-6">
          <h3 className="font-semibold text-purple-900 mb-2">קוד הקופון שלך</h3>
          <p className="text-sm text-purple-700 mb-4">
            שתפי את הקוד הזה עם העוקבים שלך כדי שיקבלו הנחה ואת תקבלי עמלה על כל רכישה
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 px-4 py-3 bg-white border border-purple-200 rounded-lg font-mono text-xl text-center text-purple-900">
              {influencer.couponCode}
            </code>
            <CopyButton text={influencer.couponCode} />
          </div>
        </div>
      )}
    </div>
  );
}

