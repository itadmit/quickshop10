/**
 * Public API v1 - Discounts (Coupons & Automatic Discounts)
 * GET /api/v1/discounts - List discounts
 * POST /api/v1/discounts - Create discount
 * 
 * Requires: X-API-Key header
 * Scopes: discounts:read, discounts:write
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { discounts, automaticDiscounts } from '@/lib/db/schema';
import { eq, and, desc, sql, gte, lte, isNull, or } from 'drizzle-orm';
import { requireApiAuth, apiSuccess, apiError, logApiRequest } from '@/lib/api-auth';

// GET /api/v1/discounts
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Authenticate
  const result = await requireApiAuth(request, 'discounts:read');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const type = searchParams.get('type'); // 'coupon' | 'automatic' | null (both)
    const status = searchParams.get('status'); // 'active' | 'expired' | 'scheduled' | 'disabled'
    
    const offset = (page - 1) * limit;
    const now = new Date();
    
    const results: Array<{
      id: string;
      type: 'coupon' | 'automatic';
      code: string | null;
      name: string;
      title: string | null;
      description: string | null;
      discount_type: string;
      value: number;
      minimum_amount: number | null;
      usage_count: number | null;
      usage_limit: number | null;
      applies_to: string;
      category_ids: string[];
      product_ids: string[];
      starts_at: Date | null;
      ends_at: Date | null;
      is_active: boolean;
      status: 'active' | 'expired' | 'scheduled' | 'disabled';
      priority: number | null;
      stackable: boolean;
      created_at: Date;
      updated_at: Date | null;
    }> = [];
    
    // Get coupons if requested
    if (!type || type === 'coupon') {
      const couponsConditions = [eq(discounts.storeId, auth.store.id)];
      
      // Status filter for coupons
      if (status === 'active') {
        couponsConditions.push(eq(discounts.isActive, true));
        couponsConditions.push(or(
          isNull(discounts.startsAt),
          lte(discounts.startsAt, now)
        )!);
        couponsConditions.push(or(
          isNull(discounts.endsAt),
          gte(discounts.endsAt, now)
        )!);
      } else if (status === 'expired') {
        couponsConditions.push(lte(discounts.endsAt, now));
      } else if (status === 'scheduled') {
        couponsConditions.push(gte(discounts.startsAt, now));
      } else if (status === 'disabled') {
        couponsConditions.push(eq(discounts.isActive, false));
      }
      
      const coupons = await db
        .select({
          id: discounts.id,
          code: discounts.code,
          title: discounts.title,
          type: discounts.type,
          value: discounts.value,
          minimumAmount: discounts.minimumAmount,
          usageCount: discounts.usageCount,
          usageLimit: discounts.usageLimit,
          appliesTo: discounts.appliesTo,
          categoryIds: discounts.categoryIds,
          productIds: discounts.productIds,
          startsAt: discounts.startsAt,
          endsAt: discounts.endsAt,
          isActive: discounts.isActive,
          stackable: discounts.stackable,
          createdAt: discounts.createdAt,
        })
        .from(discounts)
        .where(and(...couponsConditions))
        .orderBy(desc(discounts.createdAt))
        .limit(limit)
        .offset(offset);
      
      for (const coupon of coupons) {
        let couponStatus: 'active' | 'expired' | 'scheduled' | 'disabled' = 'active';
        
        if (!coupon.isActive) {
          couponStatus = 'disabled';
        } else if (coupon.endsAt && new Date(coupon.endsAt) < now) {
          couponStatus = 'expired';
        } else if (coupon.startsAt && new Date(coupon.startsAt) > now) {
          couponStatus = 'scheduled';
        }
        
        results.push({
          id: coupon.id,
          type: 'coupon',
          code: coupon.code,
          name: coupon.code,
          title: coupon.title,
          description: null,
          discount_type: coupon.type,
          value: Number(coupon.value),
          minimum_amount: coupon.minimumAmount ? Number(coupon.minimumAmount) : null,
          usage_count: coupon.usageCount,
          usage_limit: coupon.usageLimit,
          applies_to: coupon.appliesTo,
          category_ids: (coupon.categoryIds as string[]) || [],
          product_ids: (coupon.productIds as string[]) || [],
          starts_at: coupon.startsAt,
          ends_at: coupon.endsAt,
          is_active: coupon.isActive,
          status: couponStatus,
          priority: null,
          stackable: coupon.stackable,
          created_at: coupon.createdAt,
          updated_at: null,
        });
      }
    }
    
    // Get automatic discounts if requested
    if (!type || type === 'automatic') {
      const autoConditions = [eq(automaticDiscounts.storeId, auth.store.id)];
      
      // Status filter for automatic discounts
      if (status === 'active') {
        autoConditions.push(eq(automaticDiscounts.isActive, true));
        autoConditions.push(or(
          isNull(automaticDiscounts.startsAt),
          lte(automaticDiscounts.startsAt, now)
        )!);
        autoConditions.push(or(
          isNull(automaticDiscounts.endsAt),
          gte(automaticDiscounts.endsAt, now)
        )!);
      } else if (status === 'expired') {
        autoConditions.push(lte(automaticDiscounts.endsAt, now));
      } else if (status === 'scheduled') {
        autoConditions.push(gte(automaticDiscounts.startsAt, now));
      } else if (status === 'disabled') {
        autoConditions.push(eq(automaticDiscounts.isActive, false));
      }
      
      const automatic = await db
        .select({
          id: automaticDiscounts.id,
          name: automaticDiscounts.name,
          description: automaticDiscounts.description,
          type: automaticDiscounts.type,
          value: automaticDiscounts.value,
          minimumAmount: automaticDiscounts.minimumAmount,
          appliesTo: automaticDiscounts.appliesTo,
          categoryIds: automaticDiscounts.categoryIds,
          productIds: automaticDiscounts.productIds,
          startsAt: automaticDiscounts.startsAt,
          endsAt: automaticDiscounts.endsAt,
          isActive: automaticDiscounts.isActive,
          priority: automaticDiscounts.priority,
          stackable: automaticDiscounts.stackable,
          createdAt: automaticDiscounts.createdAt,
          updatedAt: automaticDiscounts.updatedAt,
        })
        .from(automaticDiscounts)
        .where(and(...autoConditions))
        .orderBy(desc(automaticDiscounts.createdAt))
        .limit(limit)
        .offset(offset);
      
      for (const auto of automatic) {
        let autoStatus: 'active' | 'expired' | 'scheduled' | 'disabled' = 'active';
        
        if (!auto.isActive) {
          autoStatus = 'disabled';
        } else if (auto.endsAt && new Date(auto.endsAt) < now) {
          autoStatus = 'expired';
        } else if (auto.startsAt && new Date(auto.startsAt) > now) {
          autoStatus = 'scheduled';
        }
        
        results.push({
          id: auto.id,
          type: 'automatic',
          code: null,
          name: auto.name,
          title: null,
          description: auto.description,
          discount_type: auto.type,
          value: Number(auto.value),
          minimum_amount: auto.minimumAmount ? Number(auto.minimumAmount) : null,
          usage_count: null,
          usage_limit: null,
          applies_to: auto.appliesTo,
          category_ids: (auto.categoryIds as string[]) || [],
          product_ids: (auto.productIds as string[]) || [],
          starts_at: auto.startsAt,
          ends_at: auto.endsAt,
          is_active: auto.isActive,
          status: autoStatus,
          priority: auto.priority,
          stackable: auto.stackable,
          created_at: auto.createdAt,
          updated_at: auto.updatedAt,
        });
      }
    }
    
    // Sort by createdAt
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // Get total counts
    const [couponCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(discounts)
      .where(eq(discounts.storeId, auth.store.id));
    
    const [autoCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(automaticDiscounts)
      .where(eq(automaticDiscounts.storeId, auth.store.id));
    
    const totalCount = (!type) 
      ? Number(couponCount?.count || 0) + Number(autoCount?.count || 0)
      : type === 'coupon' 
        ? Number(couponCount?.count || 0)
        : Number(autoCount?.count || 0);
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    
    return apiSuccess(results.slice(0, limit), {
      pagination: {
        page,
        limit,
        total: totalCount,
        total_pages: Math.ceil(totalCount / limit),
        has_next: page * limit < totalCount,
        has_prev: page > 1,
      },
    });
    
  } catch (error) {
    console.error('API v1 discounts list error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to fetch discounts', 500);
  }
}

// POST /api/v1/discounts
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // Authenticate
  const result = await requireApiAuth(request, 'discounts:write');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const body = await request.json();
    
    // Validate required fields
    const discountType = body.type; // 'coupon' | 'automatic'
    
    if (!discountType || !['coupon', 'automatic'].includes(discountType)) {
      return apiError('invalid_request', 'type must be "coupon" or "automatic"', 400);
    }
    
    if (!body.discount_type) {
      return apiError('invalid_request', 'discount_type is required (percentage, fixed_amount, free_shipping)', 400);
    }
    
    if (body.value === undefined || body.value === null) {
      return apiError('invalid_request', 'value is required', 400);
    }
    
    if (discountType === 'coupon') {
      // Create coupon
      if (!body.code) {
        return apiError('invalid_request', 'code is required for coupons', 400);
      }
      
      // Check if code already exists
      const [existing] = await db
        .select({ id: discounts.id })
        .from(discounts)
        .where(and(
          eq(discounts.storeId, auth.store.id),
          eq(discounts.code, body.code.toUpperCase())
        ))
        .limit(1);
      
      if (existing) {
        return apiError('invalid_request', 'Coupon code already exists', 400);
      }
      
      const [newCoupon] = await db.insert(discounts).values({
        storeId: auth.store.id,
        code: body.code.toUpperCase(),
        title: body.title || null,
        type: body.discount_type,
        value: body.value.toString(),
        minimumAmount: body.minimum_amount?.toString() || null,
        usageLimit: body.usage_limit || null,
        oncePerCustomer: body.once_per_customer ?? false,
        firstOrderOnly: body.first_order_only ?? false,
        stackable: body.stackable ?? true,
        startsAt: body.starts_at ? new Date(body.starts_at) : null,
        endsAt: body.ends_at ? new Date(body.ends_at) : null,
        isActive: body.is_active ?? true,
        appliesTo: body.applies_to || 'all',
        categoryIds: body.category_ids || [],
        productIds: body.product_ids || [],
      }).returning();
      
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 201, Date.now() - startTime);
      
      return apiSuccess({
        id: newCoupon.id,
        type: 'coupon',
        code: newCoupon.code,
        discount_type: newCoupon.type,
        value: Number(newCoupon.value),
        is_active: newCoupon.isActive,
        created_at: newCoupon.createdAt,
      }, undefined, 201);
      
    } else {
      // Create automatic discount
      if (!body.name) {
        return apiError('invalid_request', 'name is required for automatic discounts', 400);
      }
      
      if (!body.applies_to) {
        return apiError('invalid_request', 'applies_to is required for automatic discounts', 400);
      }
      
      const [newAuto] = await db.insert(automaticDiscounts).values({
        storeId: auth.store.id,
        name: body.name,
        description: body.description || null,
        type: body.discount_type,
        value: body.value.toString(),
        appliesTo: body.applies_to,
        categoryIds: body.category_ids || [],
        productIds: body.product_ids || [],
        minimumAmount: body.minimum_amount?.toString() || null,
        minimumQuantity: body.minimum_quantity || null,
        startsAt: body.starts_at ? new Date(body.starts_at) : null,
        endsAt: body.ends_at ? new Date(body.ends_at) : null,
        priority: body.priority || 0,
        stackable: body.stackable ?? true,
        isActive: body.is_active ?? true,
      }).returning();
      
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 201, Date.now() - startTime);
      
      return apiSuccess({
        id: newAuto.id,
        type: 'automatic',
        name: newAuto.name,
        discount_type: newAuto.type,
        value: Number(newAuto.value),
        is_active: newAuto.isActive,
        created_at: newAuto.createdAt,
      }, undefined, 201);
    }
    
  } catch (error) {
    console.error('API v1 discounts create error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to create discount', 500);
  }
}
