/**
 * Public API v1 - Single Product
 * GET /api/v1/products/{id} - Get product details
 * PATCH /api/v1/products/{id} - Update product
 * 
 * Requires: X-API-Key header
 * Scopes: products:read, products:write
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { products, productImages, productOptions, productOptionValues, productVariants, categories } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { requireApiAuth, apiSuccess, apiError, logApiRequest } from '@/lib/api-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/products/{id}
export async function GET(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  const result = await requireApiAuth(request, 'products:read');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const { id } = await params;
    
    // Get product
    const [product] = await db
      .select()
      .from(products)
      .where(and(
        eq(products.id, id),
        eq(products.storeId, auth.store.id)
      ))
      .limit(1);
    
    if (!product) {
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 404, Date.now() - startTime);
      return apiError('not_found', 'Product not found', 404);
    }
    
    // Get images
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
      .orderBy(asc(productImages.sortOrder));
    
    // Get options
    const options = await db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, product.id))
      .orderBy(asc(productOptions.sortOrder));
    
    const optionsWithValues = await Promise.all(
      options.map(async (option) => {
        const values = await db
          .select({
            id: productOptionValues.id,
            value: productOptionValues.value,
            sort_order: productOptionValues.sortOrder,
          })
          .from(productOptionValues)
          .where(eq(productOptionValues.optionId, option.id))
          .orderBy(asc(productOptionValues.sortOrder));
        
        return {
          id: option.id,
          name: option.name,
          sort_order: option.sortOrder,
          values,
        };
      })
    );
    
    // Get variants
    const variants = await db
      .select({
        id: productVariants.id,
        title: productVariants.title,
        sku: productVariants.sku,
        barcode: productVariants.barcode,
        price: productVariants.price,
        compare_price: productVariants.comparePrice,
        cost: productVariants.cost,
        inventory: productVariants.inventory,
        weight: productVariants.weight,
        image_url: productVariants.imageUrl,
        option1: productVariants.option1,
        option2: productVariants.option2,
        option3: productVariants.option3,
        is_active: productVariants.isActive,
      })
      .from(productVariants)
      .where(eq(productVariants.productId, product.id))
      .orderBy(asc(productVariants.sortOrder));
    
    // Get category
    let category = null;
    if (product.categoryId) {
      const [cat] = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        })
        .from(categories)
        .where(eq(categories.id, product.categoryId))
        .limit(1);
      category = cat || null;
    }
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    
    return apiSuccess({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      short_description: product.shortDescription,
      price: product.price ? Number(product.price) : null,
      compare_price: product.comparePrice ? Number(product.comparePrice) : null,
      cost: product.cost ? Number(product.cost) : null,
      sku: product.sku,
      barcode: product.barcode,
      weight: product.weight ? Number(product.weight) : null,
      has_variants: product.hasVariants,
      track_inventory: product.trackInventory,
      inventory: product.inventory,
      allow_backorder: product.allowBackorder,
      is_active: product.isActive,
      is_featured: product.isFeatured,
      seo_title: product.seoTitle,
      seo_description: product.seoDescription,
      metadata: product.metadata,
      created_at: product.createdAt,
      updated_at: product.updatedAt,
      category,
      images,
      options: optionsWithValues,
      variants: variants.map(v => ({
        ...v,
        price: Number(v.price),
        compare_price: v.compare_price ? Number(v.compare_price) : null,
        cost: v.cost ? Number(v.cost) : null,
        weight: v.weight ? Number(v.weight) : null,
      })),
    });
    
  } catch (error) {
    console.error('API v1 product detail error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to fetch product', 500);
  }
}

// PATCH /api/v1/products/{id}
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  const result = await requireApiAuth(request, 'products:write');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Verify product exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(and(
        eq(products.id, id),
        eq(products.storeId, auth.store.id)
      ))
      .limit(1);
    
    if (!existingProduct) {
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 404, Date.now() - startTime);
      return apiError('not_found', 'Product not found', 404);
    }
    
    // Build update
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    
    // Allowed fields for update
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.short_description !== undefined) updateData.shortDescription = body.short_description;
    if (body.price !== undefined) updateData.price = body.price?.toString();
    if (body.compare_price !== undefined) updateData.comparePrice = body.compare_price?.toString() || null;
    if (body.cost !== undefined) updateData.cost = body.cost?.toString() || null;
    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.barcode !== undefined) updateData.barcode = body.barcode;
    if (body.weight !== undefined) updateData.weight = body.weight?.toString() || null;
    if (body.inventory !== undefined && !existingProduct.hasVariants) {
      updateData.inventory = body.inventory;
    }
    if (body.is_active !== undefined) updateData.isActive = body.is_active;
    if (body.is_featured !== undefined) updateData.isFeatured = body.is_featured;
    if (body.seo_title !== undefined) updateData.seoTitle = body.seo_title;
    if (body.seo_description !== undefined) updateData.seoDescription = body.seo_description;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    
    // Update product
    const [updated] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    
    return apiSuccess({
      id: updated.id,
      name: updated.name,
      price: updated.price ? Number(updated.price) : null,
      inventory: updated.inventory,
      is_active: updated.isActive,
      updated_at: updated.updatedAt,
    });
    
  } catch (error) {
    console.error('API v1 product update error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to update product', 500);
  }
}

