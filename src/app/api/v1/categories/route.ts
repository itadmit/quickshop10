/**
 * Public API v1 - Categories
 * GET /api/v1/categories - List categories
 * POST /api/v1/categories - Create category
 * 
 * Requires: X-API-Key header
 * Scopes: products:read, products:write
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { categories, productCategories } from '@/lib/db/schema';
import { eq, and, desc, sql, isNull } from 'drizzle-orm';
import { requireApiAuth, apiSuccess, apiError, logApiRequest } from '@/lib/api-auth';

// GET /api/v1/categories
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Authenticate
  const result = await requireApiAuth(request, 'products:read');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const parentId = searchParams.get('parent_id');
    const includeInactive = searchParams.get('include_inactive') === 'true';
    
    const offset = (page - 1) * limit;
    
    // Build conditions
    const conditions = [eq(categories.storeId, auth.store.id)];
    
    if (!includeInactive) {
      conditions.push(eq(categories.isActive, true));
    }
    
    if (parentId === 'null' || parentId === 'root') {
      conditions.push(isNull(categories.parentId));
    } else if (parentId) {
      conditions.push(eq(categories.parentId, parentId));
    }
    
    // Get categories with product count
    const categoriesData = await db
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
      .where(and(...conditions))
      .orderBy(categories.sortOrder, desc(categories.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
      .where(and(...conditions));
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    
    return apiSuccess(categoriesData.map(c => ({
      ...c,
      product_count: Number(c.product_count),
    })), {
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
    console.error('API v1 categories list error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to fetch categories', 500);
  }
}

// POST /api/v1/categories
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // Authenticate
  const result = await requireApiAuth(request, 'products:write');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return apiError('invalid_request', 'name is required', 400);
    }
    
    // Generate slug if not provided
    let slug = body.slug || body.name
      .toLowerCase()
      .replace(/[^a-z0-9\u0590-\u05ff]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Check if slug already exists
    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(
        eq(categories.storeId, auth.store.id),
        eq(categories.slug, slug)
      ))
      .limit(1);
    
    if (existing) {
      // Add random suffix
      slug = `${slug}-${Date.now().toString(36)}`;
    }
    
    // If parent_id is provided, verify it exists
    if (body.parent_id) {
      const [parent] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(
          eq(categories.id, body.parent_id),
          eq(categories.storeId, auth.store.id)
        ))
        .limit(1);
      
      if (!parent) {
        return apiError('not_found', 'Parent category not found', 404);
      }
    }
    
    const [newCategory] = await db.insert(categories).values({
      storeId: auth.store.id,
      parentId: body.parent_id || null,
      name: body.name,
      slug,
      description: body.description || null,
      imageUrl: body.image_url || null,
      sortOrder: body.sort_order || 0,
      isActive: body.is_active ?? true,
      hideOutOfStock: body.hide_out_of_stock ?? false,
      moveOutOfStockToBottom: body.move_out_of_stock_to_bottom ?? true,
    }).returning();
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 201, Date.now() - startTime);
    
    return apiSuccess({
      id: newCategory.id,
      parent_id: newCategory.parentId,
      name: newCategory.name,
      slug: newCategory.slug,
      description: newCategory.description,
      image_url: newCategory.imageUrl,
      sort_order: newCategory.sortOrder,
      is_active: newCategory.isActive,
      created_at: newCategory.createdAt,
    }, undefined, 201);
    
  } catch (error) {
    console.error('API v1 category create error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to create category', 500);
  }
}
