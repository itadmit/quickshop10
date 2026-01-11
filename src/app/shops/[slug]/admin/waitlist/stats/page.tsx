import { db } from '@/lib/db';
import { productWaitlist, products, productVariants, stores, productImages } from '@/lib/db/schema';
import { eq, and, desc, count, isNull } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/ui';
import { BarChart3, TrendingUp, Users, Bell, Package } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface WaitlistStatsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WaitlistStatsPage({ params }: WaitlistStatsPageProps) {
  const { slug } = await params;
  
  const store = await db.query.stores.findFirst({
    where: eq(stores.slug, slug),
  });

  if (!store) {
    notFound();
  }

  // Get total stats - using separate queries since filterWhere doesn't exist
  const [totalResult, pendingResult, notifiedResult] = await Promise.all([
    db.select({ count: count() }).from(productWaitlist).where(eq(productWaitlist.storeId, store.id)),
    db.select({ count: count() }).from(productWaitlist).where(and(eq(productWaitlist.storeId, store.id), eq(productWaitlist.isNotified, false))),
    db.select({ count: count() }).from(productWaitlist).where(and(eq(productWaitlist.storeId, store.id), eq(productWaitlist.isNotified, true))),
  ]);
  const totalStats = {
    total: totalResult[0].count,
    pending: pendingResult[0].count,
    notified: notifiedResult[0].count,
  };

  // Get top products by waitlist count
  const topProducts = await db
    .select({
      productId: productWaitlist.productId,
      productName: products.name,
      productSlug: products.slug,
      productImageUrl: productImages.url,
      variantId: productWaitlist.variantId,
      variantTitle: productVariants.title,
      count: count(),
    })
    .from(productWaitlist)
    .leftJoin(products, eq(products.id, productWaitlist.productId))
    .leftJoin(productVariants, eq(productVariants.id, productWaitlist.variantId))
    .leftJoin(productImages, and(
      eq(productImages.productId, products.id),
      eq(productImages.isPrimary, true)
    ))
    .where(eq(productWaitlist.storeId, store.id))
    .groupBy(
      productWaitlist.productId,
      products.name,
      products.slug,
      productImages.url,
      productWaitlist.variantId,
      productVariants.title
    )
    .orderBy(desc(count()))
    .limit(10);

  const basePath = `/shops/${slug}`;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="סטטיסטיקות רשימת המתנה"
        description="מוצרים פופולריים וניתוח רשימת המתנה"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 rounded-full p-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">סה"כ ממתינים</p>
              <p className="text-3xl font-bold text-gray-900">{totalStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 rounded-full p-3">
              <Bell className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">ממתינים לעדכון</p>
              <p className="text-3xl font-bold text-gray-900">{totalStats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 rounded-full p-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">עודכנו</p>
              <p className="text-3xl font-bold text-gray-900">{totalStats.notified}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-6 h-6 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">
            המוצרים הכי מבוקשים
          </h2>
        </div>

        {topProducts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">אין עדיין נתונים להצגה</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      דירוג
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      מוצר
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      סה"כ ממתינים
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      עודכנו
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      שיעור המרה
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topProducts.map((item, index) => {
                    // Conversion rate would need additional query per product
                    const conversionRate = 0;

                    return (
                      <tr key={`${item.productId}-${item.variantId || 'simple'}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`
                            inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                            ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                              index === 1 ? 'bg-gray-100 text-gray-800' : 
                              index === 2 ? 'bg-orange-100 text-orange-800' : 
                              'bg-gray-50 text-gray-600'}
                          `}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {item.productImageUrl ? (
                              <img
                                src={item.productImageUrl}
                                alt={item.productName || ''}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <Link
                                href={`${basePath}/admin/products/${item.productId}`}
                                className="font-medium text-gray-900 hover:text-blue-600"
                              >
                                {item.productName}
                              </Link>
                              {item.variantTitle && (
                                <p className="text-sm text-gray-500">{item.variantTitle}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-gray-900">{item.count}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-600">-</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${conversionRate}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {conversionRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

