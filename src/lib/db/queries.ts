import { db } from './index';
import { products, productImages, categories, stores, productOptions, productOptionValues, productVariants, productCategories, pageSections, orders, orderItems, customers, users } from './schema';
import { eq, and, desc, asc } from 'drizzle-orm';
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
  const query = db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      description: products.description,
      price: products.price,
      comparePrice: products.comparePrice,
      inventory: products.inventory,
      isFeatured: products.isFeatured,
      categoryId: products.categoryId,
      image: productImages.url,
    })
    .from(products)
    .leftJoin(productImages, and(
      eq(productImages.productId, products.id),
      eq(productImages.isPrimary, true)
    ))
    .where(and(eq(products.storeId, storeId), eq(products.isActive, true)))
    .orderBy(desc(products.isFeatured), desc(products.createdAt));

  if (limit) {
    return query.limit(limit);
  }
  return query;
});

export const getFeaturedProducts = cache(async (storeId: string, limit = 4) => {
  return db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      description: products.description,
      price: products.price,
      comparePrice: products.comparePrice,
      inventory: products.inventory,
      isFeatured: products.isFeatured,
      categoryId: products.categoryId,
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
});

export const getProductsByCategory = cache(async (storeId: string, categoryId: string) => {
  return db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      price: products.price,
      comparePrice: products.comparePrice,
      isFeatured: products.isFeatured,
      image: productImages.url,
    })
    .from(products)
    .leftJoin(productImages, and(
      eq(productImages.productId, products.id),
      eq(productImages.isPrimary, true)
    ))
    .where(and(
      eq(products.storeId, storeId),
      eq(products.categoryId, categoryId),
      eq(products.isActive, true)
    ))
    .orderBy(desc(products.createdAt));
});

export async function getProductBySlug(storeId: string, slug: string) {
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      description: products.description,
      price: products.price,
      comparePrice: products.comparePrice,
      inventory: products.inventory,
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

// React cache for request deduplication
export const getPageSections = cache(async (storeId: string, page: string = 'home') => {
  return db
    .select()
    .from(pageSections)
    .where(and(
      eq(pageSections.storeId, storeId),
      eq(pageSections.page, page),
      eq(pageSections.isActive, true)
    ))
    .orderBy(asc(pageSections.sortOrder));
});

// Cached across requests for homepage - very important for speed!
export const getPageSectionsCached = unstable_cache(
  async (storeId: string, page: string = 'home') => {
    return db
      .select()
      .from(pageSections)
      .where(and(
        eq(pageSections.storeId, storeId),
        eq(pageSections.page, page),
        eq(pageSections.isActive, true)
      ))
      .orderBy(asc(pageSections.sortOrder));
  },
  ['page-sections'],
  { revalidate: 300, tags: ['sections'] } // Cache for 5 minutes
);

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
      discountAmount: orders.discountAmount,
      shippingAmount: orders.shippingAmount,
      total: orders.total,
      createdAt: orders.createdAt,
      isRead: orders.isRead,
      archivedAt: orders.archivedAt,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
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
  return db
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
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      },
    })
    .from(products)
    .leftJoin(productImages, and(
      eq(productImages.productId, products.id),
      eq(productImages.isPrimary, true)
    ))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.storeId, storeId))
    .orderBy(desc(products.createdAt));
});

// Get full product details for editing
export const getProductForEdit = cache(async (storeId: string, productId: string) => {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.storeId, storeId)))
    .limit(1);

  if (!product) return null;

  // Get images, options, variants, categories, and user info in parallel
  const [images, options, variants, productCats, createdByUser, updatedByUser] = await Promise.all([
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
    createdByUser,
    updatedByUser,
  };
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
