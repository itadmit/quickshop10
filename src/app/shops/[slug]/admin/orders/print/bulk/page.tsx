import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { orders, orderItems, customers } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { OrderPrintView } from '@/components/admin/order-print-view';

interface BulkPrintPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ids?: string }>;
}

export default async function BulkPrintOrdersPage({ params, searchParams }: BulkPrintPageProps) {
  const { slug } = await params;
  const { ids } = await searchParams;
  
  if (!ids) notFound();
  
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  // Parse order IDs from query string
  const orderIds = ids.split(',').filter(Boolean);
  if (orderIds.length === 0) notFound();

  // Fetch all orders with their items and customers in parallel
  const ordersData = await db
    .select()
    .from(orders)
    .where(and(
      eq(orders.storeId, store.id),
      inArray(orders.id, orderIds)
    ));

  // Fetch items and customers for all orders in parallel
  const ordersWithDetails = await Promise.all(
    ordersData.map(async (order) => {
      const [items, customer] = await Promise.all([
        db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
        order.customerId 
          ? db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1).then(r => r[0] || null)
          : Promise.resolve(null)
      ]);
      return { ...order, items, customer };
    })
  );

  // Sort orders by the order they were selected
  const sortedOrders = orderIds
    .map(id => ordersWithDetails.find(o => o.id === id))
    .filter(Boolean);

  return (
    <div className="print-container">
      {sortedOrders.map((order, index) => (
        <div key={order!.id} className={index > 0 ? 'page-break' : ''}>
          <OrderPrintView order={order!} store={store} />
        </div>
      ))}
      
      {/* Auto print script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.onload = function() {
              window.print();
            };
          `,
        }}
      />
    </div>
  );
}



