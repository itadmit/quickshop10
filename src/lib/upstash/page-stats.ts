/**
 * Unified Analytics using Upstash Redis
 * 
 * ALL tracking events go to Redis first (fast, real-time)
 * Then a Cron job aggregates and saves to PostgreSQL (for historical reports)
 * 
 * This approach is:
 * - ⚡ Fast: Redis writes are sub-millisecond
 * - 🧹 Clean: PostgreSQL only gets aggregated data
 * - 📊 Accurate: Real-time + historical combined
 * 
 * Data stored:
 * - Page views per day/hour (counters)
 * - Online users (with TTL)
 * - Funnel events (counters)
 * - Recent events (list, last 100)
 */

import { redis, getTodayKey, getHourKey } from './index';

const ONLINE_USER_TTL = 300; // 5 minutes
const STATS_TTL = 60 * 60 * 24 * 90; // 90 days
const RECENT_EVENTS_LIMIT = 100; // Keep last 100 events per type

// ============================================
// PAGE VIEWS
// ============================================

/**
 * Increment page view counter
 * Uses Redis INCR for atomic, fast updates
 */
export async function incrementPageView(
  storeId: string,
  pageUrl: string,
  metadata?: {
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    utmSource?: string;
    referrer?: string;
  }
): Promise<void> {
  const today = getTodayKey();
  const hour = getHourKey();

  // Use pipeline for multiple operations in one request
  const pipeline = redis.pipeline();

  // 1. Total page views for the day
  pipeline.incr(`pv:${storeId}:${today}`);
  pipeline.expire(`pv:${storeId}:${today}`, STATS_TTL);

  // 2. Hourly page views (for traffic chart)
  pipeline.incr(`pv:${storeId}:${hour}`);
  pipeline.expire(`pv:${storeId}:${hour}`, STATS_TTL);

  // 3. Page-specific views (top pages)
  pipeline.zincrby(`pages:${storeId}:${today}`, 1, pageUrl);
  pipeline.expire(`pages:${storeId}:${today}`, STATS_TTL);

  // 4. Device type counter
  if (metadata?.deviceType) {
    pipeline.hincrby(`devices:${storeId}:${today}`, metadata.deviceType, 1);
    pipeline.expire(`devices:${storeId}:${today}`, STATS_TTL);
  }

  // 5. Traffic source counter
  if (metadata?.utmSource) {
    pipeline.zincrby(`sources:${storeId}:${today}`, 1, metadata.utmSource);
    pipeline.expire(`sources:${storeId}:${today}`, STATS_TTL);
  } else if (metadata?.referrer) {
    try {
      const domain = new URL(metadata.referrer).hostname;
      pipeline.zincrby(`sources:${storeId}:${today}`, 1, domain);
      pipeline.expire(`sources:${storeId}:${today}`, STATS_TTL);
    } catch {
      pipeline.zincrby(`sources:${storeId}:${today}`, 1, 'direct');
      pipeline.expire(`sources:${storeId}:${today}`, STATS_TTL);
    }
  } else {
    pipeline.zincrby(`sources:${storeId}:${today}`, 1, 'direct');
    pipeline.expire(`sources:${storeId}:${today}`, STATS_TTL);
  }

  await pipeline.exec();
}

// ============================================
// ONLINE USERS
// ============================================

/**
 * Track online user (heartbeat)
 * Uses Redis SET with TTL - user is "online" if key exists
 */
export async function trackOnlineUser(
  storeId: string,
  sessionId: string
): Promise<void> {
  // Add to online users set with score = current timestamp
  await redis.zadd(`online:${storeId}`, {
    score: Date.now(),
    member: sessionId,
  });
}

/**
 * Get count of online users
 * Users are considered online if they had activity in last 5 minutes
 */
export async function getOnlineUsersCount(storeId: string): Promise<number> {
  const fiveMinutesAgo = Date.now() - (ONLINE_USER_TTL * 1000);
  
  // Remove old entries first
  await redis.zremrangebyscore(`online:${storeId}`, 0, fiveMinutesAgo);
  
  // Count remaining
  return await redis.zcard(`online:${storeId}`);
}

// ============================================
// STATS RETRIEVAL (for dashboard)
// ============================================

/**
 * Get page views for a date range
 */
export async function getPageViewsForRange(
  storeId: string,
  startDate: Date,
  endDate: Date
): Promise<{ date: string; views: number }[]> {
  const results: { date: string; views: number }[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateKey = current.toISOString().split('T')[0];
    const views = await redis.get<number>(`pv:${storeId}:${dateKey}`) || 0;
    results.push({ date: dateKey, views });
    current.setDate(current.getDate() + 1);
  }

  return results;
}

/**
 * Get hourly traffic for today
 */
export async function getHourlyTraffic(
  storeId: string,
  date?: string
): Promise<{ hour: string; views: number }[]> {
  const day = date || getTodayKey();
  const results: { hour: string; views: number }[] = [];

  for (let h = 0; h < 24; h++) {
    const hourKey = `${day}:${h.toString().padStart(2, '0')}`;
    const views = await redis.get<number>(`pv:${storeId}:${hourKey}`) || 0;
    results.push({ hour: `${h}:00`, views });
  }

  return results;
}

/**
 * Get top pages for a date
 */
export async function getTopPages(
  storeId: string,
  date?: string,
  limit: number = 10
): Promise<{ page: string; views: number }[]> {
  const day = date || getTodayKey();
  const results = await redis.zrange<string[]>(`pages:${storeId}:${day}`, 0, limit - 1, {
    rev: true,
    withScores: true,
  });

  // Results come as [member, score, member, score, ...]
  const pages: { page: string; views: number }[] = [];
  for (let i = 0; i < results.length; i += 2) {
    pages.push({
      page: results[i],
      views: Number(results[i + 1]),
    });
  }

  return pages;
}

/**
 * Get traffic sources for a date
 */
export async function getTrafficSources(
  storeId: string,
  date?: string,
  limit: number = 10
): Promise<{ source: string; visits: number }[]> {
  const day = date || getTodayKey();
  const results = await redis.zrange<string[]>(`sources:${storeId}:${day}`, 0, limit - 1, {
    rev: true,
    withScores: true,
  });

  const sources: { source: string; visits: number }[] = [];
  for (let i = 0; i < results.length; i += 2) {
    sources.push({
      source: results[i],
      visits: Number(results[i + 1]),
    });
  }

  return sources;
}

/**
 * Get device breakdown for a date
 */
export async function getDeviceBreakdown(
  storeId: string,
  date?: string
): Promise<{ desktop: number; mobile: number; tablet: number }> {
  const day = date || getTodayKey();
  const data = await redis.hgetall<Record<string, string>>(`devices:${storeId}:${day}`);

  return {
    desktop: Number(data?.desktop || 0),
    mobile: Number(data?.mobile || 0),
    tablet: Number(data?.tablet || 0),
  };
}

/**
 * Get today's total page views
 */
export async function getTodayPageViews(storeId: string): Promise<number> {
  const today = getTodayKey();
  return await redis.get<number>(`pv:${storeId}:${today}`) || 0;
}

// ============================================
// FUNNEL EVENTS (all events, not just page views)
// ============================================

type FunnelEventType = 
  | 'product_view' 
  | 'add_to_cart' 
  | 'remove_from_cart'
  | 'begin_checkout' 
  | 'purchase'
  | 'search'
  | 'registration';

/**
 * Increment funnel event counter
 * Used for: ViewContent, AddToCart, Purchase, etc.
 */
export async function incrementFunnelEvent(
  storeId: string,
  eventType: FunnelEventType,
  metadata?: {
    productId?: string;
    value?: number;
    currency?: string;
  }
): Promise<void> {
  const today = getTodayKey();
  const hour = getHourKey();

  const pipeline = redis.pipeline();

  // 1. Daily counter for this event type
  pipeline.incr(`funnel:${storeId}:${eventType}:${today}`);
  pipeline.expire(`funnel:${storeId}:${eventType}:${today}`, STATS_TTL);

  // 2. Hourly counter (for charts)
  pipeline.incr(`funnel:${storeId}:${eventType}:${hour}`);
  pipeline.expire(`funnel:${storeId}:${eventType}:${hour}`, STATS_TTL);

  // 3. If product_view, track popular products
  if (eventType === 'product_view' && metadata?.productId) {
    pipeline.zincrby(`products:views:${storeId}:${today}`, 1, metadata.productId);
    pipeline.expire(`products:views:${storeId}:${today}`, STATS_TTL);
  }

  // 4. If add_to_cart, track products added to cart
  if (eventType === 'add_to_cart' && metadata?.productId) {
    pipeline.zincrby(`products:cart:${storeId}:${today}`, 1, metadata.productId);
    pipeline.expire(`products:cart:${storeId}:${today}`, STATS_TTL);
  }

  // 5. If purchase, track revenue
  if (eventType === 'purchase' && metadata?.value) {
    pipeline.incrbyfloat(`revenue:${storeId}:${today}`, metadata.value);
    pipeline.expire(`revenue:${storeId}:${today}`, STATS_TTL);
    pipeline.incr(`orders:${storeId}:${today}`);
    pipeline.expire(`orders:${storeId}:${today}`, STATS_TTL);
  }

  // 6. Store recent event (for live feed)
  const eventData = JSON.stringify({
    type: eventType,
    productId: metadata?.productId,
    value: metadata?.value,
    timestamp: Date.now(),
  });
  pipeline.lpush(`recent:${storeId}`, eventData);
  pipeline.ltrim(`recent:${storeId}`, 0, RECENT_EVENTS_LIMIT - 1);
  pipeline.expire(`recent:${storeId}`, 60 * 60 * 24); // 24 hours

  await pipeline.exec();
}

/**
 * Get funnel data for today
 */
export async function getTodayFunnel(
  storeId: string
): Promise<{
  productViews: number;
  addToCart: number;
  beginCheckout: number;
  purchases: number;
  revenue: number;
  orders: number;
}> {
  const today = getTodayKey();

  const [productViews, addToCart, beginCheckout, purchases, revenue, ordersCount] = await Promise.all([
    redis.get<number>(`funnel:${storeId}:product_view:${today}`) || 0,
    redis.get<number>(`funnel:${storeId}:add_to_cart:${today}`) || 0,
    redis.get<number>(`funnel:${storeId}:begin_checkout:${today}`) || 0,
    redis.get<number>(`funnel:${storeId}:purchase:${today}`) || 0,
    redis.get<number>(`revenue:${storeId}:${today}`) || 0,
    redis.get<number>(`orders:${storeId}:${today}`) || 0,
  ]);

  return {
    productViews: productViews || 0,
    addToCart: addToCart || 0,
    beginCheckout: beginCheckout || 0,
    purchases: purchases || 0,
    revenue: revenue || 0,
    orders: ordersCount || 0,
  };
}

/**
 * Get recent events (for live feed)
 */
export async function getRecentEvents(
  storeId: string,
  limit: number = 20
): Promise<Array<{
  type: FunnelEventType;
  productId?: string;
  value?: number;
  timestamp: number;
}>> {
  const events = await redis.lrange<string>(`recent:${storeId}`, 0, limit - 1);
  return events.map(e => JSON.parse(e));
}

/**
 * Get popular products (by views)
 */
export async function getPopularProducts(
  storeId: string,
  date?: string,
  limit: number = 10
): Promise<Array<{ productId: string; views: number }>> {
  const day = date || getTodayKey();
  const results = await redis.zrange<string[]>(
    `products:views:${storeId}:${day}`,
    0,
    limit - 1,
    { rev: true, withScores: true }
  );

  const products: Array<{ productId: string; views: number }> = [];
  for (let i = 0; i < results.length; i += 2) {
    products.push({
      productId: results[i],
      views: Number(results[i + 1]),
    });
  }
  return products;
}

/**
 * Get hourly funnel data (for charts)
 */
export async function getHourlyFunnel(
  storeId: string,
  eventType: FunnelEventType,
  date?: string
): Promise<Array<{ hour: string; count: number }>> {
  const day = date || getTodayKey();
  const results: Array<{ hour: string; count: number }> = [];

  for (let h = 0; h < 24; h++) {
    const hourKey = `${day}:${h.toString().padStart(2, '0')}`;
    const count = await redis.get<number>(`funnel:${storeId}:${eventType}:${hourKey}`) || 0;
    results.push({ hour: `${h}:00`, count });
  }

  return results;
}

