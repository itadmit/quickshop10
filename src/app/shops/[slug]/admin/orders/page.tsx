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
  const allOrdersRaw = await getStoreOrders(store.id);
  
  // Separate active and archived orders
  const activeOrders = allOrdersRaw.filter(o => !o.archivedAt);
  const archivedOrders = allOrdersRaw.filter(o => o.archivedAt);
  
  // Filter by status tab
  let filteredOrders = activeOrders;
  if (status === 'archived') {
    // הזמנות מאורכבות
    filteredOrders = archivedOrders;
  } else if (status && status !== 'all') {
    if (status === 'unpaid') {
      // הזמנות שממתינות לתשלום (pending payment)
      filteredOrders = activeOrders.filter(o => o.financialStatus === 'pending');
    } else if (status === 'paid') {
      // הזמנות ששולמו
      filteredOrders = activeOrders.filter(o => o.financialStatus === 'paid');
    } else if (status === 'cancelled') {
      // הזמנות שבוטלו
      filteredOrders = activeOrders.filter(o => o.status === 'cancelled');
    } else if (status === 'unfulfilled') {
      filteredOrders = activeOrders.filter(o => o.fulfillmentStatus === 'unfulfilled');
    } else if (status === 'open') {
      filteredOrders = activeOrders.filter(o => 
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
  
  // Count for tabs (only active orders, not archived)
  const unpaidCount = activeOrders.filter(o => o.financialStatus === 'pending').length;
  const paidCount = activeOrders.filter(o => o.financialStatus === 'paid').length;
  const cancelledCount = activeOrders.filter(o => o.status === 'cancelled').length;
  const unfulfilledCount = activeOrders.filter(o => o.fulfillmentStatus === 'unfulfilled' && o.financialStatus === 'paid').length;
  const archivedCount = archivedOrders.length;

  const tabs: Tab[] = [
    { id: 'all', label: 'הכל', count: activeOrders.length },
    { id: 'unpaid', label: 'ממתינות לתשלום', count: unpaidCount },
    { id: 'paid', label: 'שולמו', count: paidCount },
    { id: 'unfulfilled', label: 'ממתינות למשלוח', count: unfulfilledCount },
    { id: 'cancelled', label: 'בוטלו', count: cancelledCount },
    { id: 'archived', label: 'ארכיון', count: archivedCount },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="הזמנות"
        description={`${activeOrders.length} הזמנות פעילות${archivedCount > 0 ? ` • ${archivedCount} בארכיון` : ''}`}
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
