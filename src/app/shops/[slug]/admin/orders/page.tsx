import { getStoreBySlug, getStoreOrders, getOrderItemsMetadata, getOrderCouponCodes, getCategoriesByStore, getOrderFilterOptions } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { PageHeader, Button } from '@/components/admin/ui';
import type { Tab } from '@/components/admin/ui';
import { OrdersDataTable } from './orders-data-table';
import { OrderFilters } from './order-filters';
import { DateRangePicker } from '@/components/admin/date-range-picker';
import { parseDateRange } from '@/components/admin/report-header';
import { ExportOrdersButton } from './export-orders-modal';
import { isPluginActive } from '@/lib/plugins/loader';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

// ============================================
// Orders Page - Server Component
// ============================================

interface OrdersPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ 
    status?: string; 
    search?: string; 
    page?: string;
    perPage?: string;
    // Sort order
    sortOrder?: 'newest' | 'oldest';
    // Date range picker (like reports)
    period?: string;
    from?: string;
    to?: string;
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
    trafficSource?: string;
  }>;
}

export default async function OrdersPage({ params, searchParams }: OrdersPageProps) {
  const { slug } = await params;
  const { 
    status, search, page, perPage: perPageParam,
    // Sort order
    sortOrder = 'newest',
    // Date range picker params
    period, from, to,
    itemCountMin, itemCountMax, categoryId, couponCode,
    totalMin, totalMax, dateFrom, dateTo,
    shippingMethod, paymentMethod, city,
    financialStatus: filterFinancialStatus, 
    fulfillmentStatus: filterFulfillmentStatus,
    trafficSource,
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
  
  // Filter by search FIRST - לפני סינון לפי סטטוס, כדי שהחיפוש יעבוד על כל ההזמנות
  // אם יש חיפוש, נחפש גם בארכיון אם לא נמצאה תוצאה בהזמנות הפעילות
  let searchFilteredOrders = activeOrders;
  let searchFilteredArchived = archivedOrders;
  if (search) {
    const searchLower = search.toLowerCase();
    const searchFunc = (o: typeof activeOrders[0]) => {
      const fullName = `${o.customer?.firstName || ''} ${o.customer?.lastName || ''}`.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(searchLower) ||
        fullName.includes(searchLower) ||
        o.customer?.email?.toLowerCase().includes(searchLower)
      );
    };
    
    searchFilteredOrders = activeOrders.filter(searchFunc);
    searchFilteredArchived = archivedOrders.filter(searchFunc);
    
    // אם לא נמצאה תוצאה בהזמנות הפעילות, נכלול גם את המאורכבות
    if (searchFilteredOrders.length === 0 && searchFilteredArchived.length > 0) {
      searchFilteredOrders = searchFilteredArchived;
    }
  }
  
  // Filter by status tab - ברירת מחדל: 'paid' (שולמו)
  const effectiveStatus = status || 'paid';
  let filteredOrders = searchFilteredOrders;
  
  if (effectiveStatus === 'archived') {
    // הזמנות מאורכבות
    filteredOrders = searchFilteredArchived;
  } else if (effectiveStatus === 'all') {
    // הכל - לא מסננים לפי סטטוס
    filteredOrders = searchFilteredOrders;
  } else if (effectiveStatus === 'unpaid') {
    // הזמנות שממתינות לתשלום (pending payment)
    filteredOrders = searchFilteredOrders.filter(o => o.financialStatus === 'pending');
  } else if (effectiveStatus === 'paid') {
    // הזמנות ששולמו
    filteredOrders = searchFilteredOrders.filter(o => o.financialStatus === 'paid');
  } else if (effectiveStatus === 'cancelled') {
    // הזמנות שבוטלו
    filteredOrders = searchFilteredOrders.filter(o => o.status === 'cancelled');
  } else if (effectiveStatus === 'unfulfilled') {
    // ממתינות למשלוח = שולמו אבל עדיין לא נשלחו
    filteredOrders = searchFilteredOrders.filter(o => 
      o.financialStatus === 'paid' && o.fulfillmentStatus === 'unfulfilled'
    );
  } else if (effectiveStatus === 'open') {
    filteredOrders = searchFilteredOrders.filter(o => 
      o.status !== 'cancelled' && o.status !== 'refunded' && o.fulfillmentStatus !== 'fulfilled'
    );
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
  
  // Advanced filters - date range (supports both DateRangePicker and advanced filters)
  // Priority: DateRangePicker (always applied, defaults to 30d) > Advanced filter (dateFrom/dateTo)
  const hasAdvancedDateFilter = dateFrom || dateTo;
  
  // 🔑 Always apply DateRangePicker filter - uses parseDateRange which defaults to 30d (החודש)
  // parseDateRange will use the period from URL, or default to 30d if not specified
  const { startDate, endDate } = parseDateRange({ period, from, to });
  
  filteredOrders = filteredOrders.filter(o => {
    if (!o.createdAt) return false;
    const orderDate = new Date(o.createdAt);
    return orderDate >= startDate && orderDate <= endDate;
  });
  
  // If advanced date filter is also set (override), apply it
  if (hasAdvancedDateFilter) {
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
  
  // Advanced filters - financial status (רק אם נבחר במפורש בפילטרים המתקדמים)
  if (filterFinancialStatus) {
    filteredOrders = filteredOrders.filter(o => o.financialStatus === filterFinancialStatus);
  }
  
  // Advanced filters - fulfillment status
  if (filterFulfillmentStatus) {
    filteredOrders = filteredOrders.filter(o => o.fulfillmentStatus === filterFulfillmentStatus);
  }
  
  // Advanced filters - traffic source
  if (trafficSource) {
    filteredOrders = filteredOrders.filter(o => o.utmSource === trafficSource);
  }
  
  // Sort orders by date
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return sortOrder === 'oldest' ? dateA - dateB : dateB - dateA;
  });

  // Pagination - support 20, 50, 100, 200 (stored in localStorage via client component)
  const validPerPages = [20, 50, 100, 200];
  const perPage = perPageParam && validPerPages.includes(parseInt(perPageParam)) 
    ? parseInt(perPageParam) 
    : 20;
  const currentPage = parseInt(page || '1', 10);
  const totalPages = Math.ceil(sortedOrders.length / perPage);
  const paginatedOrders = sortedOrders.slice(
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
    { id: 'paid', label: 'שולמו', count: paidCount },
    { id: 'unpaid', label: 'ממתינות לתשלום', count: unpaidCount },
    { id: 'unfulfilled', label: 'ממתינות למשלוח', count: unfulfilledCount },
    { id: 'cancelled', label: 'בוטלו', count: cancelledCount },
    { id: 'archived', label: 'ארכיון', count: archivedCount },
    { id: 'all', label: 'הכל', count: activeOrders.length },
  ];

  // Prepare category options for filter
  const categoryOptions = categories.map(c => ({
    value: c.id,
    label: c.name,
  }));
  
  // Get custom order statuses from store settings
  const customStatuses = (store.customOrderStatuses as Array<{
    id: string;
    name: string;
    color: string;
  }>) || [];
  
  // CRM Plugin: Check if CRM is active to show "Created By" column
  const crmActive = await isPluginActive(store.id, 'crm');
  
  // CRM Plugin: Get user names for orders that have createdByUserId
  // Also add itemsCount from orderMetadata
  let ordersWithUserNames = paginatedOrders.map(o => ({ 
    ...o, 
    createdByUserName: null as string | null,
    itemsCount: orderMetadata[o.id]?.itemCount || 0,
  }));
  
  if (crmActive) {
    const userIds = paginatedOrders
      .map(o => o.createdByUserId)
      .filter((id): id is string => !!id);
    
    if (userIds.length > 0) {
      const uniqueUserIds = [...new Set(userIds)];
      const usersData = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(inArray(users.id, uniqueUserIds));
      
      const userMap = new Map(usersData.map(u => [u.id, u.name || u.email || 'סוכן']));
      
      ordersWithUserNames = paginatedOrders.map(o => ({
        ...o,
        createdByUserName: o.createdByUserId ? (userMap.get(o.createdByUserId) || 'סוכן') : null,
        itemsCount: orderMetadata[o.id]?.itemCount || 0,
      }));
    }
  }
  
  // Check if any advanced filters are active (beyond default date range)
  const hasNonDefaultDateFilter = period && period !== '30d'; // User explicitly changed from default
  const hasAdvancedFilters = itemCountMin || itemCountMax || categoryId || couponCode || 
    totalMin || totalMax || dateFrom || dateTo || shippingMethod || paymentMethod || city ||
    filterFinancialStatus || filterFulfillmentStatus || trafficSource || hasNonDefaultDateFilter || from || to;

  return (
    <div className="space-y-6">
      <PageHeader
        title="הזמנות"
        description={`${activeOrders.length} הזמנות פעילות${archivedCount > 0 ? ` • ${archivedCount} בארכיון` : ''}${hasAdvancedFilters ? ` • ${filteredOrders.length} תוצאות` : ''}`}
        actions={
          <div className="flex items-center gap-3">
            <DateRangePicker />
            <ExportOrdersButton storeSlug={slug} />
            <Button href={`/shops/${slug}/admin/orders/drafts/new`} variant="primary" icon="plus">
              צור הזמנה
            </Button>
          </div>
        }
      />
      
      {/* Advanced Filters */}
      <OrderFilters 
        categories={categoryOptions}
        couponCodes={couponCodes}
        shippingMethods={filterOptions.shippingMethods}
        paymentMethods={filterOptions.paymentMethods}
        cities={filterOptions.cities}
        trafficSources={filterOptions.trafficSources}
      />

      <OrdersDataTable
        orders={ordersWithUserNames}
        storeSlug={slug}
        tabs={tabs}
        currentTab={effectiveStatus}
        searchValue={search}
        sortOrder={sortOrder}
        pagination={{
          currentPage,
          totalPages,
          totalItems: sortedOrders.length,
          perPage,
        }}
        customStatuses={customStatuses}
        showCreatedBy={crmActive}
      />
    </div>
  );
}
