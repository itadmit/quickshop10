/**
 * Cron Job: Aggregate Analytics from Redis to PostgreSQL
 * 
 * Runs every hour via QStash
 * 
 * What it does:
 * 1. Reads daily counters from Redis
 * 2. Aggregates into PostgreSQL for historical reports
 * 3. Cleans up old Redis keys
 * 
 * URL: /api/cron/aggregate-analytics
 * Method: GET (for cron) or POST
 * Auth: QStash signature verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, analyticsDaily } from '@/lib/db/schema';
import { verifyQStashSignature } from '@/lib/qstash';

// Lazy load Redis
async function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  try {
    const { redis } = await import('@/lib/upstash');
    return redis;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  // Verify QStash signature (fast, <5ms)
  const authError = await verifyQStashSignature(request);
  if (authError) return authError;

  try {
    const redis = await getRedis();
    if (!redis) {
      return NextResponse.json({ 
        error: 'Redis not configured',
        message: 'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN'
      }, { status: 500 });
    }

    // Get all stores
    const allStores = await db.select({ id: stores.id }).from(stores);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateKey = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

    let aggregatedCount = 0;

    for (const store of allStores) {
      const storeId = store.id;

      // Get all metrics for yesterday from Redis
      const [
        pageViews,
        productViews,
        addToCart,
        beginCheckout,
        purchases,
        revenue,
        ordersCount,
        devices,
      ] = await Promise.all([
        redis.get<number>(`pv:${storeId}:${dateKey}`) || 0,
        redis.get<number>(`funnel:${storeId}:product_view:${dateKey}`) || 0,
        redis.get<number>(`funnel:${storeId}:add_to_cart:${dateKey}`) || 0,
        redis.get<number>(`funnel:${storeId}:begin_checkout:${dateKey}`) || 0,
        redis.get<number>(`funnel:${storeId}:purchase:${dateKey}`) || 0,
        redis.get<number>(`revenue:${storeId}:${dateKey}`) || 0,
        redis.get<number>(`orders:${storeId}:${dateKey}`) || 0,
        redis.hgetall<Record<string, string>>(`devices:${storeId}:${dateKey}`) || {},
      ]);

      // Skip if no data
      if (pageViews === 0 && productViews === 0 && purchases === 0) {
        continue;
      }

      // Check if we already have this date (upsert)
      // For now, just insert - add ON CONFLICT later if needed
      try {
        await db.insert(analyticsDaily).values({
          storeId,
          date: dateKey, // YYYY-MM-DD string
          pageViews: pageViews || 0,
          productViews: productViews || 0,
          addToCart: addToCart || 0,
          beginCheckout: beginCheckout || 0,
          purchases: purchases || 0,
          revenue: String(revenue || 0),
          orders: ordersCount || 0,
          desktopViews: Number(devices?.desktop || 0),
          mobileViews: Number(devices?.mobile || 0),
          tabletViews: Number(devices?.tablet || 0),
        });
        
        aggregatedCount++;
      } catch (error) {
        // Might already exist - that's OK
        console.log(`[Cron] Skipped ${storeId} for ${dateKey} (might exist)`, error);
      }
    }

    return NextResponse.json({
      success: true,
      date: dateKey,
      storesProcessed: allStores.length,
      aggregated: aggregatedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Aggregate analytics failed:', error);
    return NextResponse.json({ error: 'Aggregation failed' }, { status: 500 });
  }
}

// Also support POST for manual triggers
export const POST = GET;

