/**
 * Mobile Products List API
 * GET /api/mobile/products
 * 
 * Returns paginated list of products for the store
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productImages, productVariants, categories } from '@/lib/db/schema';
import { eq, and, desc, asc, like, or, sql, lt, lte } from 'drizzle-orm';
import { requireMobileAuthWithStore } from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuthWithStore(request);
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const status = searchParams.get('status'); // 'active', 'draft', 'all'
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const lowStock = searchParams.get('lowStock') === 'true';
    const outOfStock = searchParams.get('outOfStock') === 'true';
    const hasVariants = searchParams.get('hasVariants');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const offset = (page - 1) * limit;
    
    // Build conditions
    const conditions = [eq(products.storeId, auth.store.id)];
    
    // Status filter
    if (status === 'active') {
      conditions.push(eq(products.isActive, true));
    } else if (status === 'draft') {
      conditions.push(eq(products.isActive, false));
    }
    
    // Category filter
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }
    
    // Inventory filters
    if (lowStock) {
      conditions.push(
        and(
          eq(products.trackInventory, true),
          lt(products.inventory, 5),
          sql`${products.inventory} > 0`
        )!
      );
    }
    
    if (outOfStock) {
      conditions.push(
        and(
          eq(products.trackInventory, true),
          lte(products.inventory, 0)
        )!
      );
    }
    
    // Has variants filter
    if (hasVariants === 'true') {
      conditions.push(eq(products.hasVariants, true));
    } else if (hasVariants === 'false') {
      conditions.push(eq(products.hasVariants, false));
    }
    
    // Search
    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.sku, `%${search}%`),
          like(products.barcode, `%${search}%`)
        )!
      );
    }
    
    // Sort
    let orderByColumn;
    switch (sortBy) {
      case 'name':
        orderByColumn = products.name;
        break;
      case 'price':
        orderByColumn = products.price;
        break;
      case 'inventory':
        orderByColumn = products.inventory;
        break;
      default:
        orderByColumn = products.createdAt;
    }
    const orderDirection = sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn);
    
    // Get products with variant count
    const productsData = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        comparePrice: products.comparePrice,
        sku: products.sku,
        barcode: products.barcode,
        hasVariants: products.hasVariants,
        trackInventory: products.trackInventory,
        inventory: products.inventory,
        isActive: products.isActive,
        isFeatured: products.isFeatured,
        categoryId: products.categoryId,
        createdAt: products.createdAt,
        variantsCount: sql<number>`(SELECT COUNT(*) FROM ${productVariants} WHERE ${productVariants.productId} = ${products.id})`,
      })
      .from(products)
      .where(and(...conditions))
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset);
    
    // Get primary images for products
    const productsWithImages = await Promise.all(
      productsData.map(async (product) => {
        const [image] = await db
          .select({ url: productImages.url })
          .from(productImages)
          .where(eq(productImages.productId, product.id))
          .orderBy(productImages.sortOrder)
          .limit(1);
        
        // Get category name
        let categoryName = null;
        if (product.categoryId) {
          const [cat] = await db
            .select({ name: categories.name })
            .from(categories)
            .where(eq(categories.id, product.categoryId))
            .limit(1);
          categoryName = cat?.name || null;
        }
        
        return {
          ...product,
          price: product.price ? Number(product.price) : null,
          comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
          imageUrl: image?.url || null,
          variantsCount: Number(product.variantsCount),
          category: product.categoryId ? { id: product.categoryId, name: categoryName } : null,
        };
      })
    );
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(...conditions));
    
    // Get stats
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where ${products.isActive} = true)`,
        draft: sql<number>`count(*) filter (where ${products.isActive} = false)`,
        lowStock: sql<number>`count(*) filter (where ${products.trackInventory} = true and ${products.inventory} < 5 and ${products.inventory} > 0)`,
        outOfStock: sql<number>`count(*) filter (where ${products.trackInventory} = true and ${products.inventory} <= 0)`,
      })
      .from(products)
      .where(eq(products.storeId, auth.store.id));
    
    return NextResponse.json({
      success: true,
      products: productsWithImages,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
      stats: {
        total: Number(stats?.total || 0),
        active: Number(stats?.active || 0),
        draft: Number(stats?.draft || 0),
        lowStock: Number(stats?.lowStock || 0),
        outOfStock: Number(stats?.outOfStock || 0),
      },
    });
    
  } catch (error) {
    console.error('Mobile products list error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

