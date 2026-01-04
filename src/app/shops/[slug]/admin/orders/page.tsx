import { getStoreBySlug, getStoreOrders } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { PageHeader, Button } from '@/components/admin/ui';
import type { Tab } from '@/components/admin/ui';
import { OrdersDataTable } from './orders-data-table';

// ============================================
// Orders Page - Server Component
// ============================================

interface OrdersPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

export default async function OrdersPage({ params, searchParams }: OrdersPageProps) {
  const { slug } = await params;
  const { status, search, page } = await searchParams;
  
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Fetch orders
  const allOrders = await getStoreOrders(store.id);
  
  // Filter by status tab
  let filteredOrders = allOrders;
  if (status && status !== 'all') {
    if (status === 'unpaid') {
      // הזמנות שממתינות לתשלום (pending payment)
      filteredOrders = allOrders.filter(o => o.financialStatus === 'pending');
    } else if (status === 'paid') {
      // הזמנות ששולמו
      filteredOrders = allOrders.filter(o => o.financialStatus === 'paid');
    } else if (status === 'cancelled') {
      // הזמנות שבוטלו
      filteredOrders = allOrders.filter(o => o.status === 'cancelled');
    } else if (status === 'unfulfilled') {
      filteredOrders = allOrders.filter(o => o.fulfillmentStatus === 'unfulfilled');
    } else if (status === 'open') {
      filteredOrders = allOrders.filter(o => 
        o.status !== 'cancelled' && o.status !== 'refunded' && o.fulfillmentStatus !== 'fulfilled'
      );
    }
  }
  
  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    filteredOrders = filteredOrders.filter(o => {
      const fullName = `${o.customer?.firstName || ''} ${o.customer?.lastName || ''}`.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(searchLower) ||
        fullName.includes(searchLower) ||
        o.customer?.email?.toLowerCase().includes(searchLower)
      );
    });
  }
  
  // Pagination
  const perPage = 20;
  const currentPage = parseInt(page || '1', 10);
  const totalPages = Math.ceil(filteredOrders.length / perPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );
  
  // Count for tabs
  const unpaidCount = allOrders.filter(o => o.financialStatus === 'pending').length;
  const paidCount = allOrders.filter(o => o.financialStatus === 'paid').length;
  const cancelledCount = allOrders.filter(o => o.status === 'cancelled').length;
  const unfulfilledCount = allOrders.filter(o => o.fulfillmentStatus === 'unfulfilled' && o.financialStatus === 'paid').length;
  const openCount = allOrders.filter(o => 
    o.status !== 'cancelled' && o.status !== 'refunded' && o.fulfillmentStatus !== 'fulfilled'
  ).length;

  const tabs: Tab[] = [
    { id: 'all', label: 'הכל', count: allOrders.length },
    { id: 'unpaid', label: 'ממתינות לתשלום', count: unpaidCount },
    { id: 'paid', label: 'שולמו', count: paidCount },
    { id: 'unfulfilled', label: 'ממתינות למשלוח', count: unfulfilledCount },
    { id: 'cancelled', label: 'בוטלו', count: cancelledCount },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="הזמנות"
        description={`${allOrders.length} הזמנות בחנות`}
        actions={
          <Button href={`/shops/${slug}/admin/orders/drafts/new`} variant="primary" icon="plus">
            צור הזמנה
          </Button>
        }
      />

      <OrdersDataTable
        orders={paginatedOrders}
        storeSlug={slug}
        tabs={tabs}
        currentTab={status || 'all'}
        searchValue={search}
        pagination={{
          currentPage,
          totalPages,
          totalItems: filteredOrders.length,
          perPage,
        }}
      />
    </div>
  );
}
