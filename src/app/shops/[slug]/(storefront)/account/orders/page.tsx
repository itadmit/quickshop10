import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const metadata = {
  title: 'ההזמנות שלי',
  description: 'צפייה בהיסטוריית הזמנות',
};

interface OrdersPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CustomerOrdersPage({ params }: OrdersPageProps) {
  const { slug } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }
  
  const basePath = `/shops/${slug}`;
  
  // Check if logged in
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect(`${basePath}/login?callbackUrl=${encodeURIComponent(`${basePath}/account/orders`)}`);
  }

  // Fetch all orders (server-side)
  const customerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customer.id))
    .orderBy(desc(orders.createdAt));
  
  // Get item counts for each order
  const ordersWithCounts = await Promise.all(
    customerOrders.map(async (order) => {
      const items = await db
        .select({ count: sql<number>`count(*)` })
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      return { ...order, itemsCount: Number(items[0]?.count || 0) };
    })
  );

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'ממתין לאישור', color: 'bg-amber-100 text-amber-700' },
    confirmed: { label: 'אושר', color: 'bg-blue-100 text-blue-700' },
    processing: { label: 'בהכנה', color: 'bg-purple-100 text-purple-700' },
    shipped: { label: 'נשלח', color: 'bg-indigo-100 text-indigo-700' },
    delivered: { label: 'נמסר', color: 'bg-green-100 text-green-700' },
    cancelled: { label: 'בוטל', color: 'bg-red-100 text-red-700' },
    refunded: { label: 'הוחזר', color: 'bg-gray-100 text-gray-700' },
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            href={`${basePath}/account`}
            className="text-sm text-gray-500 hover:text-black transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            חזרה לאיזור האישי
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-light tracking-wide mb-2">
            ההזמנות שלי
          </h1>
          <p className="text-gray-500 text-sm">
            {ordersWithCounts.length} הזמנות בסך הכל
          </p>
        </div>

        {/* Orders List */}
        {ordersWithCounts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <h2 className="text-lg font-medium mb-2">אין הזמנות עדיין</h2>
            <p className="text-gray-500 text-sm mb-6">
              לאחר שתבצע הזמנה, היא תופיע כאן
            </p>
            <Link
              href={basePath}
              className="inline-block btn-primary px-8"
            >
              התחל לקנות
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {ordersWithCounts.map((order) => {
              const status = statusLabels[order.status] || statusLabels.pending;
              return (
                <Link
                  key={order.id}
                  href={`${basePath}/account/orders/${order.orderNumber}`}
                  className="block bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-lg">הזמנה #{order.orderNumber}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('he-IL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500">
                      {order.itemsCount} פריטים
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-lg">
                        ₪{Number(order.total).toFixed(0)}
                      </span>
                      <span className="text-sm text-gray-400">
                        צפה בפרטים ←
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

