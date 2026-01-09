import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getStoreBySlug } from '@/lib/db/queries';
import { 
  getInventoryStats,
  getLowStockProducts
} from '@/lib/actions/reports';
import { ReportHeader } from '@/components/admin/report-header';
import {
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  LightbulbIcon,
} from '@/components/admin/icons';

// Format helpers
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

// Inventory Stats Component
function InventoryStatsCards({ 
  stats 
}: { 
  stats: { totalProducts: number; totalInventory: number; lowStock: number; outOfStock: number; tracked: number } 
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-white border border-gray-200 p-6">
        <p className="text-sm text-gray-500">סה״כ מוצרים</p>
        <p className="text-2xl font-medium mt-1">{formatNumber(stats.totalProducts)}</p>
      </div>
      <div className="bg-white border border-gray-200 p-6">
        <p className="text-sm text-gray-500">יחידות במלאי</p>
        <p className="text-2xl font-medium mt-1">{formatNumber(stats.totalInventory)}</p>
      </div>
      <div className="bg-white border border-gray-200 p-6">
        <p className="text-sm text-gray-500">עוקבים מלאי</p>
        <p className="text-2xl font-medium mt-1">{formatNumber(stats.tracked)}</p>
      </div>
      <div className="bg-white border border-amber-200 p-6">
        <p className="text-sm text-amber-600">מלאי נמוך</p>
        <p className="text-2xl font-medium mt-1 text-amber-600">{formatNumber(stats.lowStock)}</p>
      </div>
      <div className="bg-white border border-red-200 p-6">
        <p className="text-sm text-red-600">אזל מהמלאי</p>
        <p className="text-2xl font-medium mt-1 text-red-600">{formatNumber(stats.outOfStock)}</p>
      </div>
    </div>
  );
}

// Low Stock Products Table
function LowStockTable({ 
  products,
  storeSlug
}: { 
  products: Array<{ 
    id: string; 
    name: string; 
    sku: string | null; 
    inventory: number | null; 
    image: string | null;
    isVariant?: boolean;
    variantTitle?: string | null;
  }>;
  storeSlug: string;
}) {
  if (!products.length) {
    return (
      <div className="text-center py-12 flex flex-col items-center gap-2">
        <CheckCircleIcon className="text-green-500" size={40} />
        <p className="text-gray-500">כל המוצרים במלאי תקין</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-right">
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">מוצר</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">מק״ט</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">מלאי</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">סטטוס</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">פעולות</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((product) => {
            const inventory = product.inventory || 0;
            const isOutOfStock = inventory === 0;
            
            return (
              <tr key={product.id} className="hover:bg-gray-50">
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
                    <div>
                      <span className="font-medium">{product.name}</span>
                      {product.isVariant && product.variantTitle && (
                        <p className="text-sm text-gray-500">{product.variantTitle}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-500">
                  {product.sku || '-'}
                </td>
                <td className="py-3 px-4">
                  <span className={`text-lg font-medium ${isOutOfStock ? 'text-red-600' : 'text-amber-600'}`}>
                    {inventory}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700">
                      <XCircleIcon size={12} /> אזל
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-amber-100 text-amber-700">
                      <AlertTriangleIcon size={12} /> נמוך
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <Link 
                    href={`/shops/${storeSlug}/admin/products/${product.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    עדכן מלאי
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Inventory Distribution Chart
function InventoryDistribution({ 
  stats 
}: { 
  stats: { totalProducts: number; lowStock: number; outOfStock: number; tracked: number } 
}) {
  const healthyStock = stats.tracked - stats.lowStock - stats.outOfStock;
  const untracked = stats.totalProducts - stats.tracked;
  
  const segments = [
    { label: 'מלאי תקין', count: healthyStock, color: 'bg-green-500', percentage: (healthyStock / stats.totalProducts) * 100 },
    { label: 'מלאי נמוך', count: stats.lowStock, color: 'bg-amber-500', percentage: (stats.lowStock / stats.totalProducts) * 100 },
    { label: 'אזל מהמלאי', count: stats.outOfStock, color: 'bg-red-500', percentage: (stats.outOfStock / stats.totalProducts) * 100 },
    { label: 'ללא מעקב', count: untracked, color: 'bg-gray-300', percentage: (untracked / stats.totalProducts) * 100 },
  ].filter(s => s.count > 0);

  return (
    <div>
      {/* Bar */}
      <div className="h-8 flex overflow-hidden rounded">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className={`${segment.color} transition-all duration-500`}
            style={{ width: `${segment.percentage}%` }}
            title={`${segment.label}: ${segment.count}`}
          />
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 ${segment.color}`} />
            <span className="text-sm text-gray-600">
              {segment.label}: {segment.count} ({segment.percentage.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Alerts Component
function InventoryAlerts({ 
  stats 
}: { 
  stats: { lowStock: number; outOfStock: number } 
}) {
  const hasAlerts = stats.lowStock > 0 || stats.outOfStock > 0;
  
  if (!hasAlerts) {
    return (
      <div className="bg-green-50 border border-green-200 p-6 flex items-start gap-4">
        <CheckCircleIcon className="text-green-500 flex-shrink-0" size={24} />
        <div>
          <h3 className="font-medium text-green-800">מצב מלאי תקין</h3>
          <p className="text-sm text-green-700 mt-1">
            כל המוצרים במלאי מספק, אין פריטים במצב קריטי.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stats.outOfStock > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 flex items-start gap-4">
          <XCircleIcon className="text-red-500 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-medium text-red-800">מוצרים אזלו מהמלאי</h3>
            <p className="text-sm text-red-700 mt-1">
              {stats.outOfStock} מוצרים אזלו לחלוטין ולא זמינים למכירה.
            </p>
          </div>
        </div>
      )}
      
      {stats.lowStock > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 flex items-start gap-4">
          <AlertTriangleIcon className="text-amber-500 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-medium text-amber-800">מלאי נמוך</h3>
            <p className="text-sm text-amber-700 mt-1">
              {stats.lowStock} מוצרים עם פחות מ-5 יחידות במלאי.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Content Component
async function InventoryContent({ storeId, storeSlug }: { storeId: string; storeSlug: string }) {
  // Parallel data fetching
  const [stats, lowStockProducts] = await Promise.all([
    getInventoryStats(storeId),
    getLowStockProducts(storeId, 5, 50),
  ]);

  // Separate out of stock from low stock
  const outOfStockProducts = lowStockProducts.filter(p => (p.inventory || 0) === 0);
  const lowProducts = lowStockProducts.filter(p => (p.inventory || 0) > 0);

  return (
    <>
      {/* Stats */}
      <InventoryStatsCards stats={stats} />

      {/* Alerts */}
      <div className="mt-8">
        <InventoryAlerts stats={stats} />
      </div>

      {/* Distribution Chart */}
      <div className="bg-white border border-gray-200 p-6 mt-8">
        <h2 className="font-medium mb-4">התפלגות מלאי</h2>
        <InventoryDistribution stats={stats} />
      </div>

      {/* Out of Stock Products */}
      {outOfStockProducts.length > 0 && (
        <div className="bg-white border border-red-200 p-6 mt-8">
          <div className="flex items-center gap-2 mb-4">
            <XCircleIcon className="text-red-500" size={20} />
            <h2 className="font-medium text-red-800">מוצרים שאזלו ({outOfStockProducts.length})</h2>
          </div>
          <LowStockTable products={outOfStockProducts} storeSlug={storeSlug} />
        </div>
      )}

      {/* Low Stock Products */}
      {lowProducts.length > 0 && (
        <div className="bg-white border border-amber-200 p-6 mt-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangleIcon className="text-amber-500" size={20} />
            <h2 className="font-medium text-amber-800">מוצרים במלאי נמוך ({lowProducts.length})</h2>
          </div>
          <LowStockTable products={lowProducts} storeSlug={storeSlug} />
        </div>
      )}

      {/* Tips */}
      <div className="bg-gray-50 border border-gray-200 p-6 mt-8">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <LightbulbIcon className="text-amber-500" size={18} />
          טיפים לניהול מלאי
        </h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• הגדר סף התראה למלאי נמוך בהגדרות החנות</li>
          <li>• עדכן מלאי באופן קבוע כדי למנוע מכירת יתר</li>
          <li>• שקול להשתמש באפשרות &quot;הזמנה מראש&quot; למוצרים פופולריים</li>
          <li>• צור התראות אוטומטיות (Webhook) כאשר מלאי יורד</li>
        </ul>
      </div>
    </>
  );
}

// Page Component
export default async function InventoryReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

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
            <h1 className="text-2xl font-medium">דוח מלאי</h1>
            <p className="text-gray-500 text-sm mt-1">רמות מלאי ומוצרים שדורשים תשומת לב</p>
          </div>
        </div>
        
        <Link 
          href={`/shops/${slug}/admin/products`}
          className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
        >
          נהל מוצרים
        </Link>
      </div>

      {/* Content */}
      <Suspense fallback={<TableSkeleton />}>
        <InventoryContent storeId={store.id} storeSlug={slug} />
      </Suspense>
    </div>
  );
}

