/**
 * Public API v1 - Single Category
 * GET /api/v1/categories/{id} - Get category
 * PATCH /api/v1/categories/{id} - Update category
 * DELETE /api/v1/categories/{id} - Delete category
 * 
 * Requires: X-API-Key header
 * Scopes: products:read, products:write
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { categories, productCategories } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireApiAuth, apiSuccess, apiError, logApiRequest } from '@/lib/api-auth';

// GET /api/v1/categories/{id}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;
  
  // Authenticate
  const result = await requireApiAuth(request, 'products:read');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const [category] = await db
      .select({
        id: categories.id,
        parent_id: categories.parentId,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        image_url: categories.imageUrl,
        sort_order: categories.sortOrder,
        is_active: categories.isActive,
        hide_out_of_stock: categories.hideOutOfStock,
        move_out_of_stock_to_bottom: categories.moveOutOfStockToBottom,
        created_at: categories.createdAt,
        product_count: sql<number>`(
          SELECT COUNT(*) FROM product_categories 
          WHERE product_categories.category_id = ${categories.id}
        )`,
      })
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.storeId, auth.store.id)))
      .limit(1);
    
    if (!category) {
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 404, Date.now() - startTime);
      return apiError('not_found', 'Category not found', 404);
    }
    
    // Get child categories
    const children = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        is_active: categories.isActive,
      })
      .from(categories)
      .where(and(
        eq(categories.parentId, id),
        eq(categories.storeId, auth.store.id)
      ))
      .orderBy(categories.sortOrder);
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    
    return apiSuccess({
      ...category,
      product_count: Number(category.product_count),
      children,
    });
    
  } catch (error) {
    console.error('API v1 category get error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to fetch category', 500);
  }
}

// PATCH /api/v1/categories/{id}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;
  
  // Authenticate
  const result = await requireApiAuth(request, 'products:write');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const body = await request.json();
    
    // Check if category exists
    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.storeId, auth.store.id)))
      .limit(1);
    
    if (!existing) {
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 404, Date.now() - startTime);
      return apiError('not_found', 'Category not found', 404);
    }
    
    // Build update object
    const updateData: Record<string, unknown> = {};
    
    if (body.parent_id !== undefined) {
      if (body.parent_id === id) {
        return apiError('invalid_request', 'Category cannot be its own parent', 400);
      }
      updateData.parentId = body.parent_id;
    }
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.image_url !== undefined) updateData.imageUrl = body.image_url;
    if (body.sort_order !== undefined) updateData.sortOrder = body.sort_order;
    if (body.is_active !== undefined) updateData.isActive = body.is_active;
    if (body.hide_out_of_stock !== undefined) updateData.hideOutOfStock = body.hide_out_of_stock;
    if (body.move_out_of_stock_to_bottom !== undefined) updateData.moveOutOfStockToBottom = body.move_out_of_stock_to_bottom;
    
    if (Object.keys(updateData).length === 0) {
      return apiError('invalid_request', 'No valid fields to update', 400);
    }
    
    const [updated] = await db
      .update(categories)
      .set(updateData)
      .where(and(eq(categories.id, id), eq(categories.storeId, auth.store.id)))
      .returning();
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    
    return apiSuccess({
      id: updated.id,
      parent_id: updated.parentId,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      image_url: updated.imageUrl,
      sort_order: updated.sortOrder,
      is_active: updated.isActive,
    });
    
  } catch (error) {
    console.error('API v1 category update error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to update category', 500);
  }
}

// DELETE /api/v1/categories/{id}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;
  
  // Authenticate
  const result = await requireApiAuth(request, 'products:write');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    // Check for child categories
    const [childCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
      .where(and(
        eq(categories.parentId, id),
        eq(categories.storeId, auth.store.id)
      ));
    
    if (Number(childCount?.count) > 0) {
      return apiError('invalid_request', 'Cannot delete category with subcategories', 400);
    }
    
    // Delete category (product_categories will cascade)
    const deleteResult = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.storeId, auth.store.id)))
      .returning({ id: categories.id });
    
    if (deleteResult.length === 0) {
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 404, Date.now() - startTime);
      return apiError('not_found', 'Category not found', 404);
    }
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    return apiSuccess({ deleted: true, id });
    
  } catch (error) {
    console.error('API v1 category delete error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to delete category', 500);
  }
}
