/**
 * Storefront Products List API (Public)
 * GET /api/storefront/[storeSlug]/products
 * 
 * Returns paginated list of active products with filters
 * Public endpoint - no authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, products, productImages, categories, productCategories } from '@/lib/db/schema';
import { eq, and, desc, asc, like, or, sql, gte, lte, inArray } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ storeSlug: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { storeSlug } = await params;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const categorySlug = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const featured = searchParams.get('featured') === 'true';
    
    const offset = (page - 1) * limit;
    
    // Get store
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.slug, storeSlug))
      .limit(1);
    
    if (!store) {
      return NextResponse.json(
        { success: false, error: 'החנות לא נמצאה' },
        { status: 404 }
      );
    }
    
    // Build conditions
    const conditions = [
      eq(products.storeId, store.id),
      eq(products.isActive, true), // Only active products for storefront
    ];
    
    // Category filter
    if (categorySlug) {
      const [category] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(
          eq(categories.storeId, store.id),
          eq(categories.slug, categorySlug)
        ))
        .limit(1);
      
      if (category) {
        // Get products in this category (many-to-many relationship)
        const productIdsInCategory = await db
          .select({ productId: productCategories.productId })
          .from(productCategories)
          .where(eq(productCategories.categoryId, category.id));
        
        const productIds = productIdsInCategory.map(p => p.productId);
        if (productIds.length > 0) {
          conditions.push(inArray(products.id, productIds));
        } else {
          // No products in category - return empty
          return NextResponse.json({
            success: true,
            data: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          });
        }
      }
    }
    
    // Search filter
    if (search && search.trim().length >= 2) {
      const searchPattern = `%${search.trim()}%`;
      conditions.push(
        or(
          like(products.name, searchPattern),
          like(products.description, searchPattern),
          like(products.sku, searchPattern)
        )!
      );
    }
    
    // Price range filters
    if (minPrice) {
      const minPriceNum = parseFloat(minPrice);
      if (!isNaN(minPriceNum)) {
        conditions.push(gte(products.price, minPriceNum.toString()));
      }
    }
    
    if (maxPrice) {
      const maxPriceNum = parseFloat(maxPrice);
      if (!isNaN(maxPriceNum)) {
        conditions.push(lte(products.price, maxPriceNum.toString()));
      }
    }
    
    // Featured filter
    if (featured) {
      conditions.push(eq(products.isFeatured, true));
    }
    
    // Sort configuration
    let orderColumn;
    switch (sort) {
      case 'name':
        orderColumn = products.name;
        break;
      case 'price':
        orderColumn = products.price;
        break;
      case 'created_at':
      default:
        orderColumn = products.createdAt;
        break;
    }
    
    const orderDir = order === 'asc' ? asc(orderColumn) : desc(orderColumn);
    
    // Get products
    const productsData = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        shortDescription: products.shortDescription,
        description: products.description,
        price: products.price,
        comparePrice: products.comparePrice,
        hasVariants: products.hasVariants,
        trackInventory: products.trackInventory,
        inventory: products.inventory,
        allowBackorder: products.allowBackorder,
        isFeatured: products.isFeatured,
        createdAt: products.createdAt,
      })
      .from(products)
      .where(and(...conditions))
      .orderBy(orderDir)
      .limit(limit)
      .offset(offset);
    
    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(...conditions));
    
    const totalCount = Number(count);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Batch get primary images for all products (performance optimization - no N+1)
    const productIds = productsData.map(p => p.id);
    const images = productIds.length > 0
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
            alt: productImages.alt,
          })
          .from(productImages)
          .where(and(
            inArray(productImages.productId, productIds),
            eq(productImages.isPrimary, true)
          ))
      : [];
    
    const imageMap = new Map(images.map(img => [img.productId, img]));
    
    // Format response
    const formattedProducts = productsData.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      description: product.description,
      price: product.price ? Number(product.price) : null,
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
      hasVariants: product.hasVariants,
      inStock: !product.trackInventory || product.allowBackorder || (product.inventory !== null && product.inventory > 0),
      isFeatured: product.isFeatured,
      image: imageMap.get(product.id)?.url || null,
      imageAlt: imageMap.get(product.id)?.alt || product.name,
      createdAt: product.createdAt,
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedProducts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת המוצרים' },
      { status: 500 }
    );
  }
}
