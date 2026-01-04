import { db } from '@/lib/db';
import { products, productVariants, productImages, categories } from '@/lib/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BulkEditTable } from './bulk-edit-table';

export const dynamic = 'force-dynamic';

interface BulkEditPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string; sort?: string }>;
}

async function getBulkEditData(storeId: string, categoryId?: string) {
  // Get products
  let query = db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      price: products.price,
      comparePrice: products.comparePrice,
      cost: products.cost,
      inventory: products.inventory,
      hasVariants: products.hasVariants,
      trackInventory: products.trackInventory,
      isActive: products.isActive,
      categoryId: products.categoryId,
    })
    .from(products)
    .where(eq(products.storeId, storeId))
    .orderBy(desc(products.createdAt));

  const productsData = await query;

  // Get variants
  const variantsData = await db
    .select({
      id: productVariants.id,
      productId: productVariants.productId,
      title: productVariants.title,
      sku: productVariants.sku,
      price: productVariants.price,
      comparePrice: productVariants.comparePrice,
      cost: productVariants.cost,
      inventory: productVariants.inventory,
      isActive: productVariants.isActive,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(products.storeId, storeId));

  // Get images
  const images = await db
    .select({
      productId: productImages.productId,
      url: productImages.url,
    })
    .from(productImages)
    .innerJoin(products, eq(productImages.productId, products.id))
    .where(eq(productImages.isPrimary, true));

  // Get categories
  const categoriesData = await db
    .select({
      id: categories.id,
      name: categories.name,
    })
    .from(categories)
    .where(eq(categories.storeId, storeId))
    .orderBy(asc(categories.name));

  const imageMap = new Map(images.map(img => [img.productId, img.url]));
  const categoryMap = new Map(categoriesData.map(c => [c.id, c.name]));

  // Build items list
  interface BulkEditItem {
    id: string;
    productId: string;
    productName: string;
    variantTitle: string | null;
    sku: string | null;
    price: string | null;
    comparePrice: string | null;
    cost: string | null;
    inventory: number;
    isActive: boolean;
    trackInventory: boolean;
    imageUrl: string | null;
    categoryName: string | null;
    isVariant: boolean;
  }

  const items: BulkEditItem[] = [];

  for (const product of productsData) {
    // Filter by category if specified
    if (categoryId && product.categoryId !== categoryId) continue;

    if (product.hasVariants) {
      // Add variants
      const productVariantsList = variantsData.filter(v => v.productId === product.id);
      for (const variant of productVariantsList) {
        items.push({
          id: variant.id,
          productId: product.id,
          productName: product.name,
          variantTitle: variant.title,
          sku: variant.sku || product.sku,
          price: variant.price,
          comparePrice: variant.comparePrice,
          cost: variant.cost,
          inventory: variant.inventory ?? 0,
          isActive: product.isActive && variant.isActive,
          trackInventory: product.trackInventory,
          imageUrl: imageMap.get(product.id) || null,
          categoryName: product.categoryId ? categoryMap.get(product.categoryId) || null : null,
          isVariant: true,
        });
      }
    } else {
      // Add product
      items.push({
        id: product.id,
        productId: product.id,
        productName: product.name,
        variantTitle: null,
        sku: product.sku,
        price: product.price,
        comparePrice: product.comparePrice,
        cost: product.cost,
        inventory: product.inventory ?? 0,
        isActive: product.isActive,
        trackInventory: product.trackInventory,
        imageUrl: imageMap.get(product.id) || null,
        categoryName: product.categoryId ? categoryMap.get(product.categoryId) || null : null,
        isVariant: false,
      });
    }
  }

  return { items, categories: categoriesData };
}

export default async function BulkEditPage({ params, searchParams }: BulkEditPageProps) {
  const { slug } = await params;
  const { category } = await searchParams;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const { items, categories: categoriesList } = await getBulkEditData(store.id, category);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">עריכה קבוצתית</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            ערוך מחירים, מלאי ו-SKU ישירות בטבלה • {items.length} פריטים
          </p>
        </div>
        <Link
          href={`/shops/${slug}/admin/products`}
          className="text-xs sm:text-sm text-gray-600 hover:text-gray-900"
        >
          ← חזרה למוצרים
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700">סנן לפי:</span>
          <Link
            href={`/shops/${slug}/admin/products/bulk-edit`}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              !category 
                ? 'bg-black text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            הכל
          </Link>
          {categoriesList.map(cat => (
            <Link
              key={cat.id}
              href={`/shops/${slug}/admin/products/bulk-edit?category=${cat.id}`}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                category === cat.id
                  ? 'bg-black text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Bulk Edit Table */}
      {items.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">אין מוצרים</h3>
          <p className="mt-1 text-sm text-gray-500">הוסף מוצרים לחנות כדי לערוך אותם</p>
        </div>
      ) : (
        <BulkEditTable items={items} storeSlug={slug} />
      )}

      {/* Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 טיפים</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• לחץ על כל תא כדי לערוך אותו ישירות</li>
          <li>• לחץ Enter לשמירה או Escape לביטול</li>
          <li>• השינויים נשמרים אוטומטית</li>
          <li>• מלאי נמוך (פחות מ-5) מסומן בכתום, אזל - באדום</li>
        </ul>
      </div>
    </div>
  );
}

