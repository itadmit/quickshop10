import { headers } from 'next/headers';
import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { isOrderEligibleForReturn } from '@/lib/db/queries/returns';
import { ReturnRequestForm } from './return-form';

export const metadata = {
  title: 'בקשת החזרה/החלפה',
  description: 'הגשת בקשה להחזרה או החלפה',
};

interface ReturnPageProps {
  params: Promise<{ slug: string; orderNumber: string }>;
}

export default async function ReturnRequestPage({ params }: ReturnPageProps) {
  const { slug, orderNumber } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }
  
  const headersList = await headers();
  const basePath = headersList.get('x-custom-domain') ? '' : `/shops/${slug}`;
  
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect(`${basePath}/login?callbackUrl=${encodeURIComponent(`${basePath}/account/orders/${orderNumber}/return`)}`);
  }

  // Fetch order with items
  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.orderNumber, orderNumber),
        eq(orders.customerId, customer.id),
        eq(orders.storeId, store.id)
      )
    )
    .limit(1);

  if (!order) {
    notFound();
  }

  // Check eligibility
  const eligibility = await isOrderEligibleForReturn(order.id, store.id);

  // Fetch order items
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            href={`${basePath}/account/orders/${orderNumber}`}
            className="text-sm text-gray-500 hover:text-black transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            חזרה להזמנה #{orderNumber}
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-light tracking-wide mb-2">
            בקשת החזרה/החלפה
          </h1>
          <p className="text-gray-500 text-sm">
            הזמנה #{orderNumber}
          </p>
        </div>

        {!eligibility.eligible ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-500">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h2 className="text-lg font-medium mb-2">לא ניתן להגיש בקשה</h2>
            <p className="text-gray-500 text-sm mb-6">
              {eligibility.reason}
            </p>
            <Link
              href={`${basePath}/account/orders/${orderNumber}`}
              className="inline-block px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              חזרה להזמנה
            </Link>
          </div>
        ) : (
          <ReturnRequestForm 
            storeSlug={slug}
            orderId={order.id}
            orderNumber={orderNumber}
            basePath={basePath}
            items={items.map(item => ({
              id: item.id,
              productId: item.productId,
              name: item.name,
              variantTitle: item.variantTitle,
              quantity: item.quantity,
              price: Number(item.price),
              imageUrl: item.imageUrl,
            }))}
          />
        )}
      </div>
    </div>
  );
}

