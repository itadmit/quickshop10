/**
 * Public API v1 - Products
 * GET /api/v1/products - List products
 * POST /api/v1/products - Create product
 * 
 * Requires: X-API-Key header
 * Scopes: products:read, products:write
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { products, productImages, productVariants, categories } from '@/lib/db/schema';
import { eq, and, desc, asc, sql, like, or } from 'drizzle-orm';
import { requireApiAuth, apiSuccess, apiError, logApiRequest } from '@/lib/api-auth';

// GET /api/v1/products
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  const result = await requireApiAuth(request, 'products:read');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const status = searchParams.get('status'); // active, draft, all
    const categoryId = searchParams.get('category_id');
    const query = searchParams.get('query');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const fields = searchParams.get('fields')?.split(',');
    
    const offset = (page - 1) * limit;
    
    // Build conditions
    const conditions = [eq(products.storeId, auth.store.id)];
    
    if (status === 'active') {
      conditions.push(eq(products.isActive, true));
    } else if (status === 'draft') {
      conditions.push(eq(products.isActive, false));
    }
    
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }
    
    if (query) {
      conditions.push(
        or(
          like(products.name, `%${query}%`),
          like(products.sku, `%${query}%`),
          like(products.barcode, `%${query}%`)
        )!
      );
    }
    
    // Sort
    const orderColumn = sortBy === 'name' ? products.name :
                       sortBy === 'price' ? products.price :
                       sortBy === 'inventory' ? products.inventory :
                       sortBy === 'updated_at' ? products.updatedAt :
                       products.createdAt;
    const orderDir = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);
    
    // Get products
    const productsData = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        short_description: products.shortDescription,
        price: products.price,
        compare_price: products.comparePrice,
        cost: products.cost,
        sku: products.sku,
        barcode: products.barcode,
        weight: products.weight,
        has_variants: products.hasVariants,
        track_inventory: products.trackInventory,
        inventory: products.inventory,
        allow_backorder: products.allowBackorder,
        is_active: products.isActive,
        is_featured: products.isFeatured,
        category_id: products.categoryId,
        seo_title: products.seoTitle,
        seo_description: products.seoDescription,
        created_at: products.createdAt,
        updated_at: products.updatedAt,
      })
      .from(products)
      .where(and(...conditions))
      .orderBy(orderDir)
      .limit(limit)
      .offset(offset);
    
    // Get images for each product
    const productsWithImages = await Promise.all(
      productsData.map(async (product) => {
        const images = await db
          .select({
            id: productImages.id,
            url: productImages.url,
            alt: productImages.alt,
            sort_order: productImages.sortOrder,
            is_primary: productImages.isPrimary,
          })
          .from(productImages)
          .where(eq(productImages.productId, product.id))
          .orderBy(asc(productImages.sortOrder))
          .limit(10);
        
        return {
          ...product,
          price: product.price ? Number(product.price) : null,
          compare_price: product.compare_price ? Number(product.compare_price) : null,
          cost: product.cost ? Number(product.cost) : null,
          weight: product.weight ? Number(product.weight) : null,
          images,
        };
      })
    );
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(...conditions));
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    
    return apiSuccess(productsWithImages, {
      pagination: {
        page,
        limit,
        total: Number(count),
        total_pages: Math.ceil(Number(count) / limit),
        has_next: page * limit < Number(count),
        has_prev: page > 1,
      },
    });
    
  } catch (error) {
    console.error('API v1 products list error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to fetch products', 500);
  }
}

