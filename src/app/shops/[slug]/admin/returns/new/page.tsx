import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/ui';
import { db } from '@/lib/db';
import { orders, orderItems, customers } from '@/lib/db/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
import Link from 'next/link';
import { NewReturnForm } from './new-return-form';

// ============================================
// New Return Page - Server Component
// Fast loading, minimal data fetching
// ============================================

export const metadata = {
  title: 'יצירת בקשת החזרה',
  description: 'יצירת בקשת החזרה או החלפה חדשה',
};

interface NewReturnPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ orderId?: string }>;
}

export default async function NewReturnPage({ params, searchParams }: NewReturnPageProps) {
  const { slug } = await params;
  const { orderId } = await searchParams;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }

  // If orderId is provided, fetch that specific order
  let selectedOrder = null;
  let selectedOrderItems: Array<{
    id: string;
    name: string;
    variantTitle: string | null;
    quantity: number;
    price: string | null;
    imageUrl: string | null;
  }> = [];

  if (orderId) {
    const [order] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: customers.firstName,
        customerEmail: customers.email,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(and(eq(orders.id, orderId), eq(orders.storeId, store.id)))
      .limit(1);

    if (order) {
      selectedOrder = order;

      // Fetch order items
      selectedOrderItems = await db
        .select({
          id: orderItems.id,
          name: orderItems.name,
          variantTitle: orderItems.variantTitle,
          quantity: orderItems.quantity,
          price: orderItems.price,
          imageUrl: orderItems.imageUrl,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));
    }
  }

  // Fetch recent orders for selection (only if no orderId provided)
  let recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string | null;
    customerEmail: string | null;
    total: string | null;
    createdAt: Date | null;
  }> = [];

  if (!orderId) {
    recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: customers.firstName,
        customerEmail: customers.email,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(
        and(
          eq(orders.storeId, store.id),
          inArray(orders.status, ['delivered', 'shipped', 'confirmed', 'processing'])
        )
      )
      .orderBy(desc(orders.createdAt))
      .limit(50);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="יצירת בקשת החזרה"
        description="יצירת בקשה ידנית להחזרה או החלפה"
        actions={
          <Link
            href={`/shops/${slug}/admin/returns`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            חזרה לרשימה
          </Link>
        }
      />

      <NewReturnForm
        storeSlug={slug}
        selectedOrder={selectedOrder}
        selectedOrderItems={selectedOrderItems}
        recentOrders={recentOrders}
      />
    </div>
  );
}

