/**
 * Public API v1 - Single Discount
 * GET /api/v1/discounts/{id} - Get discount
 * PATCH /api/v1/discounts/{id} - Update discount
 * DELETE /api/v1/discounts/{id} - Delete discount
 * 
 * Requires: X-API-Key header
 * Scopes: discounts:read, discounts:write
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { discounts, automaticDiscounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireApiAuth, apiSuccess, apiError, logApiRequest } from '@/lib/api-auth';

// GET /api/v1/discounts/{id}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;
  
  // Authenticate
  const result = await requireApiAuth(request, 'discounts:read');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    // Try to find as coupon first
    const [coupon] = await db
      .select()
      .from(discounts)
      .where(and(eq(discounts.id, id), eq(discounts.storeId, auth.store.id)))
      .limit(1);
    
    if (coupon) {
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
      
      const now = new Date();
      let status: 'active' | 'expired' | 'scheduled' | 'disabled' = 'active';
      if (!coupon.isActive) {
        status = 'disabled';
      } else if (coupon.endsAt && new Date(coupon.endsAt) < now) {
        status = 'expired';
      } else if (coupon.startsAt && new Date(coupon.startsAt) > now) {
        status = 'scheduled';
      }
      
      return apiSuccess({
        id: coupon.id,
        type: 'coupon',
        code: coupon.code,
        title: coupon.title,
        discount_type: coupon.type,
        value: Number(coupon.value),
        minimum_amount: coupon.minimumAmount ? Number(coupon.minimumAmount) : null,
        usage_count: coupon.usageCount,
        usage_limit: coupon.usageLimit,
        once_per_customer: coupon.oncePerCustomer,
        first_order_only: coupon.firstOrderOnly,
        stackable: coupon.stackable,
        applies_to: coupon.appliesTo,
        category_ids: coupon.categoryIds || [],
        product_ids: coupon.productIds || [],
        starts_at: coupon.startsAt,
        ends_at: coupon.endsAt,
        is_active: coupon.isActive,
        status,
        created_at: coupon.createdAt,
      });
    }
    
    // Try automatic discount
    const [auto] = await db
      .select()
      .from(automaticDiscounts)
      .where(and(eq(automaticDiscounts.id, id), eq(automaticDiscounts.storeId, auth.store.id)))
      .limit(1);
    
    if (auto) {
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
      
      const now = new Date();
      let status: 'active' | 'expired' | 'scheduled' | 'disabled' = 'active';
      if (!auto.isActive) {
        status = 'disabled';
      } else if (auto.endsAt && new Date(auto.endsAt) < now) {
        status = 'expired';
      } else if (auto.startsAt && new Date(auto.startsAt) > now) {
        status = 'scheduled';
      }
      
      return apiSuccess({
        id: auto.id,
        type: 'automatic',
        name: auto.name,
        description: auto.description,
        discount_type: auto.type,
        value: Number(auto.value),
        minimum_amount: auto.minimumAmount ? Number(auto.minimumAmount) : null,
        minimum_quantity: auto.minimumQuantity,
        applies_to: auto.appliesTo,
        category_ids: auto.categoryIds || [],
        product_ids: auto.productIds || [],
        starts_at: auto.startsAt,
        ends_at: auto.endsAt,
        priority: auto.priority,
        stackable: auto.stackable,
        is_active: auto.isActive,
        status,
        created_at: auto.createdAt,
        updated_at: auto.updatedAt,
      });
    }
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 404, Date.now() - startTime);
    return apiError('not_found', 'Discount not found', 404);
    
  } catch (error) {
    console.error('API v1 discount get error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to fetch discount', 500);
  }
}

// PATCH /api/v1/discounts/{id}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;
  
  // Authenticate
  const result = await requireApiAuth(request, 'discounts:write');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const body = await request.json();
    
    // Try to find as coupon first
    const [coupon] = await db
      .select({ id: discounts.id })
      .from(discounts)
      .where(and(eq(discounts.id, id), eq(discounts.storeId, auth.store.id)))
      .limit(1);
    
    if (coupon) {
      // Update coupon
      const updateData: Record<string, unknown> = {};
      
      if (body.code !== undefined) updateData.code = body.code.toUpperCase();
      if (body.title !== undefined) updateData.title = body.title;
      if (body.discount_type !== undefined) updateData.type = body.discount_type;
      if (body.value !== undefined) updateData.value = body.value.toString();
      if (body.minimum_amount !== undefined) updateData.minimumAmount = body.minimum_amount?.toString() || null;
      if (body.usage_limit !== undefined) updateData.usageLimit = body.usage_limit;
      if (body.once_per_customer !== undefined) updateData.oncePerCustomer = body.once_per_customer;
      if (body.first_order_only !== undefined) updateData.firstOrderOnly = body.first_order_only;
      if (body.stackable !== undefined) updateData.stackable = body.stackable;
      if (body.applies_to !== undefined) updateData.appliesTo = body.applies_to;
      if (body.category_ids !== undefined) updateData.categoryIds = body.category_ids;
      if (body.product_ids !== undefined) updateData.productIds = body.product_ids;
      if (body.starts_at !== undefined) updateData.startsAt = body.starts_at ? new Date(body.starts_at) : null;
      if (body.ends_at !== undefined) updateData.endsAt = body.ends_at ? new Date(body.ends_at) : null;
      if (body.is_active !== undefined) updateData.isActive = body.is_active;
      
      if (Object.keys(updateData).length === 0) {
        return apiError('invalid_request', 'No valid fields to update', 400);
      }
      
      const [updated] = await db
        .update(discounts)
        .set(updateData)
        .where(and(eq(discounts.id, id), eq(discounts.storeId, auth.store.id)))
        .returning();
      
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
      
      return apiSuccess({
        id: updated.id,
        type: 'coupon',
        code: updated.code,
        discount_type: updated.type,
        value: Number(updated.value),
        is_active: updated.isActive,
      });
    }
    
    // Try automatic discount
    const [auto] = await db
      .select({ id: automaticDiscounts.id })
      .from(automaticDiscounts)
      .where(and(eq(automaticDiscounts.id, id), eq(automaticDiscounts.storeId, auth.store.id)))
      .limit(1);
    
    if (auto) {
      // Update automatic discount
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      
      if (body.name !== undefined) updateData.name = body.name;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.discount_type !== undefined) updateData.type = body.discount_type;
      if (body.value !== undefined) updateData.value = body.value.toString();
      if (body.minimum_amount !== undefined) updateData.minimumAmount = body.minimum_amount?.toString() || null;
      if (body.minimum_quantity !== undefined) updateData.minimumQuantity = body.minimum_quantity;
      if (body.applies_to !== undefined) updateData.appliesTo = body.applies_to;
      if (body.category_ids !== undefined) updateData.categoryIds = body.category_ids;
      if (body.product_ids !== undefined) updateData.productIds = body.product_ids;
      if (body.starts_at !== undefined) updateData.startsAt = body.starts_at ? new Date(body.starts_at) : null;
      if (body.ends_at !== undefined) updateData.endsAt = body.ends_at ? new Date(body.ends_at) : null;
      if (body.priority !== undefined) updateData.priority = body.priority;
      if (body.stackable !== undefined) updateData.stackable = body.stackable;
      if (body.is_active !== undefined) updateData.isActive = body.is_active;
      
      const [updated] = await db
        .update(automaticDiscounts)
        .set(updateData)
        .where(and(eq(automaticDiscounts.id, id), eq(automaticDiscounts.storeId, auth.store.id)))
        .returning();
      
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
      
      return apiSuccess({
        id: updated.id,
        type: 'automatic',
        name: updated.name,
        discount_type: updated.type,
        value: Number(updated.value),
        is_active: updated.isActive,
      });
    }
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 404, Date.now() - startTime);
    return apiError('not_found', 'Discount not found', 404);
    
  } catch (error) {
    console.error('API v1 discount update error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to update discount', 500);
  }
}

// DELETE /api/v1/discounts/{id}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;
  
  // Authenticate
  const result = await requireApiAuth(request, 'discounts:write');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    // Try to delete coupon first
    const couponResult = await db
      .delete(discounts)
      .where(and(eq(discounts.id, id), eq(discounts.storeId, auth.store.id)))
      .returning({ id: discounts.id });
    
    if (couponResult.length > 0) {
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
      return apiSuccess({ deleted: true, id });
    }
    
    // Try automatic discount
    const autoResult = await db
      .delete(automaticDiscounts)
      .where(and(eq(automaticDiscounts.id, id), eq(automaticDiscounts.storeId, auth.store.id)))
      .returning({ id: automaticDiscounts.id });
    
    if (autoResult.length > 0) {
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
      return apiSuccess({ deleted: true, id });
    }
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 404, Date.now() - startTime);
    return apiError('not_found', 'Discount not found', 404);
    
  } catch (error) {
    console.error('API v1 discount delete error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to delete discount', 500);
  }
}
