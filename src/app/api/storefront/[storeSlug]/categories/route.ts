/**
 * Storefront Categories API (Public)
 * GET /api/storefront/[storeSlug]/categories
 * 
 * Returns list of active categories with product counts
 * Public endpoint - no authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, categories, productCategories, products } from '@/lib/db/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';

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
    
    // Query parameters
    const parentId = searchParams.get('parentId'); // Filter by parent category
    const includeSubcategories = searchParams.get('includeSubcategories') !== 'false';
    
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
      eq(categories.storeId, store.id),
      eq(categories.isActive, true), // Only active categories
    ];
    
    // Filter by parent (or root categories if parentId is 'null')
    if (parentId === 'null' || parentId === 'root') {
      conditions.push(isNull(categories.parentId));
    } else if (parentId) {
      conditions.push(eq(categories.parentId, parentId));
    }
    
    // Get categories with product count
    const categoriesData = await db
      .select({
        id: categories.id,
        parentId: categories.parentId,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        imageUrl: categories.imageUrl,
        sortOrder: categories.sortOrder,
        hideOutOfStock: categories.hideOutOfStock,
        moveOutOfStockToBottom: categories.moveOutOfStockToBottom,
        createdAt: categories.createdAt,
        // Count products in this category (only active products)
        productCount: sql<number>`(
          SELECT COUNT(DISTINCT ${productCategories.productId})
          FROM ${productCategories}
          INNER JOIN ${products} ON ${products.id} = ${productCategories.productId}
          WHERE ${productCategories.categoryId} = ${categories.id}
          AND ${products.isActive} = true
        )`.as('productCount'),
      })
      .from(categories)
      .where(and(...conditions))
      .orderBy(categories.sortOrder, categories.name);
    
    // If includeSubcategories, get subcategories for each category
    let subcategoriesMap = new Map<string, typeof categoriesData>();
    
    if (includeSubcategories) {
      const allCategoryIds = categoriesData.map(c => c.id);
      
      if (allCategoryIds.length > 0) {
        const subcategories = await db
          .select({
            id: categories.id,
            parentId: categories.parentId,
            name: categories.name,
            slug: categories.slug,
            description: categories.description,
            imageUrl: categories.imageUrl,
            sortOrder: categories.sortOrder,
            hideOutOfStock: categories.hideOutOfStock,
            moveOutOfStockToBottom: categories.moveOutOfStockToBottom,
            createdAt: categories.createdAt,
            productCount: sql<number>`(
              SELECT COUNT(DISTINCT ${productCategories.productId})
              FROM ${productCategories}
              INNER JOIN ${products} ON ${products.id} = ${productCategories.productId}
              WHERE ${productCategories.categoryId} = ${categories.id}
              AND ${products.isActive} = true
            )`.as('productCount'),
          })
          .from(categories)
          .where(and(
            eq(categories.storeId, store.id),
            eq(categories.isActive, true),
            sql`${categories.parentId} IN (${sql.join(allCategoryIds.map(id => sql`${id}`), sql`, `)})`
          ))
          .orderBy(categories.sortOrder, categories.name);
        
        // Group subcategories by parent
        for (const subcat of subcategories) {
          if (subcat.parentId) {
            if (!subcategoriesMap.has(subcat.parentId)) {
              subcategoriesMap.set(subcat.parentId, []);
            }
            subcategoriesMap.get(subcat.parentId)!.push(subcat);
          }
        }
      }
    }
    
    // Format response
    const formattedCategories = categoriesData.map(category => ({
      id: category.id,
      parentId: category.parentId,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      sortOrder: category.sortOrder,
      productCount: Number(category.productCount),
      hideOutOfStock: category.hideOutOfStock,
      moveOutOfStockToBottom: category.moveOutOfStockToBottom,
      createdAt: category.createdAt,
      // Include subcategories if requested
      subcategories: includeSubcategories 
        ? (subcategoriesMap.get(category.id) || []).map(sub => ({
            id: sub.id,
            parentId: sub.parentId,
            name: sub.name,
            slug: sub.slug,
            description: sub.description,
            imageUrl: sub.imageUrl,
            sortOrder: sub.sortOrder,
            productCount: Number(sub.productCount),
            hideOutOfStock: sub.hideOutOfStock,
            moveOutOfStockToBottom: sub.moveOutOfStockToBottom,
          }))
        : undefined,
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedCategories,
    });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת הקטגוריות' },
      { status: 500 }
    );
  }
}
