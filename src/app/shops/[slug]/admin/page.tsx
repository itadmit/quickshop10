import { getStoreBySlug, getStoreOrders, getStoreProducts } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  PackageIcon, 
  TruckIcon, 
  AlertTriangleIcon,
  ShoppingCartIcon,
  TagIcon,
  SettingsIcon,
  PlusIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  CalendarIcon,
} from '@/components/admin/icons';

interface AdminPageProps {
  params: Promise<{ slug: string }>;
}

// ============================================
// Helper Functions
// ============================================

function formatCurrency(value: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('he-IL').format(value);
}

function formatDate(): string {
  return new Date().toLocaleDateString('he-IL', { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

function getRevenueByDay(orders: { createdAt: Date | null; total: string; financialStatus: string | null }[], days = 14) {
  const data: Array<{ date: string; revenue: number; orders: number }> = [];
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  
  // Only include paid orders in revenue calculations
  const paidOrders = orders.filter(o => o.financialStatus === 'paid');
  
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayOrders = paidOrders.filter(order => {
      if (!order.createdAt) return false;
      const date = new Date(order.createdAt);
      return date >= dayStart && date <= dayEnd;
    });
    
    data.push({
      date: dayStart.toISOString().split('T')[0],
      revenue: dayOrders.reduce((sum, o) => sum + Number(o.total), 0),
      orders: dayOrders.length,
    });
  }
  return data;
}

// ============================================
// Components
// ============================================

function StatCard({ 
  label, 
  value, 
  subLabel,
  icon,
}: { 
  label: string;
  value: string | number;
  subLabel?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-gray-500 truncate">{label}</p>
          <p className="text-lg sm:text-2xl font-semibold mt-1 truncate">
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
          {subLabel && (
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{subLabel}</p>
          )}
        </div>
        {icon && (
          <span className="text-gray-400 hidden sm:block">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

function AlertItem({ 
  label, 
  value, 
  subLabel,
  href,
  icon,
}: { 
  label: string;
  value: number;
  subLabel: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-amber-50 rounded-xl border border-amber-200 hover:border-amber-300 transition-colors"
    >
      <span className="text-amber-500 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-amber-800 truncate">{label}</p>
        <p className="text-[10px] sm:text-xs text-amber-600">{subLabel}</p>
      </div>
      <span className="text-xl sm:text-2xl font-semibold text-amber-600">{value}</span>
    </Link>
  );
}

function SalesChart({ data }: { data: Array<{ date: string; revenue: number; orders: number }> }) {
  if (!data.length) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-500">
        אין נתונים לתקופה זו
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  
  return (
    <div className="h-40">
      <div className="h-32 flex items-end gap-1">
        {data.map((day, i) => {
          const heightPercent = (day.revenue / maxRevenue) * 100;
          const date = new Date(day.date);
          const dayLabel = date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
          
          return (
            <div 
              key={i} 
              className="flex-1 group relative"
              style={{ height: '100%' }}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                  <div className="font-medium">{dayLabel}</div>
                  <div>{formatCurrency(day.revenue)}</div>
                  <div className="text-gray-400">{day.orders} הזמנות</div>
                </div>
              </div>
              
              {/* Bar */}
              <div className="absolute bottom-0 left-0 right-0 flex items-end h-full">
                <div 
                  className="w-full bg-gray-900 hover:bg-gray-700 transition-colors rounded-t"
                  style={{ height: `${Math.max(heightPercent, 3)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* X-axis labels */}
      <div className="h-8 flex gap-1 mt-1">
        {data.map((day, i) => {
          const date = new Date(day.date);
          const showLabel = i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2);
          return (
            <div key={i} className="flex-1 text-center overflow-hidden">
              {showLabel && (
                <span className="text-[10px] text-gray-400">
                  {date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentOrdersList({ orders, storeSlug }: { 
  orders: Array<{ 
    id: string; 
    orderNumber: string; 
    total: string; 
    status: string;
    financialStatus: string | null;
    fulfillmentStatus: string | null;
    createdAt: Date | null;
    customer?: { firstName: string | null; lastName: string | null; email: string } | null;
  }>; 
  storeSlug: string;
}) {
  if (!orders.length) {
    return <p className="text-gray-500 text-center py-8">אין הזמנות ששולמו</p>;
  }

  const fulfillmentLabels: Record<string, string> = {
    unfulfilled: 'ממתין למשלוח',
    fulfilled: 'נשלח',
    partial: 'חלקי',
  };

  return (
    <div className="divide-y divide-gray-100">
      {orders.slice(0, 5).map((order) => (
        <Link 
          key={order.id} 
          href={`/shops/${storeSlug}/admin/orders/${order.id}`}
          className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-5 px-5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <ShoppingCartIcon size={16} />
            </div>
            <div>
              <p className="font-medium text-sm">#{order.orderNumber}</p>
              <p className="text-xs text-gray-500">
                {order.customer?.firstName || order.customer?.lastName
                  ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim()
                  : order.customer?.email || 'אורח'}
              </p>
            </div>
          </div>
          <div className="text-left">
            <p className="font-medium text-sm">{formatCurrency(Number(order.total))}</p>
            <p className={`text-xs ${
              order.fulfillmentStatus === 'fulfilled' ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {fulfillmentLabels[order.fulfillmentStatus || 'unfulfilled']}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function TopProductsList({ products, storeSlug }: { 
  products: Array<{ 
    id: string; 
    name: string; 
    image?: string | null;
    price: string | null;
  }>; 
  storeSlug: string;
}) {
  if (!products.length) {
    return <p className="text-gray-500 text-center py-8">אין מוצרים</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {products.slice(0, 5).map((product, i) => (
        <Link 
          key={product.id}
          href={`/shops/${storeSlug}/admin/products/${product.id}`}
          className="flex items-center gap-3 py-3 hover:bg-gray-50 -mx-5 px-5 transition-colors"
        >
          <span className="text-gray-400 text-sm w-4">{i + 1}</span>
          {product.image ? (
            <Image 
              src={product.image} 
              alt={product.name}
              width={36}
              height={36}
              className="w-9 h-9 object-cover bg-gray-100"
            />
          ) : (
            <div className="w-9 h-9 bg-gray-100 flex items-center justify-center text-gray-400">
              <PackageIcon size={14} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{product.name}</p>
          </div>
          <span className="text-gray-600 text-sm">{formatCurrency(Number(product.price || 0))}</span>
        </Link>
      ))}
    </div>
  );
}

function QuickActionCard({ 
  title, 
  href, 
  icon,
  description 
}: { 
  title: string; 
  href: string; 
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-400 transition-colors group"
    >
      <span className="text-gray-400 group-hover:text-gray-600 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{title}</h3>
        <p className="text-xs text-gray-500 truncate hidden sm:block">{description}</p>
      </div>
      <ArrowLeftIcon className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" size={16} />
    </Link>
  );
}

// ============================================
// Main Dashboard Page - Server Component
// ============================================

export default async function AdminDashboardPage({ params }: AdminPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Fetch all data in parallel ⚡
  const [orders, products] = await Promise.all([
    getStoreOrders(store.id),
    getStoreProducts(store.id),
  ]);

  // Calculate today's metrics - only count PAID orders
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayOrders = orders.filter(o => {
    if (!o.createdAt) return false;
    // Only count paid orders
    if (o.financialStatus !== 'paid') return false;
    return new Date(o.createdAt) >= today;
  });
  const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const todayOrdersCount = todayOrders.length;
  
  // Calculate monthly metrics - only count PAID orders
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  
  const monthlyOrders = orders.filter(o => {
    if (!o.createdAt) return false;
    // Only count paid orders
    if (o.financialStatus !== 'paid') return false;
    return new Date(o.createdAt) >= thisMonth;
  });
  const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + Number(o.total), 0);
  
  const pendingOrders = orders.filter(o => 
    o.fulfillmentStatus === 'unfulfilled' && o.status !== 'cancelled'
  ).length;
  
  const lowStockProducts = products.filter(p => 
    p.trackInventory && p.inventory !== null && p.inventory <= 5 && p.inventory > 0
  ).length;

  const outOfStockProducts = products.filter(p => 
    p.trackInventory && (p.inventory === null || p.inventory === 0)
  ).length;

  // Chart data
  const salesByDay = getRevenueByDay(orders, 14);

  // Has alerts
  const hasAlerts = pendingOrders > 0 || lowStockProducts > 0 || outOfStockProducts > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-medium">שלום, {store.name}</h1>
        <p className="text-gray-500 text-sm mt-1">{formatDate()}</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="מכירות היום"
          value={formatCurrency(todaySales)}
          subLabel={todayOrdersCount > 0 ? `${todayOrdersCount} הזמנות` : undefined}
          icon={<CalendarIcon size={20} />}
        />
        <StatCard
          label="הזמנות היום"
          value={todayOrdersCount}
          icon={<ShoppingCartIcon size={20} />}
        />
        <StatCard
          label="מכירות חודשיות"
          value={formatCurrency(monthlyRevenue)}
          subLabel={`${monthlyOrders.length} הזמנות`}
          icon={<ChartBarIcon size={20} />}
        />
        <StatCard
          label="מוצרים"
          value={products.length}
          subLabel="בקטלוג"
          icon={<PackageIcon size={20} />}
        />
      </div>

      {/* Main Content Grid - Sales Chart + Orders */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
        {/* Sales Chart + Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">מכירות - 14 יום אחרונים</h3>
            <Link href={`/shops/${slug}/admin/reports`} className="text-sm text-gray-500 hover:text-gray-900">
              כל הדוחות ←
            </Link>
          </div>
          <SalesChart data={salesByDay} />
          
          {/* Alerts inside the box */}
          {hasAlerts && (
            <div className="mt-5 pt-5 border-t border-gray-200 space-y-3">
              {pendingOrders > 0 && (
                <AlertItem
                  label="ממתינות למשלוח"
                  value={pendingOrders}
                  subLabel="הזמנות"
                  href={`/shops/${slug}/admin/orders?status=unfulfilled`}
                  icon={<TruckIcon size={20} />}
                />
              )}
              {outOfStockProducts > 0 && (
                <AlertItem
                  label="אזל מהמלאי"
                  value={outOfStockProducts}
                  subLabel="מוצרים"
                  href={`/shops/${slug}/admin/products?status=out_of_stock`}
                  icon={<AlertTriangleIcon size={20} />}
                />
              )}
              {lowStockProducts > 0 && (
                <AlertItem
                  label="מלאי נמוך"
                  value={lowStockProducts}
                  subLabel="מוצרים"
                  href={`/shops/${slug}/admin/products?status=low_stock`}
                  icon={<AlertTriangleIcon size={20} />}
                />
              )}
            </div>
          )}
        </div>

        {/* Recent Orders - Paid Orders Only */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">הזמנות אחרונות</h3>
            <Link href={`/shops/${slug}/admin/orders`} className="text-xs sm:text-sm text-gray-500 hover:text-gray-900">
              כל ההזמנות ←
            </Link>
          </div>
          <RecentOrdersList 
            orders={orders.filter(o => o.financialStatus === 'paid')} 
            storeSlug={slug} 
          />
        </div>
      </div>

      {/* Second Row - Products + Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">מוצרים מובילים</h3>
            <Link href={`/shops/${slug}/admin/products`} className="text-xs sm:text-sm text-gray-500 hover:text-gray-900">
              כל המוצרים ←
            </Link>
          </div>
          <TopProductsList products={products} storeSlug={slug} />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <h3 className="font-medium mb-4">פעולות מהירות</h3>
          <div className="space-y-2 sm:space-y-3">
            <QuickActionCard
              title="הוסף מוצר"
              href={`/shops/${slug}/admin/products/new`}
              icon={<PlusIcon size={20} />}
              description="מוצר חדש לחנות"
            />
            <QuickActionCard
              title="צור הזמנה"
              href={`/shops/${slug}/admin/orders/drafts/new`}
              icon={<ShoppingCartIcon size={20} />}
              description="הזמנה ידנית"
            />
            <QuickActionCard
              title="צור קופון"
              href={`/shops/${slug}/admin/discounts`}
              icon={<TagIcon size={20} />}
              description="הנחה או קוד"
            />
            <QuickActionCard
              title="הגדרות"
              href={`/shops/${slug}/admin/settings`}
              icon={<SettingsIcon size={20} />}
              description="הגדרות החנות"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
