import { db } from '@/lib/db';
import { categories, products, productImages, productCategories, productVariants } from '@/lib/db/schema';
import { eq, and, asc, desc, inArray, sql } from 'drizzle-orm';
import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CategoryEditForm } from './category-edit-form';
import { ProductsReorderList } from './products-reorder-list';
import { PerPageSelector } from './per-page-selector';

export const dynamic = 'force-dynamic';

interface CategoryEditPageProps {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ perPage?: string }>;
}

async function getCategoryWithProducts(storeId: string, categoryId: string, perPage: number) {
  // Get the category
  const [category] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.storeId, storeId)))
    .limit(1);

  if (!category) return null;

  // Get all categories for parent selection
  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      parentId: categories.parentId,
    })
    .from(categories)
    .where(eq(categories.storeId, storeId))
    .orderBy(asc(categories.name));

  // Get products in this category with their sort order
  // Using productCategories junction table
  const categoryProductsRaw = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      inventory: products.inventory,
      trackInventory: products.trackInventory,
      hasVariants: products.hasVariants,
      isActive: products.isActive,
      sortOrder: productCategories.sortOrder,
      image: productImages.url,
    })
    .from(productCategories)
    .innerJoin(products, eq(productCategories.productId, products.id))
    .leftJoin(productImages, and(
      eq(productImages.productId, products.id),
      eq(productImages.isPrimary, true)
    ))
    .where(and(
      eq(productCategories.categoryId, categoryId),
      eq(products.storeId, storeId)
    ))
    .orderBy(asc(productCategories.sortOrder), desc(products.createdAt));

  // Remove duplicates (can happen if product has multiple primary images)
  const seenIds = new Set<string>();
  const categoryProducts = categoryProductsRaw.filter(p => {
    if (seenIds.has(p.id)) return false;
    seenIds.add(p.id);
    return true;
  }).slice(0, perPage);

  // Get variant prices for products with variants
  const variantProductIds = categoryProducts.filter(p => p.hasVariants).map(p => p.id);
  let variantPriceMap = new Map<string, string | null>();
  if (variantProductIds.length > 0) {
    const variantPrices = await db
      .select({
        productId: productVariants.productId,
        minPrice: sql<string>`MIN(${productVariants.price})`,
      })
      .from(productVariants)
      .where(inArray(productVariants.productId, variantProductIds))
      .groupBy(productVariants.productId);

    variantPriceMap = new Map(variantPrices.map(v => [v.productId, v.minPrice]));
  }

  // Map products with variant prices
  const productsWithPrices = categoryProducts.map(p => ({
    ...p,
    price: p.hasVariants ? (variantPriceMap.get(p.id) || p.price) : p.price,
  }));

  // Get total count
  const totalProducts = await db
    .select({ id: productCategories.productId })
    .from(productCategories)
    .innerJoin(products, eq(productCategories.productId, products.id))
    .where(and(
      eq(productCategories.categoryId, categoryId),
      eq(products.storeId, storeId)
    ));

  return {
    category,
    allCategories,
    products: productsWithPrices,
    totalProducts: totalProducts.length,
  };
}

export default async function CategoryEditPage({ params, searchParams }: CategoryEditPageProps) {
  const { slug, id } = await params;
  const { perPage: perPageParam } = await searchParams;
  
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const perPage = parseInt(perPageParam || '20', 10);
  const validPerPage = [20, 50, 100, 200].includes(perPage) ? perPage : 20;

  const data = await getCategoryWithProducts(store.id, id, validPerPage);

  if (!data) {
    notFound();
  }

  const { category, allCategories, products: categoryProducts, totalProducts } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/shops/${slug}/admin/categories`}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">עריכת קטגוריה</h1>
            <p className="text-sm text-gray-500 mt-0.5">{category.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Edit Form - Right Side */}
        <div className="col-span-5">
          <CategoryEditForm
            category={category}
            allCategories={allCategories}
            storeId={store.id}
            storeSlug={slug}
          />
        </div>

        {/* Products List - Left Side */}
        <div className="col-span-7">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">מוצרים בקטגוריה</h2>
                <p className="text-xs text-gray-500 mt-0.5">{totalProducts} מוצרים • גרור לשינוי סדר</p>
              </div>
              
              {/* Per Page Selector */}
              <PerPageSelector currentValue={validPerPage} />
            </div>

            <ProductsReorderList
              products={categoryProducts}
              categoryId={id}
              storeSlug={slug}
              totalProducts={totalProducts}
              perPage={validPerPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

