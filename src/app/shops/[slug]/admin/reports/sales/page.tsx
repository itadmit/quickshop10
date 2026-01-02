import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getStoreBySlug } from '@/lib/db/queries';
import { 
  getSalesOverview, 
  getSalesByDay, 
  getTopProducts,
  getSalesByCategory 
} from '@/lib/actions/reports';

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

// Sales Chart Component
function SalesChart({ data }: { data: Array<{ date: string; revenue: number; orders: number }> }) {
  if (!data.length) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        אין נתונים לתקופה זו
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  
  return (
    <div className="h-80">
      <div className="flex items-end gap-1 h-64">
        {data.map((day, i) => {
          const height = (day.revenue / maxRevenue) * 100;
          const date = new Date(day.date);
          const dayLabel = date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
          
          return (
            <div 
              key={i} 
              className="flex-1 flex flex-col items-center group cursor-pointer"
            >
              <div className="w-full relative flex-1 flex items-end">
                <div 
                  className="w-full bg-black/80 hover:bg-black transition-colors min-h-[2px] relative group"
                  style={{ height: `${Math.max(height, 1)}%` }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-black text-white text-xs px-2 py-1 whitespace-nowrap">
                      <div>{dayLabel}</div>
                      <div className="font-medium">{formatCurrency(day.revenue)}</div>
                      <div className="text-gray-300">{day.orders} הזמנות</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* X-axis labels */}
      <div className="flex gap-1 mt-2 h-16 overflow-hidden">
        {data.map((day, i) => {
          const date = new Date(day.date);
          const showLabel = data.length <= 31 || i % Math.ceil(data.length / 15) === 0;
          return (
            <div key={i} className="flex-1 text-center">
              {showLabel && (
                <span className="text-[10px] text-gray-400 whitespace-nowrap">
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

// Products Table
function ProductsTable({ 
  products 
}: { 
  products: Array<{ id: string; name: string; image: string | null; revenue: number; quantity: number; orders: number }> 
}) {
  if (!products.length) {
    return <p className="text-gray-500 text-center py-12">אין נתוני מוצרים לתקופה זו</p>;
  }

  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-right">
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">#</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">מוצר</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">הכנסות</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">יחידות</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">הזמנות</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">% מסה״כ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((product, i) => (
            <tr key={product.id} className="hover:bg-gray-50">
              <td className="py-3 px-4 text-gray-400">{i + 1}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-10 h-10 object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100" />
                  )}
                  <span className="font-medium">{product.name}</span>
                </div>
              </td>
              <td className="py-3 px-4 font-medium">{formatCurrency(product.revenue)}</td>
              <td className="py-3 px-4">{formatNumber(product.quantity)}</td>
              <td className="py-3 px-4">{formatNumber(product.orders)}</td>
              <td className="py-3 px-4 text-gray-500">
                {totalRevenue > 0 ? ((product.revenue / totalRevenue) * 100).toFixed(1) : 0}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
    return <p className="text-gray-500 text-center py-12">אין נתוני קטגוריות לתקופה זו</p>;
  }

  const totalRevenue = categories.reduce((sum, c) => sum + c.revenue, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-right">
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">קטגוריה</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">הכנסות</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">יחידות</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">הזמנות</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">% מסה״כ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {categories.map((category) => (
            <tr key={category.id} className="hover:bg-gray-50">
              <td className="py-3 px-4 font-medium">{category.name}</td>
              <td className="py-3 px-4 font-medium">{formatCurrency(category.revenue)}</td>
              <td className="py-3 px-4">{formatNumber(category.quantity)}</td>
              <td className="py-3 px-4">{formatNumber(category.orders)}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 max-w-20">
                    <div 
                      className="h-full bg-black"
                      style={{ width: `${totalRevenue > 0 ? (category.revenue / totalRevenue) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-gray-500 text-sm">
                    {totalRevenue > 0 ? ((category.revenue / totalRevenue) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Content Component
async function SalesContent({ storeId, period }: { storeId: string; period: '7d' | '30d' | '90d' }) {
  // Parallel data fetching
  const [overview, salesByDay, topProducts, salesByCategory] = await Promise.all([
    getSalesOverview(storeId, period),
    getSalesByDay(storeId, period),
    getTopProducts(storeId, period, 20),
    getSalesByCategory(storeId, period),
  ]);

  return (
    <>
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500">סה״כ הכנסות</p>
          <p className="text-2xl font-medium mt-1">{formatCurrency(overview.totalRevenue)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500">הזמנות</p>
          <p className="text-2xl font-medium mt-1">{formatNumber(overview.totalOrders)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500">ממוצע להזמנה</p>
          <p className="text-2xl font-medium mt-1">{formatCurrency(overview.averageOrderValue)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500">לקוחות חדשים</p>
          <p className="text-2xl font-medium mt-1">{formatNumber(overview.newCustomers)}</p>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h2 className="font-medium mb-4">מכירות לפי יום</h2>
        <SalesChart data={salesByDay} />
      </div>

      {/* Two columns: Products & Categories */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="font-medium mb-4">מוצרים מובילים</h2>
          <ProductsTable products={topProducts} />
        </div>

        {/* Categories */}
        <div className="bg-white border border-gray-200 p-6">
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
  searchParams: Promise<{ period?: string }>;
}) {
  const { slug } = await params;
  const { period: periodParam } = await searchParams;
  
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const period = (['7d', '30d', '90d'].includes(periodParam || '') 
    ? periodParam 
    : '30d') as '7d' | '30d' | '90d';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/shops/${slug}/admin/reports`}
            className="text-gray-400 hover:text-black"
          >
            ← חזרה
          </Link>
          <div>
            <h1 className="text-2xl font-medium">דוח מכירות</h1>
            <p className="text-gray-500 text-sm mt-1">ניתוח מכירות לפי תאריך, מוצר וקטגוריה</p>
          </div>
        </div>
        
        {/* Period Selector */}
        <div className="flex gap-1 bg-gray-100 p-1">
          {[
            { value: '7d', label: '7 ימים' },
            { value: '30d', label: '30 יום' },
            { value: '90d', label: '90 יום' },
          ].map((option) => (
            <Link
              key={option.value}
              href={`?period=${option.value}`}
              className={`px-4 py-2 text-sm transition-colors ${
                period === option.value
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <Suspense fallback={<TableSkeleton />}>
        <SalesContent storeId={store.id} period={period} />
      </Suspense>
    </div>
  );
}

