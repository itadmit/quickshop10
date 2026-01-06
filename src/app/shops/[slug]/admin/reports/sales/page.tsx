import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getStoreBySlug } from '@/lib/db/queries';
import { 
  getSalesOverview, 
  getSalesByDay, 
  getTopProducts,
  getSalesByCategory,
  getRecentOrders 
} from '@/lib/actions/reports';
import { ReportHeader, getReportPeriodParams } from '@/components/admin/report-header';

// Format helpers
function formatCurrency(value: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('he-IL').format(value);
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'numeric',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Loading skeleton
function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-100 mb-2" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 bg-gray-50 mb-1" />
      ))}
    </div>
  );
}

// Status badges
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };

  const labels: Record<string, string> = {
    pending: 'ממתין',
    confirmed: 'אושר',
    processing: 'בטיפול',
    completed: 'הושלם',
    shipped: 'נשלח',
    delivered: 'נמסר',
    cancelled: 'בוטל',
    refunded: 'הוחזר',
  };

  return (
    <span className={`px-2 py-0.5 text-xs rounded ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

// Sales Chart Component
function SalesChart({ data }: { data: Array<{ date: string; revenue: number; orders: number }> }) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        אין נתונים לתקופה זו
      </div>
    );
  }

  // Check if data is by hour (contains time in date string)
  const isByHour = data[0]?.date.includes(' ') && data[0]?.date.includes(':');

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  
  return (
    <div className="h-64">
      <div className="flex items-end gap-0.5 h-52">
        {data.map((day, i) => {
          const height = (day.revenue / maxRevenue) * 100;
          
          // Format label based on whether it's by hour or by day
          let label = '';
          if (isByHour) {
            // Extract hour from date string (format: YYYY-MM-DD HH:00:00)
            const hourMatch = day.date.match(/\s(\d{2}):/);
            const hour = hourMatch ? parseInt(hourMatch[1]) : 0;
            label = `${hour}:00`;
          } else {
          const date = new Date(day.date);
            label = date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
          }
          
          return (
            <div 
              key={i} 
              className="flex-1 group relative"
              style={{ height: '100%' }}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                <div className="bg-black text-white text-xs px-3 py-2 rounded shadow-lg whitespace-nowrap">
                  <div className="font-medium">{label}</div>
                  <div>{formatCurrency(day.revenue)}</div>
                  <div className="text-gray-300">{day.orders} הזמנות</div>
                </div>
              </div>
              
              {/* Bar */}
              <div className="absolute bottom-0 left-0 right-0 flex items-end h-full">
                <div 
                  className="w-full bg-black hover:bg-gray-700 transition-colors rounded-t-sm"
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* X-axis labels */}
      <div className="h-12 flex gap-0.5 mt-1 overflow-hidden">
        {data.map((day, i) => {
          // For hours: show every 3 hours (0, 3, 6, 9, 12, 15, 18, 21)
          // For days: show based on data length
          const showLabel = isByHour
            ? i % 3 === 0 // Show every 3 hours
            : data.length <= 14 || i % Math.ceil(data.length / 10) === 0;
          
          let label = '';
          if (isByHour) {
            // Extract hour from date string (format: YYYY-MM-DD HH:00:00)
            const hourMatch = day.date.match(/\s(\d{2}):/);
            const hour = hourMatch ? parseInt(hourMatch[1]) : 0;
            label = `${hour}:00`;
          } else {
          const date = new Date(day.date);
            label = date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
          }
          
          return (
            <div key={i} className="flex-1 text-center">
              {showLabel && (
                <span className="text-[9px] text-gray-400">
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Orders Table
function OrdersTable({ 
  orders,
  storeSlug
}: { 
  orders: Array<{ 
    id: string; 
    orderNumber: string; 
    customerName: string | null;
    customerEmail: string | null;
    total: number; 
    status: string;
    discountCode: string | null;
    discountAmount: number;
    shippingAmount: number;
    createdAt: Date;
    itemsCount: number;
  }>;
  storeSlug: string;
}) {
  if (!orders.length) {
    return <p className="text-gray-500 text-center py-12">אין הזמנות לתקופה זו</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-right">
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">מספר הזמנה</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">לקוח</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">סכום</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">פריטים</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">קופון</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">סטטוס</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">תאריך</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="py-3 px-4">
                <Link 
                  href={`/shops/${storeSlug}/admin/orders/${order.id}`}
                  className="font-medium text-black hover:underline"
                >
                  #{order.orderNumber}
                </Link>
              </td>
              <td className="py-3 px-4">
                <div>
                  <p className="font-medium">{order.customerName || '-'}</p>
                  <p className="text-xs text-gray-500">{order.customerEmail}</p>
                </div>
              </td>
              <td className="py-3 px-4 font-medium">{formatCurrency(order.total)}</td>
              <td className="py-3 px-4">{order.itemsCount}</td>
              <td className="py-3 px-4">
                {order.discountCode ? (
                  <div>
                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{order.discountCode}</code>
                    <p className="text-xs text-green-600 mt-0.5">-{formatCurrency(order.discountAmount)}</p>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="py-3 px-4">
                <StatusBadge status={order.status} />
              </td>
              <td className="py-3 px-4 text-sm text-gray-500">
                {formatDate(order.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Products Table
function ProductsTable({ 
  products 
}: { 
  products: Array<{ id: string; name: string; image: string | null; revenue: number; quantity: number; orders: number }> 
}) {
  if (!products.length) {
    return <p className="text-gray-500 text-center py-8">אין נתוני מוצרים לתקופה זו</p>;
  }

  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);

  return (
    <div className="divide-y divide-gray-100">
      {products.slice(0, 10).map((product, i) => (
        <div key={product.id} className="flex items-center gap-4 py-3">
          <span className="text-gray-400 text-sm w-4">{i + 1}</span>
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name}
              className="w-10 h-10 object-cover bg-gray-100"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-100" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{product.name}</p>
            <p className="text-xs text-gray-500">{product.quantity} יחידות • {product.orders} הזמנות</p>
          </div>
          <div className="text-left">
            <p className="font-medium">{formatCurrency(product.revenue)}</p>
            <p className="text-xs text-gray-500">
              {totalRevenue > 0 ? ((product.revenue / totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Categories Table
function CategoriesTable({ 
  categories 
}: { 
  categories: Array<{ id: string; name: string; revenue: number; quantity: number; orders: number }> 
}) {
  if (!categories.length) {
    return <p className="text-gray-500 text-center py-8">אין נתוני קטגוריות לתקופה זו</p>;
  }

  const totalRevenue = categories.reduce((sum, c) => sum + c.revenue, 0);

  return (
    <div className="divide-y divide-gray-100">
      {categories.map((category) => (
        <div key={category.id} className="py-3">
          <div className="flex justify-between mb-1">
            <span className="font-medium">{category.name}</span>
            <span className="font-medium">{formatCurrency(category.revenue)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-black"
                style={{ width: `${totalRevenue > 0 ? (category.revenue / totalRevenue) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-12 text-left">
              {totalRevenue > 0 ? ((category.revenue / totalRevenue) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{category.quantity} יחידות • {category.orders} הזמנות</p>
        </div>
      ))}
    </div>
  );
}

// Content Component
async function SalesContent({ 
  storeId, 
  storeSlug, 
  period,
  customRange 
}: { 
  storeId: string; 
  storeSlug: string; 
  period: '7d' | '30d' | '90d' | 'custom';
  customRange?: { from: Date; to: Date };
}) {
  // Parallel data fetching
  const [overview, salesByDay, topProducts, salesByCategory, recentOrders] = await Promise.all([
    getSalesOverview(storeId, period, customRange),
    getSalesByDay(storeId, period, customRange),
    getTopProducts(storeId, period, 20, customRange),
    getSalesByCategory(storeId, period, customRange),
    getRecentOrders(storeId, period, customRange),
  ]);

  return (
    <>
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <p className="text-sm text-gray-500">סה״כ הכנסות</p>
          <p className="text-xl sm:text-2xl font-medium mt-1">{formatCurrency(overview.totalRevenue)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <p className="text-sm text-gray-500">הזמנות</p>
          <p className="text-xl sm:text-2xl font-medium mt-1">{formatNumber(overview.totalOrders)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <p className="text-sm text-gray-500">ממוצע להזמנה</p>
          <p className="text-xl sm:text-2xl font-medium mt-1">{formatCurrency(overview.averageOrderValue)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <p className="text-sm text-gray-500">לקוחות חדשים</p>
          <p className="text-xl sm:text-2xl font-medium mt-1">{formatNumber(overview.newCustomers)}</p>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white border border-gray-200 p-4 sm:p-6 mb-6">
        <h2 className="font-medium mb-4">מכירות לפי יום</h2>
        <SalesChart data={salesByDay} />
      </div>

      {/* Orders List */}
      <div className="bg-white border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">הזמנות אחרונות</h2>
          <Link 
            href={`/shops/${storeSlug}/admin/orders`}
            className="text-sm text-gray-500 hover:text-black"
          >
            כל ההזמנות ←
          </Link>
        </div>
        <OrdersTable orders={recentOrders} storeSlug={storeSlug} />
      </div>

      {/* Two columns: Products & Categories */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <h2 className="font-medium mb-4">מוצרים מובילים</h2>
          <ProductsTable products={topProducts} />
        </div>

        {/* Categories */}
        <div className="bg-white border border-gray-200 p-4 sm:p-6">
          <h2 className="font-medium mb-4">מכירות לפי קטגוריה</h2>
          <CategoriesTable categories={salesByCategory} />
        </div>
      </div>
    </>
  );
}

// Page Component
export default async function SalesReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const { period, customRange } = getReportPeriodParams(resolvedSearchParams);

  return (
    <div>
      <ReportHeader
        title="דוח מכירות"
        description="ניתוח מכירות לפי תאריך, מוצר וקטגוריה"
        storeSlug={slug}
        backHref={`/shops/${slug}/admin/reports`}
      />

      <Suspense fallback={<TableSkeleton />}>
        <SalesContent storeId={store.id} storeSlug={slug} period={period} customRange={customRange} />
      </Suspense>
    </div>
  );
}
