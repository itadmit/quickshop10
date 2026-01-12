import { db } from './index';
import { products, productImages, categories, stores, productOptions, productOptionValues, productVariants, productCategories, orders, orderItems, customers, users, menus, menuItems, pages, productAddonAssignments, productAddons } from './schema';
import { eq, and, desc, asc, inArray, sql } from 'drizzle-orm';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

// ============ STORE ============

// React cache for request deduplication
export const getStoreBySlug = cache(async (slug: string) => {
  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);
  return store;
});

// For demo: get the first store - CACHED
// React cache() deduplicates multiple calls in the same request
// unstable_cache() caches across requests with revalidation
export const getDemoStore = cache(async () => {
  const [store] = await db
    .select()
    .from(stores)
    .limit(1);
  return store;
});

// Cached version for header/layout - survives across requests
export const getDemoStoreCached = unstable_cache(
  async () => {
    const [store] = await db
      .select()
      .from(stores)
      .limit(1);
    return store;
  },
  ['demo-store'],
  { revalidate: 3600, tags: ['store'] } // Cache for 1 hour
);

// ============ CATEGORIES ============

// React cache for request deduplication
export const getCategoriesByStore = cache(async (storeId: string) => {
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.storeId, storeId), eq(categories.isActive, true)))
    .orderBy(categories.sortOrder);
});

// Cached across requests - for header/layout
export const getCategoriesCached = unstable_cache(
  async (storeId: string) => {
    return db
      .select()
      .from(categories)
      .where(and(eq(categories.storeId, storeId), eq(categories.isActive, true)))
      .orderBy(categories.sortOrder);
  },
  ['categories'],
  { revalidate: 3600, tags: ['categories'] } // Cache for 1 hour
);

export async function getCategoryBySlug(storeId: string, slug: string) {
  const [category] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.storeId, storeId), eq(categories.slug, slug)))
    .limit(1);
  return category;
}

// Get subcategories by parent ID
export async function getSubcategories(storeId: string, parentId: string) {
  return db
    .select()
    .from(categories)
    .where(and(
      eq(categories.storeId, storeId),
      eq(categories.parentId, parentId),
      eq(categories.isActive, true)
    ))
    .orderBy(categories.sortOrder);
}

// Get parent category by ID
export async function getCategoryById(categoryId: string) {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);
  return category;
}

// ============ PRODUCTS ============

export type ProductWithImage = Awaited<ReturnType<typeof getProductsByStore>>[number];

// React cache for request deduplication
export const getProductsByStore = cache(async (storeId: string, limit?: number) => {
  let query = db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      description: products.description,
      price: products.price,
      comparePrice: products.comparePrice,
      inventory: products.inventory,
      trackInventory: products.trackInventory,
      allowBackorder: products.allowBackorder,
      isFeatured: products.isFeatured,
      categoryId: products.categoryId,
      hasVariants: products.hasVariants,
      image: productImages.url,
    })
    .from(products)
    .leftJoin(productImages, and(
      eq(productImages.productId, products.id),
      eq(productImages.isPrimary, true)
    ))
    .where(and(eq(products.storeId, storeId), eq(products.isActive, true)))
    .orderBy(desc(products.isFeatured), desc(products.createdAt));

  const productsData = limit ? await query.limit(limit) : await query;

  // Get variant prices for products with variants
  const variantProductIds = productsData.filter(p => p.hasVariants).map(p => p.id);
  if (variantProductIds.length > 0) {
    const variantPrices = await db
      .select({
        productId: productVariants.productId,
        minPrice: sql<string>`MIN(${productVariants.price})`,
      })
      .from(productVariants)
      .where(inArray(productVariants.productId, variantProductIds))
      .groupBy(productVariants.productId);

    const variantPriceMap = new Map(variantPrices.map(v => [v.productId, v.minPrice]));

    return productsData.map(p => ({
      ...p,
      price: p.hasVariants ? (variantPriceMap.get(p.id) || p.price) : p.price,
    }));
  }

  return productsData;
});

export const getFeaturedProducts = cache(async (storeId: string, limit = 4) => {
  const productsData = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      description: products.description,
      price: products.price,
      comparePrice: products.comparePrice,
      inventory: products.inventory,
      trackInventory: products.trackInventory,
      allowBackorder: products.allowBackorder,
      isFeatured: products.isFeatured,
      categoryId: products.categoryId,
      hasVariants: products.hasVariants,
      image: productImages.url,
    })
    .from(products)
    .leftJoin(productImages, and(
      eq(productImages.productId, products.id),
      eq(productImages.isPrimary, true)
    ))
    .where(and(
      eq(products.storeId, storeId),
      eq(products.isActive, true),
      eq(products.isFeatured, true)
    ))
    .orderBy(desc(products.createdAt))
    .limit(limit);

  // Get variant prices for products with variants
  const variantProductIds = productsData.filter(p => p.hasVariants).map(p => p.id);
  if (variantProductIds.length > 0) {
    const variantPrices = await db
      .select({
        productId: productVariants.productId,
        minPrice: sql<string>`MIN(${productVariants.price})`,
      })
      .from(productVariants)
      .where(inArray(productVariants.productId, variantProductIds))
      .groupBy(productVariants.productId);

    const variantPriceMap = new Map(variantPrices.map(v => [v.productId, v.minPrice]));

    return productsData.map(p => ({
      ...p,
      price: p.hasVariants ? (variantPriceMap.get(p.id) || p.price) : p.price,
    }));
  }

  return productsData;
});

export const getProductsByCategory = cache(async (storeId: string, categoryId: string) => {
  // Query products that belong to this category via junction table
  // Uses idx_product_categories_category index for fast lookup
  // Single query with JOIN for performance per REQUIREMENTS.md
  const results = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      price: products.price,
      comparePrice: products.comparePrice,
      inventory: products.inventory,
      trackInventory: products.trackInventory,
      allowBackorder: products.allowBackorder,
      isFeatured: products.isFeatured,
      hasVariants: products.hasVariants,
      createdAt: products.createdAt,
      image: productImages.url,
    })
    .from(products)
    .innerJoin(productCategories, eq(productCategories.productId, products.id))
    .leftJoin(productImages, and(
      eq(productImages.productId, products.id),
      eq(productImages.isPrimary, true)
    ))
    .where(and(
      eq(products.storeId, storeId),
      eq(productCategories.categoryId, categoryId),
      eq(products.isActive, true)
    ))
    .orderBy(desc(products.createdAt));

  // Remove duplicates (in case of multiple category assignments) and exclude createdAt from result
  const seen = new Set<string>();
  const uniqueProducts = results.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  }).map(({ createdAt, ...rest }) => rest);

  // Get variant prices for products with variants
  const variantProductIds = uniqueProducts.filter(p => p.hasVariants).map(p => p.id);
  if (variantProductIds.length > 0) {
    const variantPrices = await db
      .select({
        productId: productVariants.productId,
        minPrice: sql<string>`MIN(${productVariants.price})`,
      })
      .from(productVariants)
      .where(inArray(productVariants.productId, variantProductIds))
      .groupBy(productVariants.productId);

    const variantPriceMap = new Map(variantPrices.map(v => [v.productId, v.minPrice]));

    return uniqueProducts.map(p => ({
      ...p,
      price: p.hasVariants ? (variantPriceMap.get(p.id) || p.price) : p.price,
    }));
  }

  return uniqueProducts;
});

// Get products by specific IDs (for editor "specific products" feature)
export const getProductsByIds = cache(async (storeId: string, productIds: string[]) => {
  if (!productIds || productIds.length === 0) {
    return [];
  }

  const results = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      price: products.price,
      comparePrice: products.comparePrice,
      inventory: products.inventory,
      trackInventory: products.trackInventory,
      allowBackorder: products.allowBackorder,
      isFeatured: products.isFeatured,
      hasVariants: products.hasVariants,
      image: productImages.url,
    })
    .from(products)
    .leftJoin(productImages, and(
      eq(productImages.productId, products.id),
      eq(productImages.isPrimary, true)
    ))
    .where(and(
      eq(products.storeId, storeId),
      inArray(products.id, productIds),
      eq(products.isActive, true)
    ));

  // Maintain the order of productIds
  const productMap = new Map(results.map(p => [p.id, p]));
  const orderedProducts = productIds
    .map(id => productMap.get(id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  // Get variant prices for products with variants
  const variantProductIds = orderedProducts.filter(p => p.hasVariants).map(p => p.id);
  if (variantProductIds.length > 0) {
    const variantPrices = await db
      .select({
        productId: productVariants.productId,
        minPrice: sql<string>`MIN(${productVariants.price})`,
      })
      .from(productVariants)
      .where(inArray(productVariants.productId, variantProductIds))
      .groupBy(productVariants.productId);

    const variantPriceMap = new Map(variantPrices.map(v => [v.productId, v.minPrice]));

    return orderedProducts.map(p => ({
      ...p,
      price: p.hasVariants ? (variantPriceMap.get(p.id) || p.price) : p.price,
    }));
  }

  return orderedProducts;
});

export async function getProductBySlug(storeId: string, slug: string) {
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      shortDescription: products.shortDescription,
      description: products.description,
      price: products.price,
      comparePrice: products.comparePrice,
      inventory: products.inventory,
      trackInventory: products.trackInventory,
      allowBackorder: products.allowBackorder,
      isFeatured: products.isFeatured,
      hasVariants: products.hasVariants,
      categoryId: products.categoryId,
    })
    .from(products)
    .where(and(eq(products.storeId, storeId), eq(products.slug, slug)))
    .limit(1);

  if (!product) return null;

  // Get all images
  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(productImages.sortOrder);

  return { ...product, images };
}

// קבלת כל קטגוריות המוצר (מרובות)
export async function getProductCategoryIds(productId: string): Promise<string[]> {
  const results = await db
    .select({ categoryId: productCategories.categoryId })
    .from(productCategories)
    .where(eq(productCategories.productId, productId));
  
  return results.map(r => r.categoryId);
}

// ============ VARIANTS ============

export async function getProductOptions(productId: string) {
  const options = await db
    .select()
    .from(productOptions)
    .where(eq(productOptions.productId, productId))
    .orderBy(asc(productOptions.sortOrder));

  // Get values for each option
  const optionsWithValues = await Promise.all(
    options.map(async (option) => {
      const values = await db
        .select()
        .from(productOptionValues)
        .where(eq(productOptionValues.optionId, option.id))
        .orderBy(asc(productOptionValues.sortOrder));
      return { ...option, values };
    })
  );

  return optionsWithValues;
}

export async function getProductVariants(productId: string) {
  return db
    .select()
    .from(productVariants)
    .where(and(
      eq(productVariants.productId, productId),
      eq(productVariants.isActive, true)
    ))
    .orderBy(asc(productVariants.sortOrder));
}

// ============ PAGE SECTIONS ============
// NEW ARCHITECTURE: Sections stored as JSON on pages/stores tables
// - home → stores.homeSections
// - coming_soon → stores.comingSoonSections  
// - pages/* → pages.sections (internal pages)

// Section type for JSON storage
export interface PageSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
}

// React cache for request deduplication
export const getPageSections = cache(async (storeId: string, page: string = 'home'): Promise<PageSection[]> => {
  // Internal pages (pages/about, pages/privacy, etc.)
  if (page.startsWith('pages/')) {
    const pageSlug = page.replace('pages/', '');
    const [pageData] = await db
      .select({ sections: pages.sections })
      .from(pages)
      .where(and(
        eq(pages.storeId, storeId),
        eq(pages.slug, pageSlug)
      ))
      .limit(1);
    
    if (!pageData) return [];
    const sections = (pageData.sections || []) as PageSection[];
    return sections
      .filter(s => s.isActive !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  
  // System pages (home, coming_soon)
  const [store] = await db
    .select({ 
      homeSections: stores.homeSections,
      comingSoonSections: stores.comingSoonSections 
    })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);
  
  if (!store) return [];
  
  const sections = page === 'coming_soon' 
    ? (store.comingSoonSections || []) as PageSection[]
    : (store.homeSections || []) as PageSection[];
  
  return sections
    .filter(s => s.isActive !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
});

// Cached across requests - very important for speed!
export const getPageSectionsCached = unstable_cache(
  async (storeId: string, page: string = 'home'): Promise<PageSection[]> => {
    // Internal pages (pages/about, pages/privacy, etc.)
    if (page.startsWith('pages/')) {
      const pageSlug = page.replace('pages/', '');
      const [pageData] = await db
        .select({ sections: pages.sections })
        .from(pages)
        .where(and(
          eq(pages.storeId, storeId),
          eq(pages.slug, pageSlug)
        ))
        .limit(1);
      
      if (!pageData) return [];
      const sections = (pageData.sections || []) as PageSection[];
      return sections
        .filter(s => s.isActive !== false)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
    
    // System pages (home, coming_soon)
    const [store] = await db
      .select({ 
        homeSections: stores.homeSections,
        comingSoonSections: stores.comingSoonSections 
      })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);
    
    if (!store) return [];
    
    const sections = page === 'coming_soon' 
      ? (store.comingSoonSections || []) as PageSection[]
      : (store.homeSections || []) as PageSection[];
    
    return sections
      .filter(s => s.isActive !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  },
  ['page-sections'],
  { revalidate: 300, tags: ['sections'] } // Cache for 5 minutes
);

// Update page sections (for template application)
// NEW ARCHITECTURE: Updates JSON field directly - atomic operation
export async function updatePageSections(
  storeId: string,
  page: string,
  sections: PageSection[]
) {
  // Internal pages (pages/about, pages/privacy, etc.)
  if (page.startsWith('pages/')) {
    const pageSlug = page.replace('pages/', '');
    await db.update(pages)
      .set({ 
        sections: sections,
        updatedAt: new Date()
      })
      .where(and(
        eq(pages.storeId, storeId),
        eq(pages.slug, pageSlug)
      ));
    return;
  }
  
  // System pages (home, coming_soon)
  if (page === 'coming_soon') {
    await db.update(stores)
      .set({ 
        comingSoonSections: sections,
        updatedAt: new Date()
      })
      .where(eq(stores.id, storeId));
  } else {
    // Default to home
    await db.update(stores)
      .set({ 
        homeSections: sections,
        updatedAt: new Date()
      })
      .where(eq(stores.id, storeId));
  }
  
  // Note: Cache revalidation should be called from Server Actions/Route Handlers
  // The caller is responsible for revalidating if needed
}

// ============ ORDERS ============

export type OrderWithCustomer = Awaited<ReturnType<typeof getStoreOrders>>[number];

export const getStoreOrders = cache(async (storeId: string, limit?: number) => {
  const query = db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      financialStatus: orders.financialStatus,
      fulfillmentStatus: orders.fulfillmentStatus,
      subtotal: orders.subtotal,
      discountCode: orders.discountCode, // For coupon filtering
      discountAmount: orders.discountAmount,
      shippingAmount: orders.shippingAmount,
      shippingMethod: orders.shippingMethod, // For delivery method filtering
      shippingAddress: orders.shippingAddress, // For destination filtering
      paymentMethod: orders.paymentMethod, // For payment method filtering
      total: orders.total,
      createdAt: orders.createdAt,
      isRead: orders.isRead,
      archivedAt: orders.archivedAt,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      shipmentError: orders.shipmentError,
      customer: {
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        email: customers.email,
      },
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.storeId, storeId))
    .orderBy(desc(orders.createdAt));

  if (limit) {
    return query.limit(limit);
  }
  return query;
});

// Get unique shipping methods and cities for filtering
export const getOrderFilterOptions = cache(async (storeId: string) => {
  const allOrders = await db
    .select({ 
      shippingMethod: orders.shippingMethod,
      shippingAddress: orders.shippingAddress,
      paymentMethod: orders.paymentMethod,
    })
    .from(orders)
    .where(eq(orders.storeId, storeId));
  
  // Extract unique values
  const shippingMethods = [...new Set(
    allOrders.map(o => o.shippingMethod).filter((m): m is string => !!m)
  )].sort();
  
  const paymentMethods = [...new Set(
    allOrders.map(o => o.paymentMethod).filter((m): m is string => !!m)
  )].sort();
  
  const cities = [...new Set(
    allOrders
      .map(o => (o.shippingAddress as { city?: string })?.city)
      .filter((c): c is string => !!c)
  )].sort();
  
  return { shippingMethods, paymentMethods, cities };
});

// Get order items count and category data for filtering
// Returns: { orderId -> { itemCount, categoryIds } }
export const getOrderItemsMetadata = cache(async (storeId: string) => {
  // Get all order items with their product categories in one query
  const items = await db
    .select({
      orderId: orderItems.orderId,
      quantity: orderItems.quantity,
      productId: orderItems.productId,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(eq(orders.storeId, storeId));
  
  // Get all product categories for products in orders
  const productIds = [...new Set(items.filter(i => i.productId).map(i => i.productId!))];
  
  let productCategoryMap: Record<string, string[]> = {};
  if (productIds.length > 0) {
    const { inArray } = await import('drizzle-orm');
    const prodCategories = await db
      .select({
        productId: productCategories.productId,
        categoryId: productCategories.categoryId,
      })
      .from(productCategories)
      .where(inArray(productCategories.productId, productIds));
    
    // Build product -> categories map
    for (const pc of prodCategories) {
      if (!productCategoryMap[pc.productId]) {
        productCategoryMap[pc.productId] = [];
      }
      productCategoryMap[pc.productId].push(pc.categoryId);
    }
  }
  
  // Build order -> metadata map
  const orderMetadata: Record<string, { itemCount: number; categoryIds: string[] }> = {};
  
  for (const item of items) {
    if (!orderMetadata[item.orderId]) {
      orderMetadata[item.orderId] = { itemCount: 0, categoryIds: [] };
    }
    orderMetadata[item.orderId].itemCount += item.quantity;
    
    // Add category IDs for this product
    if (item.productId && productCategoryMap[item.productId]) {
      for (const catId of productCategoryMap[item.productId]) {
        if (!orderMetadata[item.orderId].categoryIds.includes(catId)) {
          orderMetadata[item.orderId].categoryIds.push(catId);
        }
      }
    }
  }
  
  return orderMetadata;
});

// Get unique coupon codes used in orders
export const getOrderCouponCodes = cache(async (storeId: string) => {
  const result = await db
    .select({ discountCode: orders.discountCode })
    .from(orders)
    .where(eq(orders.storeId, storeId))
    .groupBy(orders.discountCode);
  
  return result
    .map(r => r.discountCode)
    .filter((code): code is string => !!code)
    .sort();
});

export const getUnreadOrdersCount = cache(async (storeId: string) => {
  const result = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.storeId, storeId), eq(orders.isRead, false)));
  return result.length;
});

// Optimized order details with parallel queries
export const getOrderDetails = cache(async (storeId: string, orderId: string) => {
  // First get the order
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)))
    .limit(1);
  
  if (!order) return null;

  // Get items and customer in parallel for speed
  const [items, customer] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
    order.customerId 
      ? db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1).then(r => r[0] || null)
      : Promise.resolve(null)
  ]);

  return { ...order, items, customer };
});

// ============ CUSTOMERS ============

export const getStoreCustomers = cache(async (storeId: string, limit?: number) => {
  const query = db
    .select()
    .from(customers)
    .where(eq(customers.storeId, storeId))
    .orderBy(desc(customers.createdAt));

  if (limit) {
    return query.limit(limit);
  }
  return query;
});

// ============ PRODUCTS FOR ADMIN ============

export type AdminProduct = Awaited<ReturnType<typeof getStoreProductsAdmin>>[number];

export const getStoreProductsAdmin = cache(async (storeId: string) => {
  // First get all products with their primary image
  const productsData = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      price: products.price,
      comparePrice: products.comparePrice,
      inventory: products.inventory,
      trackInventory: products.trackInventory,
      hasVariants: products.hasVariants,
      isActive: products.isActive,
      isFeatured: products.isFeatured,
      categoryId: products.categoryId,
      createdAt: products.createdAt,
      image: productImages.url,
    })
    .from(products)
    .leftJoin(productImages, and(
      eq(productImages.productId, products.id),
      eq(productImages.isPrimary, true)
    ))
    .where(eq(products.storeId, storeId))
    .orderBy(desc(products.createdAt));

  // Get all product-category associations for this store's products
  const productIds = productsData.map(p => p.id);
  
  if (productIds.length === 0) {
    return [];
  }

  // Get all category associations with category names in a single query
  const categoryAssociations = await db
    .select({
      productId: productCategories.productId,
      categoryId: productCategories.categoryId,
      categoryName: categories.name,
      parentId: categories.parentId,
    })
    .from(productCategories)
    .innerJoin(categories, eq(productCategories.categoryId, categories.id))
    .innerJoin(products, eq(productCategories.productId, products.id))
    .where(eq(products.storeId, storeId));

  // Create a map of productId -> categories
  const productCategoriesMap = new Map<string, Array<{ id: string; name: string; parentId: string | null }>>();
  for (const assoc of categoryAssociations) {
    if (!productCategoriesMap.has(assoc.productId)) {
      productCategoriesMap.set(assoc.productId, []);
    }
    productCategoriesMap.get(assoc.productId)!.push({
      id: assoc.categoryId,
      name: assoc.categoryName,
      parentId: assoc.parentId,
    });
  }

  // Get variant aggregates for products with variants
  const variantAggregates = await db
    .select({
      productId: productVariants.productId,
      minPrice: sql<string>`MIN(${productVariants.price})`,
      maxPrice: sql<string>`MAX(${productVariants.price})`,
      totalInventory: sql<number>`COALESCE(SUM(${productVariants.inventory}), 0)`,
      variantCount: sql<number>`COUNT(*)`,
    })
    .from(productVariants)
    .where(inArray(productVariants.productId, productIds))
    .groupBy(productVariants.productId);

  // Create a map of productId -> variant aggregate
  const variantAggregateMap = new Map(variantAggregates.map(v => [v.productId, v]));

  // Combine products with their categories and variant aggregates
  return productsData.map(product => {
    const variantData = product.hasVariants ? variantAggregateMap.get(product.id) : null;
    return {
    ...product,
    category: productCategoriesMap.get(product.id)?.[0] || null, // First category for backward compatibility
    categories: productCategoriesMap.get(product.id) || [], // All categories
      // Variant aggregate data
      variantMinPrice: variantData?.minPrice || null,
      variantMaxPrice: variantData?.maxPrice || null,
      variantTotalInventory: variantData?.totalInventory || null,
      variantCount: variantData?.variantCount || null,
    };
  });
});

// Get full product details for editing
export const getProductForEdit = cache(async (storeId: string, productId: string) => {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.storeId, storeId)))
    .limit(1);

  if (!product) return null;

  // Get images, options, variants, categories, addons, and user info in parallel
  const [images, options, variants, productCats, productAddonsData, createdByUser, updatedByUser] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(productImages.sortOrder),
    db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, productId))
      .orderBy(productOptions.sortOrder),
    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .orderBy(productVariants.sortOrder),
    // Get product categories
    db
      .select({ categoryId: productCategories.categoryId })
      .from(productCategories)
      .where(eq(productCategories.productId, productId)),
    // Get product addons
    db
      .select({ addonId: productAddonAssignments.addonId })
      .from(productAddonAssignments)
      .where(eq(productAddonAssignments.productId, productId))
      .orderBy(productAddonAssignments.sortOrder),
    // Get created by user
    product.createdBy
      ? db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, product.createdBy))
          .limit(1)
          .then((res) => res[0])
      : Promise.resolve(null),
    // Get updated by user
    product.updatedBy
      ? db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, product.updatedBy))
          .limit(1)
          .then((res) => res[0])
      : Promise.resolve(null),
  ]);

  // Get option values for each option
  const optionsWithValues = await Promise.all(
    options.map(async (opt) => {
      const values = await db
        .select()
        .from(productOptionValues)
        .where(eq(productOptionValues.optionId, opt.id))
        .orderBy(productOptionValues.sortOrder);
      return { ...opt, values };
    })
  );

  return { 
    ...product, 
    images, 
    options: optionsWithValues, 
    variants,
    categoryIds: productCats.map(pc => pc.categoryId),
    upsellProductIds: (product.upsellProductIds as string[] | null) ?? [],
    addonIds: productAddonsData.map(pa => pa.addonId),
    createdByUser,
    updatedByUser,
  };
});

// Get active addons for a product (for storefront display)
export const getProductAddonsForStorefront = cache(async (productId: string) => {
  // First get the addon assignments for this product
  const assignments = await db
    .select({ addonId: productAddonAssignments.addonId })
    .from(productAddonAssignments)
    .where(eq(productAddonAssignments.productId, productId))
    .orderBy(asc(productAddonAssignments.sortOrder));

  if (assignments.length === 0) return [];

  const addonIds = assignments.map(a => a.addonId);

  // Get the actual addons (only active ones)
  const addons = await db
    .select()
    .from(productAddons)
    .where(and(
      inArray(productAddons.id, addonIds),
      eq(productAddons.isActive, true)
    ));

  // Return in the order of assignments
  return addonIds
    .map(id => addons.find(a => a.id === id))
    .filter(Boolean)
    .map(addon => ({
      id: addon!.id,
      name: addon!.name,
      fieldType: addon!.fieldType,
      placeholder: addon!.placeholder,
      options: (addon!.options as Array<{ label: string; value: string; priceAdjustment: number }>) || [],
      priceAdjustment: Number(addon!.priceAdjustment) || 0,
      isRequired: addon!.isRequired,
      maxLength: addon!.maxLength,
    }));
});

// Get products for upsell selection in product editor (lightweight query)
export const getProductsForUpsell = cache(async (storeId: string) => {
  return db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      imageUrl: productImages.url,
    })
    .from(products)
    .leftJoin(productImages, and(
      eq(productImages.productId, products.id),
      eq(productImages.isPrimary, true)
    ))
    .where(and(
      eq(products.storeId, storeId),
      eq(products.isActive, true)
    ))
    .orderBy(products.name);
});

// Legacy - for backwards compatibility
export const getStoreProducts = cache(async (storeId: string) => {
  return db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      inventory: products.inventory,
      trackInventory: products.trackInventory,
      isActive: products.isActive,
      isFeatured: products.isFeatured,
      createdAt: products.createdAt,
      image: productImages.url,
    })
    .from(products)
    .leftJoin(productImages, and(
      eq(productImages.productId, products.id),
      eq(productImages.isPrimary, true)
    ))
    .where(eq(products.storeId, storeId))
    .orderBy(desc(products.createdAt));
});

// ============ NAVIGATION MENUS ============

export interface MenuItem {
  id: string;
  title: string;
  linkType: 'url' | 'page' | 'category' | 'product';
  linkUrl: string | null;
  linkResourceId: string | null;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
  // Image URL for mega menu display
  imageUrl?: string | null;
  // Resolved URL based on link type
  resolvedUrl?: string;
  // Children for nested menus
  children?: MenuItem[];
}

// Get main menu with items for header navigation
export const getMainMenuWithItems = cache(async (storeId: string) => {
  // Get the main menu
  const [menu] = await db
    .select()
    .from(menus)
    .where(and(eq(menus.storeId, storeId), eq(menus.handle, 'main')))
    .limit(1);

  if (!menu) {
    return null;
  }

  // Get all menu items
  const items = await db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.menuId, menu.id), eq(menuItems.isActive, true)))
    .orderBy(asc(menuItems.sortOrder));

  if (items.length === 0) {
    return { ...menu, items: [] };
  }

  // Get all linked pages and categories for URL resolution
  const pageIds = items.filter(i => i.linkType === 'page' && i.linkResourceId).map(i => i.linkResourceId!);
  const categoryIds = items.filter(i => i.linkType === 'category' && i.linkResourceId).map(i => i.linkResourceId!);

  const [linkedPages, linkedCategories] = await Promise.all([
    pageIds.length > 0
      ? db.select({ id: pages.id, slug: pages.slug }).from(pages).where(
          and(eq(pages.storeId, storeId))
        )
      : Promise.resolve([]),
    categoryIds.length > 0
      ? db.select({ id: categories.id, slug: categories.slug }).from(categories).where(
          and(eq(categories.storeId, storeId))
        )
      : Promise.resolve([]),
  ]);

  // Create lookup maps
  const pageMap = new Map(linkedPages.map(p => [p.id, p.slug]));
  const categoryMap = new Map(linkedCategories.map(c => [c.id, c.slug]));

  // Resolve URLs for each item
  const resolvedItems: MenuItem[] = items.map(item => {
    let resolvedUrl = item.linkUrl || '#';
    
    if (item.linkType === 'page' && item.linkResourceId) {
      const pageSlug = pageMap.get(item.linkResourceId);
      resolvedUrl = pageSlug ? `/${pageSlug}` : '#';
    } else if (item.linkType === 'category' && item.linkResourceId) {
      const categorySlug = categoryMap.get(item.linkResourceId);
      resolvedUrl = categorySlug ? `/category/${categorySlug}` : '#';
    } else if (item.linkType === 'url') {
      resolvedUrl = item.linkUrl || '#';
    }

    return {
      id: item.id,
      title: item.title,
      linkType: item.linkType,
      linkUrl: item.linkUrl,
      linkResourceId: item.linkResourceId,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
      parentId: item.parentId,
      imageUrl: item.imageUrl,
      resolvedUrl,
    };
  });

  // Build tree structure (items with children and grandchildren for mega menu)
  const topLevelItems: MenuItem[] = [];
  const childrenMap = new Map<string, MenuItem[]>();

  // First pass: group children by parent
  resolvedItems.forEach(item => {
    if (item.parentId) {
      const existing = childrenMap.get(item.parentId) || [];
      childrenMap.set(item.parentId, [...existing, item]);
    }
  });

  // Build nested structure supporting 3 levels: parent -> child -> grandchild
  const buildWithChildren = (item: MenuItem): MenuItem => {
    const directChildren = childrenMap.get(item.id) || [];
    return {
      ...item,
      children: directChildren.map(child => buildWithChildren(child)),
    };
  };

  // Build top-level items with nested children
  resolvedItems.forEach(item => {
    if (!item.parentId) {
      topLevelItems.push(buildWithChildren(item));
    }
  });

  return { ...menu, items: topLevelItems };
});

// ============ FOOTER MENU ============

export interface FooterMenuItem {
  id: string;
  title: string;
  linkType: 'page' | 'category' | 'product' | 'custom' | 'collection';
  linkUrl: string | null;
  linkResourceId: string | null;
  pageSlug: string | null;
}

// Get footer menu items for store
export const getFooterMenuItems = cache(async (storeId: string): Promise<FooterMenuItem[]> => {
  // Find the footer menu
  const [menu] = await db
    .select()
    .from(menus)
    .where(and(eq(menus.storeId, storeId), eq(menus.handle, 'footer')))
    .limit(1);

  if (!menu) {
    return [];
  }

  // Get all menu items
  const items = await db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.menuId, menu.id), eq(menuItems.isActive, true)))
    .orderBy(asc(menuItems.sortOrder));

  if (items.length === 0) {
    return [];
  }

  // Get linked pages for URL resolution
  const pageIds = items
    .filter(i => i.linkType === 'page' && i.linkResourceId)
    .map(i => i.linkResourceId!);

  const linkedPages = pageIds.length > 0
    ? await db
        .select({ id: pages.id, slug: pages.slug })
        .from(pages)
        .where(and(eq(pages.storeId, storeId), inArray(pages.id, pageIds)))
    : [];

  const pageMap = new Map(linkedPages.map(p => [p.id, p.slug]));

  // Resolve page slugs
  return items.map(item => ({
    id: item.id,
    title: item.title,
    linkType: item.linkType as FooterMenuItem['linkType'],
    linkUrl: item.linkUrl,
    linkResourceId: item.linkResourceId,
    pageSlug: item.linkType === 'page' && item.linkResourceId 
      ? pageMap.get(item.linkResourceId) || null 
      : null,
  }));
});

// ============ PAGES ============

// Get page by slug
export const getPageBySlug = cache(async (storeId: string, slug: string) => {
  return db.query.pages.findFirst({
    where: and(eq(pages.storeId, storeId), eq(pages.slug, slug)),
  });
});
