import { getStoreBySlug, getStoreOrders, getOrderItemsMetadata, getOrderCouponCodes, getCategoriesByStore, getOrderFilterOptions } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { PageHeader, Button } from '@/components/admin/ui';
import type { Tab } from '@/components/admin/ui';
import { OrdersDataTable } from './orders-data-table';
import { OrderFilters } from './order-filters';

// ============================================
// Orders Page - Server Component
// ============================================

interface OrdersPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ 
    status?: string; 
    search?: string; 
    page?: string;
    // Advanced filters
    itemCountMin?: string;
    itemCountMax?: string;
    categoryId?: string;
    couponCode?: string;
    // Additional filters
    totalMin?: string;
    totalMax?: string;
    dateFrom?: string;
    dateTo?: string;
    shippingMethod?: string;
    paymentMethod?: string;
    city?: string;
    financialStatus?: string;
    fulfillmentStatus?: string;
  }>;
}

export default async function OrdersPage({ params, searchParams }: OrdersPageProps) {
  const { slug } = await params;
  const { 
    status, search, page, 
    itemCountMin, itemCountMax, categoryId, couponCode,
    totalMin, totalMax, dateFrom, dateTo,
    shippingMethod, paymentMethod, city,
    financialStatus: filterFinancialStatus, 
    fulfillmentStatus: filterFulfillmentStatus,
  } = await searchParams;
  
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Fetch orders and filter metadata in parallel (speed optimization!)
  const [allOrdersRaw, orderMetadata, couponCodes, categories, filterOptions] = await Promise.all([
    getStoreOrders(store.id),
    getOrderItemsMetadata(store.id),
    getOrderCouponCodes(store.id),
    getCategoriesByStore(store.id),
    getOrderFilterOptions(store.id),
  ]);
  
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
  
  // Advanced filters - item count
  if (itemCountMin || itemCountMax) {
    const minCount = itemCountMin ? parseInt(itemCountMin, 10) : 0;
    const maxCount = itemCountMax ? parseInt(itemCountMax, 10) : Infinity;
    
    filteredOrders = filteredOrders.filter(o => {
      const metadata = orderMetadata[o.id];
      const count = metadata?.itemCount || 0;
      return count >= minCount && count <= maxCount;
    });
  }
  
  // Advanced filters - category
  if (categoryId) {
    filteredOrders = filteredOrders.filter(o => {
      const metadata = orderMetadata[o.id];
      return metadata?.categoryIds?.includes(categoryId);
    });
  }
  
  // Advanced filters - coupon code
  if (couponCode) {
    filteredOrders = filteredOrders.filter(o => o.discountCode === couponCode);
  }
  
  // Advanced filters - order total
  if (totalMin || totalMax) {
    const minTotal = totalMin ? parseFloat(totalMin) : 0;
    const maxTotal = totalMax ? parseFloat(totalMax) : Infinity;
    
    filteredOrders = filteredOrders.filter(o => {
      const total = parseFloat(o.total);
      return total >= minTotal && total <= maxTotal;
    });
  }
  
  // Advanced filters - date range
  if (dateFrom || dateTo) {
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(0);
    const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : new Date();
    
    filteredOrders = filteredOrders.filter(o => {
      if (!o.createdAt) return false;
      const orderDate = new Date(o.createdAt);
      return orderDate >= fromDate && orderDate <= toDate;
    });
  }
  
  // Advanced filters - shipping method
  if (shippingMethod) {
    filteredOrders = filteredOrders.filter(o => o.shippingMethod === shippingMethod);
  }
  
  // Advanced filters - payment method
  if (paymentMethod) {
    filteredOrders = filteredOrders.filter(o => o.paymentMethod === paymentMethod);
  }
  
  // Advanced filters - city (destination)
  if (city) {
    filteredOrders = filteredOrders.filter(o => {
      const addr = o.shippingAddress as { city?: string } | null;
      return addr?.city === city;
    });
  }
  
  // Advanced filters - financial status
  if (filterFinancialStatus) {
    filteredOrders = filteredOrders.filter(o => o.financialStatus === filterFinancialStatus);
  }
  
  // Advanced filters - fulfillment status
  if (filterFulfillmentStatus) {
    filteredOrders = filteredOrders.filter(o => o.fulfillmentStatus === filterFulfillmentStatus);
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

  // Prepare category options for filter
  const categoryOptions = categories.map(c => ({
    value: c.id,
    label: c.name,
  }));
  
  // Check if any advanced filters are active
  const hasAdvancedFilters = itemCountMin || itemCountMax || categoryId || couponCode || 
    totalMin || totalMax || dateFrom || dateTo || shippingMethod || paymentMethod || city ||
    filterFinancialStatus || filterFulfillmentStatus;

  return (
    <div className="space-y-6">
      <PageHeader
        title="הזמנות"
        description={`${activeOrders.length} הזמנות פעילות${archivedCount > 0 ? ` • ${archivedCount} בארכיון` : ''}${hasAdvancedFilters ? ` • ${filteredOrders.length} תוצאות` : ''}`}
        actions={
          <Button href={`/shops/${slug}/admin/orders/drafts/new`} variant="primary" icon="plus">
            צור הזמנה
          </Button>
        }
      />
      
      {/* Advanced Filters */}
      <OrderFilters 
        categories={categoryOptions}
        couponCodes={couponCodes}
        shippingMethods={filterOptions.shippingMethods}
        paymentMethods={filterOptions.paymentMethods}
        cities={filterOptions.cities}
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
