import { getStoreBySlug, getOrderDetails } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { OrderPrintView } from '@/components/admin/order-print-view';

interface PrintPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function PrintSingleOrderPage({ params }: PrintPageProps) {
  const { slug, id } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const order = await getOrderDetails(store.id, id);
  if (!order) notFound();

  return (
    <div className="print-container">
      <OrderPrintView order={order} store={store} />
      
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









