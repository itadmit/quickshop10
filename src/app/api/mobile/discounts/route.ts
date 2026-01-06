/**
 * Mobile Discounts List API
 * GET /api/mobile/discounts
 * 
 * Returns list of coupons and automatic discounts for the store
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { discounts, automaticDiscounts, orders } from '@/lib/db/schema';
import { eq, and, sql, desc, gte, lte, isNull, or } from 'drizzle-orm';
import { requireMobileAuthWithStore } from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuthWithStore(request);
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const type = searchParams.get('type'); // 'coupon', 'automatic', 'all'
    const status = searchParams.get('status'); // 'active', 'expired', 'scheduled', 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    
    const offset = (page - 1) * limit;
    const now = new Date();
    
    const results: Array<{
      id: string;
      type: 'coupon' | 'automatic';
      code: string | null;
      name: string;
      discountType: string;
      value: number;
      usageCount: number;
      usageLimit: number | null;
      startsAt: Date | null;
      endsAt: Date | null;
      isActive: boolean;
      status: 'active' | 'expired' | 'scheduled' | 'disabled';
      createdAt: Date;
    }> = [];
    
    // Get coupons if requested
    if (!type || type === 'coupon' || type === 'all') {
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
      }
      
      const coupons = await db
        .select({
          id: discounts.id,
          code: discounts.code,
          type: discounts.type,
          value: discounts.value,
          usageCount: discounts.usageCount,
          usageLimit: discounts.usageLimit,
          startsAt: discounts.startsAt,
          endsAt: discounts.endsAt,
          isActive: discounts.isActive,
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
          discountType: coupon.type,
          value: Number(coupon.value),
          usageCount: coupon.usageCount ?? 0,
          usageLimit: coupon.usageLimit,
          startsAt: coupon.startsAt,
          endsAt: coupon.endsAt,
          isActive: coupon.isActive,
          status: couponStatus,
          createdAt: coupon.createdAt,
        });
      }
    }
    
    // Get automatic discounts if requested
    if (!type || type === 'automatic' || type === 'all') {
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
      }
      
      const automatic = await db
        .select({
          id: automaticDiscounts.id,
          name: automaticDiscounts.name,
          type: automaticDiscounts.type,
          value: automaticDiscounts.value,
          startsAt: automaticDiscounts.startsAt,
          endsAt: automaticDiscounts.endsAt,
          isActive: automaticDiscounts.isActive,
          createdAt: automaticDiscounts.createdAt,
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
          discountType: auto.type,
          value: Number(auto.value),
          usageCount: 0,
          usageLimit: null,
          startsAt: auto.startsAt,
          endsAt: auto.endsAt,
          isActive: auto.isActive,
          status: autoStatus,
          createdAt: auto.createdAt,
        });
      }
    }
    
    // Sort by createdAt
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Get stats
    const [couponStats] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where ${discounts.isActive} = true and (${discounts.endsAt} is null or ${discounts.endsAt} > now()) and (${discounts.startsAt} is null or ${discounts.startsAt} <= now()))`,
      })
      .from(discounts)
      .where(eq(discounts.storeId, auth.store.id));
    
    const [autoStats] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where ${automaticDiscounts.isActive} = true and (${automaticDiscounts.endsAt} is null or ${automaticDiscounts.endsAt} > now()) and (${automaticDiscounts.startsAt} is null or ${automaticDiscounts.startsAt} <= now()))`,
      })
      .from(automaticDiscounts)
      .where(eq(automaticDiscounts.storeId, auth.store.id));
    
    return NextResponse.json({
      success: true,
      discounts: results.slice(0, limit),
      pagination: {
        page,
        limit,
        total: results.length,
        totalPages: Math.ceil(results.length / limit),
      },
      stats: {
        coupons: {
          total: Number(couponStats?.total || 0),
          active: Number(couponStats?.active || 0),
        },
        automatic: {
          total: Number(autoStats?.total || 0),
          active: Number(autoStats?.active || 0),
        },
      },
    });
    
  } catch (error) {
    console.error('Mobile discounts list error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch discounts' },
      { status: 500 }
    );
  }
}

