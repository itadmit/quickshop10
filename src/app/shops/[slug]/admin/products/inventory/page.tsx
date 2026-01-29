import { db } from '@/lib/db';
import { products, productVariants, productImages } from '@/lib/db/schema';
import { eq, and, lte, asc, or } from 'drizzle-orm';
import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { InlineInventoryEditor } from './inline-inventory-editor';
import { InventoryHistoryModal } from './inventory-history-modal';
import { WaitlistAlerts } from './waitlist-alerts';
import { getWaitlistSummary } from './waitlist-queries';

export const dynamic = 'force-dynamic';

interface InventoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string }>;
}

async function getInventoryData(storeId: string, filter: string = 'all') {
  // Get products with inventory tracking
  const productsData = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      inventory: products.inventory,
      hasVariants: products.hasVariants,
      trackInventory: products.trackInventory,
      isActive: products.isActive,
    })
    .from(products)
    .where(and(
      eq(products.storeId, storeId),
      eq(products.trackInventory, true)
    ))
    .orderBy(asc(products.inventory));

  // Get variants
  const variantsData = await db
    .select({
      id: productVariants.id,
      productId: productVariants.productId,
      title: productVariants.title,
      sku: productVariants.sku,
      inventory: productVariants.inventory,
      isActive: productVariants.isActive,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(and(
      eq(products.storeId, storeId),
      eq(products.trackInventory, true)
    ))
    .orderBy(asc(productVariants.inventory));

  // Get images for products
  const images = await db
    .select({
      productId: productImages.productId,
      url: productImages.url,
    })
    .from(productImages)
    .innerJoin(products, eq(productImages.productId, products.id))
    .where(and(
      eq(products.storeId, storeId),
      eq(productImages.isPrimary, true)
    ));

  const imageMap = new Map(images.map(img => [img.productId, img.url]));

  // Build inventory items
  const inventoryItems: InventoryItem[] = [];

  for (const product of productsData) {
    if (product.hasVariants) {
      // Add variants
      const productVariantsList = variantsData.filter(v => v.productId === product.id);
      for (const variant of productVariantsList) {
        inventoryItems.push({
          id: variant.id,
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          variantTitle: variant.title,
          sku: variant.sku || product.sku,
          inventory: variant.inventory ?? 0,
          imageUrl: imageMap.get(product.id) || null,
          isActive: product.isActive && variant.isActive,
          isVariant: true,
        });
      }
    } else {
      // Add product
      inventoryItems.push({
        id: product.id,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        variantTitle: null,
        sku: product.sku,
        inventory: product.inventory ?? 0,
        imageUrl: imageMap.get(product.id) || null,
        isActive: product.isActive,
        isVariant: false,
      });
    }
  }

  // Apply filter
  let filtered = inventoryItems;
  if (filter === 'low') {
    filtered = inventoryItems.filter(item => item.inventory > 0 && item.inventory <= 5);
  } else if (filter === 'out') {
    filtered = inventoryItems.filter(item => item.inventory === 0);
  }

  // Stats
  const stats = {
    total: inventoryItems.length,
    lowStock: inventoryItems.filter(item => item.inventory > 0 && item.inventory <= 5).length,
    outOfStock: inventoryItems.filter(item => item.inventory === 0).length,
  };

  return { items: filtered, stats };
}

interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantTitle: string | null;
  sku: string | null;
  inventory: number;
  imageUrl: string | null;
  isActive: boolean;
  isVariant: boolean;
}

export default async function InventoryPage({ params, searchParams }: InventoryPageProps) {
  const { slug } = await params;
  const { filter = 'all' } = await searchParams;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const { items, stats } = await getInventoryData(store.id, filter);
  const waitlistSummary = await getWaitlistSummary(store.id);
  const basePath = `/shops/${slug}`;

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">ניהול מלאי</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {stats.total} מוצרים עם מעקב מלאי
          </p>
        </div>
        <Link
          href={`/shops/${slug}/admin/products`}
          className="text-xs sm:text-sm text-gray-600 hover:text-gray-900"
        >
          → חזרה למוצרים
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Link
          href={`/shops/${slug}/admin/products/inventory?filter=all`}
          className={`bg-white border rounded-lg p-2.5 sm:p-4 transition-colors ${
            filter === 'all' ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-[10px] sm:text-sm text-gray-500">כל המוצרים</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{stats.total}</p>
        </Link>
        <Link
          href={`/shops/${slug}/admin/products/inventory?filter=low`}
          className={`bg-white border rounded-lg p-2.5 sm:p-4 transition-colors ${
            filter === 'low' ? 'border-amber-500 ring-1 ring-amber-500' : 'border-gray-200 hover:border-amber-300'
          }`}
        >
          <p className="text-[10px] sm:text-sm text-amber-600">מלאי נמוך</p>

      {/* Waitlist Alerts */}
      {waitlistSummary.length > 0 && (
        <WaitlistAlerts
          items={waitlistSummary}
          storeId={store.id}
          storeSlug={slug}
          basePath={basePath}
        />
      )}

          <p className="text-lg sm:text-2xl font-bold text-amber-600 mt-0.5 sm:mt-1">{stats.lowStock}</p>
        </Link>
        <Link
          href={`/shops/${slug}/admin/products/inventory?filter=out`}
          className={`bg-white border rounded-lg p-2.5 sm:p-4 transition-colors ${
            filter === 'out' ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 hover:border-red-300'
          }`}
        >
          <p className="text-[10px] sm:text-sm text-red-600">אזל מהמלאי</p>
          <p className="text-lg sm:text-2xl font-bold text-red-600 mt-0.5 sm:mt-1">{stats.outOfStock}</p>
        </Link>
      </div>

      {/* Inventory Table */}
      {items.length === 0 ? (
        <div className="text-center py-8 sm:py-16 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-medium text-gray-900">אין פריטים</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            {filter === 'low' && 'אין מוצרים עם מלאי נמוך'}
            {filter === 'out' && 'אין מוצרים שאזלו מהמלאי'}
            {filter === 'all' && 'אין מוצרים עם מעקב מלאי'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">מוצר</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">מק״ט</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">מלאי נוכחי</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        {item.variantTitle && (
                          <p className="text-sm text-gray-500">{item.variantTitle}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {item.sku ? (
                      <code className="text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                        {item.sku}
                      </code>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <InlineInventoryEditor
                      itemId={item.id}
                      currentInventory={item.inventory}
                      isVariant={item.isVariant}
                      lowStockThreshold={5}
                    />
                  </td>
                  <td className="py-4 px-4 text-center">
                    {item.inventory === 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        אזל
                      </span>
                    ) : item.inventory <= 5 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        נמוך
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        תקין
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1">
                      <InventoryHistoryModal
                        itemId={item.id}
                        itemName={item.variantTitle ? `${item.productName} - ${item.variantTitle}` : item.productName}
                        isVariant={item.isVariant}
                      />
                      <Link
                        href={`/shops/${slug}/admin/products/${item.productId}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="ערוך מוצר"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        ערוך
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Help */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">רמות מלאי</h3>
        <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
          <li>• <span className="text-green-600 font-medium">תקין</span> - מעל 5 יחידות</li>
          <li>• <span className="text-amber-600 font-medium">נמוך</span> - 1-5 יחידות (מומלץ להזמין מלאי)</li>
          <li>• <span className="text-red-600 font-medium">אזל</span> - 0 יחידות (לא ניתן לרכוש)</li>
        </ul>
      </div>
    </div>
  );
}

