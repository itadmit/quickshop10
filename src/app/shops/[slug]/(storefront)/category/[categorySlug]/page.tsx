import { getStoreBySlug, getCategoryBySlug, getProductsByCategory, getSubcategories, getCategoryById, getCategoriesByStore, getFooterMenuItems, getProductsBadgesForCards } from '@/lib/db/queries';
import { getProductsAutomaticDiscounts } from '@/app/actions/automatic-discount';
import { isOutOfStock } from '@/lib/inventory';
import { getCategoryPageSettings } from '@/lib/category-page-settings';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { CategoryPageContent } from './category-page-content';
import type { Metadata } from 'next';
import { cache } from 'react';

// ISR - Revalidate every 60 seconds
export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{ slug: string; categorySlug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

// Cache store lookup for this request
const getStore = cache(async (slug: string) => {
  return getStoreBySlug(slug);
});

// Generate metadata for the category page (for SEO and Analytics)
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug, categorySlug } = await params;
  
  const store = await getStore(slug);
  if (!store) {
    return { title: 'קטגוריה לא נמצאה' };
  }

  const decodedCategorySlug = decodeURIComponent(categorySlug);
  const category = await getCategoryBySlug(store.id, decodedCategorySlug);
  
  if (!category) {
    return { title: 'קטגוריה לא נמצאה' };
  }

  // Build title: "קטגוריה | חנות"
  const title = `${category.name} | ${store.name}`;
  const description = category.description || `מוצרים בקטגוריית ${category.name} בחנות ${store.name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: category.imageUrl ? [{ url: category.imageUrl }] : undefined,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug, categorySlug } = await params;
  const { preview } = await searchParams;
  const isPreviewMode = preview === 'true';
  
  const store = await getStore(slug);
  
  if (!store) {
    notFound();
  }

  // Handle "sample" slug for editor preview - get first category
  let decodedCategorySlug = decodeURIComponent(categorySlug);
  if (decodedCategorySlug === 'sample') {
    const allCats = await getCategoriesByStore(store.id);
    if (allCats.length > 0) {
      decodedCategorySlug = allCats[0].slug;
    }
  }

  const category = await getCategoryBySlug(store.id, decodedCategorySlug);
  
  if (!category) {
    notFound();
  }

  // Fetch products, subcategories, parent category, all categories and footer menu in parallel ⚡
  const [rawProducts, subcategories, parentCategory, allCategories, footerMenuItems] = await Promise.all([
    getProductsByCategory(store.id, category.id),
    getSubcategories(store.id, category.id),
    category.parentId ? getCategoryById(category.parentId) : null,
    getCategoriesByStore(store.id),
    getFooterMenuItems(store.id),
  ]);

  // Apply out-of-stock display settings from category (with fallback for migration)
  const hideOutOfStock = (category as unknown as { hideOutOfStock?: boolean }).hideOutOfStock ?? false;
  const moveOutOfStockToBottom = (category as unknown as { moveOutOfStockToBottom?: boolean }).moveOutOfStockToBottom ?? true;
  
  // Helper to check if product is out of stock
  const checkOutOfStock = (p: typeof rawProducts[0]) => 
    isOutOfStock(p.trackInventory, p.inventory, p.allowBackorder);
  
  // Filter and sort products based on category settings
  let products = rawProducts;
  
  if (hideOutOfStock) {
    // Hide out-of-stock products completely
    products = rawProducts.filter(p => !checkOutOfStock(p));
  } else if (moveOutOfStockToBottom) {
    // Move out-of-stock products to the bottom
    const inStock = rawProducts.filter(p => !checkOutOfStock(p));
    const outOfStock = rawProducts.filter(p => checkOutOfStock(p));
    products = [...inStock, ...outOfStock];
  }

  // חישוב הנחות אוטומטיות לכל המוצרים (batch - שליפה אחת!) ⚡
  const [discountsMap, badgesMap] = await Promise.all([
    getProductsAutomaticDiscounts(
      store.id,
      products.map(p => ({ 
        id: p.id, 
        price: p.price, 
        categoryIds: [category.id] // המוצרים בקטגוריה הזו
      }))
    ),
    getProductsBadgesForCards(store.id, products.map(p => p.id)),
  ]);

  // Check for custom domain
  const headersList = await headers();
  const isCustomDomain = !!headersList.get('x-custom-domain');
  const basePath = isCustomDomain ? '' : `/shops/${slug}`;
  
  const hasSubcategories = subcategories.length > 0;
  const isSubcategory = !!category.parentId;
  
  // Get settings from store
  const storeSettings = (store.settings as Record<string, unknown>) || {};
  const showDecimalPrices = Boolean(storeSettings.showDecimalPrices);
  const categoryPageSettings = getCategoryPageSettings(storeSettings);

  // Prepare products data for ProductCard
  const productsData = products.map(product => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: Number(product.price),
    comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    image: product.image || '/placeholder.svg',
    cardImage: product.cardImage,
    cardVideoUrl: product.cardVideoUrl,
    isFeatured: product.isFeatured,
    inventory: product.inventory,
    trackInventory: product.trackInventory,
    allowBackorder: product.allowBackorder,
    hasVariants: product.hasVariants,
    automaticDiscount: discountsMap.get(product.id) || null,
    badges: badgesMap.get(product.id) || [],
  }));

  return (
    <CategoryPageContent
      category={{
        id: category.id,
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
        slug: category.slug,
      }}
      parentCategory={parentCategory ? {
        name: parentCategory.name,
        slug: parentCategory.slug,
      } : null}
      subcategories={subcategories.map(sub => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        imageUrl: sub.imageUrl,
      }))}
      products={productsData}
      hasSubcategories={hasSubcategories}
      isSubcategory={isSubcategory}
      basePath={basePath}
      showDecimalPrices={showDecimalPrices}
      initialSettings={categoryPageSettings}
      isPreviewMode={isPreviewMode}
      storeName={store.name}
      storeSlug={slug}
      logoUrl={store.logoUrl}
      allCategories={allCategories}
      footerMenuItems={footerMenuItems}
      storeSettings={storeSettings}
    />
  );
}
