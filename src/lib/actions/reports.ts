'use server';

import { db } from '@/lib/db';
import { 
  orders, orderItems, customers, products, categories,
  analyticsEvents, searchQueries, abandonedCarts,
  giftCards, influencers, influencerSales, refunds,
  customerCreditTransactions, productImages, discounts,
  gamificationWins, gamificationCampaigns, productVariants
} from '@/lib/db/schema';
import { eq, and, gte, lte, desc, asc, sql, count, sum, inArray } from 'drizzle-orm';
import { cache } from 'react';

// ============ TYPES ============

export type DateRange = {
  from: Date;
  to: Date;
};

export type SalesOverview = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  conversionRate: number;
};

export type SalesByDay = {
  date: string;
  revenue: number;
  orders: number;
};

export type TopProduct = {
  id: string;
  name: string;
  image: string | null;
  revenue: number;
  quantity: number;
  orders: number;
};

export type TrafficSource = {
  source: string;
  sessions: number;
  orders: number;
  revenue: number;
  conversionRate: number;
};

export type CustomerSegment = {
  segment: string;
  count: number;
  revenue: number;
  percentage: number;
};

// ============ HELPER FUNCTIONS ============

function getDateRange(period: '7d' | '30d' | '90d' | 'custom', customRange?: DateRange): DateRange {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  
  let from: Date;
  switch (period) {
    case '7d':
      from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'custom':
      return customRange || { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to };
  }
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

// ============ SALES REPORTS ============

// Main overview - cached per request
export const getSalesOverview = cache(async (
  storeId: string, 
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: DateRange
) => {
  const { from, to } = getDateRange(period, customRange);
  
  // Use SQL aggregations for speed - single query
  const [salesStats] = await db
    .select({
      totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${orders.status} != 'cancelled' THEN ${orders.total}::numeric ELSE 0 END), 0)`,
      totalOrders: sql<number>`COUNT(CASE WHEN ${orders.status} != 'cancelled' THEN 1 END)`,
      avgOrderValue: sql<number>`COALESCE(AVG(CASE WHEN ${orders.status} != 'cancelled' THEN ${orders.total}::numeric END), 0)`,
    })
    .from(orders)
    .where(and(
      eq(orders.storeId, storeId),
      gte(orders.createdAt, from),
      lte(orders.createdAt, to)
    ));

  // Customer stats - parallel query
  const [customerStats] = await db
    .select({
      total: sql<number>`COUNT(DISTINCT ${customers.id})`,
      newCustomers: sql<number>`COUNT(DISTINCT CASE WHEN ${customers.createdAt} >= ${from} THEN ${customers.id} END)`,
    })
    .from(customers)
    .where(eq(customers.storeId, storeId));

  // Sessions for conversion rate
  const [sessionStats] = await db
    .select({
      sessions: sql<number>`COUNT(DISTINCT ${analyticsEvents.sessionId})`,
    })
    .from(analyticsEvents)
    .where(and(
      eq(analyticsEvents.storeId, storeId),
      eq(analyticsEvents.eventType, 'page_view'),
      gte(analyticsEvents.createdAt, from),
      lte(analyticsEvents.createdAt, to)
    ));

  const totalOrders = Number(salesStats?.totalOrders || 0);
  const sessions = Number(sessionStats?.sessions || 1);

  return {
    totalRevenue: Number(salesStats?.totalRevenue || 0),
    totalOrders,
    averageOrderValue: Number(salesStats?.avgOrderValue || 0),
    totalCustomers: Number(customerStats?.total || 0),
    newCustomers: Number(customerStats?.newCustomers || 0),
    returningCustomers: Number(customerStats?.total || 0) - Number(customerStats?.newCustomers || 0),
    conversionRate: sessions > 0 ? (totalOrders / sessions) * 100 : 0,
  };
});

// Sales by day - for charts (or by hour if single day)
export const getSalesByDay = cache(async (
  storeId: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: DateRange
) => {
  const { from, to } = getDateRange(period, customRange);

  // Check if it's a single day (less than 25 hours difference)
  const isSingleDay = (to.getTime() - from.getTime()) < 25 * 60 * 60 * 1000;
  
  if (isSingleDay) {
    // Group by hour for single day - get actual data
    const result = await db
      .select({
        date: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD HH24:00:00')`,
        revenue: sql<number>`COALESCE(SUM(CASE WHEN ${orders.status} != 'cancelled' THEN ${orders.total}::numeric ELSE 0 END), 0)`,
        orderCount: sql<number>`COUNT(CASE WHEN ${orders.status} != 'cancelled' THEN 1 END)`,
      })
      .from(orders)
      .where(and(
        eq(orders.storeId, storeId),
        gte(orders.createdAt, from),
        lte(orders.createdAt, to)
      ))
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD HH24:00:00')`)
      .orderBy(asc(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD HH24:00:00')`));

    // Create a map of hour -> data
    const dataMap = new Map<string, { revenue: number; orders: number }>();
    result.forEach(r => {
      const dateStr = String(r.date);
      dataMap.set(dateStr, {
        revenue: parseFloat(String(r.revenue)) || 0,
        orders: parseInt(String(r.orderCount)) || 0,
      });
    });

    // Generate all 24 hours for the day
    const dayStart = new Date(from);
    dayStart.setHours(0, 0, 0, 0);
    const allHours: Array<{ date: string; revenue: number; orders: number }> = [];
    
    // Get the date string in YYYY-MM-DD format
    const year = dayStart.getFullYear();
    const month = String(dayStart.getMonth() + 1).padStart(2, '0');
    const day = String(dayStart.getDate()).padStart(2, '0');
    
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = String(hour).padStart(2, '0');
      const dateStr = `${year}-${month}-${day} ${hourStr}:00:00`;
      
      const data = dataMap.get(dateStr) || { revenue: 0, orders: 0 };
      allHours.push({
        date: dateStr,
        revenue: data.revenue,
        orders: data.orders,
      });
    }

    return allHours;
  } else {
    // Group by day for multiple days
  const result = await db
    .select({
      date: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
      revenue: sql<number>`COALESCE(SUM(CASE WHEN ${orders.status} != 'cancelled' THEN ${orders.total}::numeric ELSE 0 END), 0)`,
      orderCount: sql<number>`COUNT(CASE WHEN ${orders.status} != 'cancelled' THEN 1 END)`,
    })
    .from(orders)
    .where(and(
      eq(orders.storeId, storeId),
      gte(orders.createdAt, from),
      lte(orders.createdAt, to)
    ))
    .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(asc(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`));

  return result.map(r => ({
    date: String(r.date),
    revenue: parseFloat(String(r.revenue)) || 0,
    orders: parseInt(String(r.orderCount)) || 0,
  }));
  }
});

// Top products
export const getTopProducts = cache(async (
  storeId: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  limit = 10,
  customRange?: DateRange
) => {
  const { from, to } = getDateRange(period, customRange);

  const result = await db
    .select({
      id: products.id,
      name: products.name,
      image: productImages.url,
      revenue: sql<number>`COALESCE(SUM(${orderItems.total}::numeric), 0)`,
      quantity: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      orders: sql<number>`COUNT(DISTINCT ${orders.id})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(productImages, and(
      eq(productImages.productId, products.id),
      eq(productImages.isPrimary, true)
    ))
    .where(and(
      eq(orders.storeId, storeId),
      gte(orders.createdAt, from),
      lte(orders.createdAt, to),
      sql`${orders.status} != 'cancelled'`
    ))
    .groupBy(products.id, products.name, productImages.url)
    .orderBy(desc(sql`SUM(${orderItems.total}::numeric)`))
    .limit(limit);

  return result.map(r => ({
    id: r.id,
    name: r.name,
    image: r.image,
    revenue: Number(r.revenue),
    quantity: Number(r.quantity),
    orders: Number(r.orders),
  }));
});

// Sales by category
export const getSalesByCategory = cache(async (
  storeId: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: DateRange
) => {
  const { from, to } = getDateRange(period, customRange);

  const result = await db
    .select({
      id: sql<string>`COALESCE(${categories.id}::text, 'uncategorized')`,
      name: sql<string>`COALESCE(${categories.name}, 'ללא קטגוריה')`,
      revenue: sql<number>`COALESCE(SUM(${orderItems.total}::numeric), 0)`,
      quantity: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      orders: sql<number>`COUNT(DISTINCT ${orders.id})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .leftJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(
      eq(orders.storeId, storeId),
      gte(orders.createdAt, from),
      lte(orders.createdAt, to),
      sql`${orders.status} != 'cancelled'`
    ))
    .groupBy(categories.id, categories.name)
    .orderBy(desc(sql`SUM(${orderItems.total}::numeric)`));

  return result.map(r => ({
    id: String(r.id),
    name: String(r.name),
    revenue: Number(r.revenue),
    quantity: Number(r.quantity),
    orders: Number(r.orders),
  }));
});

// ============ TRAFFIC REPORTS ============

export const getTrafficSources = cache(async (
  storeId: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: DateRange
) => {
  const { from, to } = getDateRange(period, customRange);

  // Sessions by source from analytics events
  const sessions = await db
    .select({
      source: sql<string>`COALESCE(${analyticsEvents.utmSource}, 'direct')`,
      sessions: sql<number>`COUNT(DISTINCT ${analyticsEvents.sessionId})`,
    })
    .from(analyticsEvents)
    .where(and(
      eq(analyticsEvents.storeId, storeId),
      eq(analyticsEvents.eventType, 'page_view'),
      gte(analyticsEvents.createdAt, from),
      lte(analyticsEvents.createdAt, to)
    ))
    .groupBy(sql`COALESCE(${analyticsEvents.utmSource}, 'direct')`)
    .orderBy(desc(sql`COUNT(DISTINCT ${analyticsEvents.sessionId})`));

  // If no analytics data, create fallback from order data
  if (sessions.length === 0) {
    // Get order stats as fallback - group by UTM source if available in metadata
    const ordersBySource = await db
      .select({
        totalOrders: sql<number>`COUNT(*)`,
        totalRevenue: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`,
      })
      .from(orders)
      .where(and(
        eq(orders.storeId, storeId),
        gte(orders.createdAt, from),
        lte(orders.createdAt, to),
        sql`${orders.status} != 'cancelled'`
      ));

    const totalOrders = Number(ordersBySource[0]?.totalOrders || 0);
    const totalRevenue = Number(ordersBySource[0]?.totalRevenue || 0);

    if (totalOrders > 0) {
      // Return a single "direct" source with all orders
      // Estimate sessions based on typical conversion rate (~2-3%)
      const estimatedSessions = Math.round(totalOrders * 40); // ~2.5% conversion
      
      return [{
        source: 'direct',
        sessions: estimatedSessions,
        orders: totalOrders,
        revenue: totalRevenue,
        conversionRate: (totalOrders / estimatedSessions) * 100,
      }];
    }

    return [];
  }

  // Purchases by source
  const purchases = await db
    .select({
      source: sql<string>`COALESCE(${analyticsEvents.utmSource}, 'direct')`,
      orders: sql<number>`COUNT(*)`,
      revenue: sql<number>`COALESCE(SUM(${analyticsEvents.orderValue}::numeric), 0)`,
    })
    .from(analyticsEvents)
    .where(and(
      eq(analyticsEvents.storeId, storeId),
      eq(analyticsEvents.eventType, 'purchase'),
      gte(analyticsEvents.createdAt, from),
      lte(analyticsEvents.createdAt, to)
    ))
    .groupBy(sql`COALESCE(${analyticsEvents.utmSource}, 'direct')`);

  // Merge data
  const purchaseMap = new Map(purchases.map(p => [p.source, { orders: Number(p.orders), revenue: Number(p.revenue) }]));

  return sessions.map(s => {
    const purchase = purchaseMap.get(s.source) || { orders: 0, revenue: 0 };
    const sessionCount = Number(s.sessions);
    return {
      source: s.source,
      sessions: sessionCount,
      orders: purchase.orders,
      revenue: purchase.revenue,
      conversionRate: sessionCount > 0 ? (purchase.orders / sessionCount) * 100 : 0,
    };
  });
});

export const getDeviceStats = cache(async (
  storeId: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: DateRange
) => {
  const { from, to } = getDateRange(period, customRange);

  const result = await db
    .select({
      deviceType: analyticsEvents.deviceType,
      sessions: sql<number>`COUNT(DISTINCT ${analyticsEvents.sessionId})`,
      pageViews: sql<number>`COUNT(*)`,
    })
    .from(analyticsEvents)
    .where(and(
      eq(analyticsEvents.storeId, storeId),
      eq(analyticsEvents.eventType, 'page_view'),
      gte(analyticsEvents.createdAt, from),
      lte(analyticsEvents.createdAt, to)
    ))
    .groupBy(analyticsEvents.deviceType);

  return result.map(r => ({
    deviceType: r.deviceType || 'unknown',
    sessions: Number(r.sessions),
    pageViews: Number(r.pageViews),
  }));
});

export const getLandingPages = cache(async (
  storeId: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  limit = 10,
  customRange?: DateRange
) => {
  const { from, to } = getDateRange(period, customRange);

  const result = await db
    .select({
      page: analyticsEvents.landingPage,
      sessions: sql<number>`COUNT(DISTINCT ${analyticsEvents.sessionId})`,
    })
    .from(analyticsEvents)
    .where(and(
      eq(analyticsEvents.storeId, storeId),
      eq(analyticsEvents.eventType, 'page_view'),
      gte(analyticsEvents.createdAt, from),
      lte(analyticsEvents.createdAt, to),
      sql`${analyticsEvents.landingPage} IS NOT NULL`
    ))
    .groupBy(analyticsEvents.landingPage)
    .orderBy(desc(sql`COUNT(DISTINCT ${analyticsEvents.sessionId})`))
    .limit(limit);

  return result.map(r => ({
    page: r.page || '/',
    sessions: Number(r.sessions),
  }));
});

// UTM Campaign Stats - for traffic report
export const getUtmStats = cache(async (
  storeId: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: DateRange
) => {
  const { from, to } = getDateRange(period, customRange);

  // Get UTM Medium stats
  const mediumResult = await db
    .select({
      utmMedium: sql<string>`COALESCE(${analyticsEvents.utmMedium}, 'direct')`,
      sessions: sql<number>`COUNT(DISTINCT ${analyticsEvents.sessionId})`,
    })
    .from(analyticsEvents)
    .where(and(
      eq(analyticsEvents.storeId, storeId),
      eq(analyticsEvents.eventType, 'page_view'),
      gte(analyticsEvents.createdAt, from),
      lte(analyticsEvents.createdAt, to)
    ))
    .groupBy(sql`COALESCE(${analyticsEvents.utmMedium}, 'direct')`)
    .orderBy(desc(sql`COUNT(DISTINCT ${analyticsEvents.sessionId})`))
    .limit(10);

  // Get UTM Campaign stats
  const campaignResult = await db
    .select({
      utmCampaign: analyticsEvents.utmCampaign,
      sessions: sql<number>`COUNT(DISTINCT ${analyticsEvents.sessionId})`,
    })
    .from(analyticsEvents)
    .where(and(
      eq(analyticsEvents.storeId, storeId),
      eq(analyticsEvents.eventType, 'page_view'),
      gte(analyticsEvents.createdAt, from),
      lte(analyticsEvents.createdAt, to),
      sql`${analyticsEvents.utmCampaign} IS NOT NULL`
    ))
    .groupBy(analyticsEvents.utmCampaign)
    .orderBy(desc(sql`COUNT(DISTINCT ${analyticsEvents.sessionId})`))
    .limit(10);

  // Get UTM Content stats
  const contentResult = await db
    .select({
      utmContent: analyticsEvents.utmContent,
      sessions: sql<number>`COUNT(DISTINCT ${analyticsEvents.sessionId})`,
    })
    .from(analyticsEvents)
    .where(and(
      eq(analyticsEvents.storeId, storeId),
      eq(analyticsEvents.eventType, 'page_view'),
      gte(analyticsEvents.createdAt, from),
      lte(analyticsEvents.createdAt, to),
      sql`${analyticsEvents.utmContent} IS NOT NULL`
    ))
    .groupBy(analyticsEvents.utmContent)
    .orderBy(desc(sql`COUNT(DISTINCT ${analyticsEvents.sessionId})`))
    .limit(10);

  return {
    byMedium: mediumResult.map(r => ({
      medium: String(r.utmMedium),
      sessions: Number(r.sessions),
    })),
    byCampaign: campaignResult.map(r => ({
      campaign: r.utmCampaign || 'unknown',
      sessions: Number(r.sessions),
    })),
    byContent: contentResult.map(r => ({
      content: r.utmContent || 'unknown',
      sessions: Number(r.sessions),
    })),
  };
});

// ============ CUSTOMER REPORTS ============

export const getCustomerSegments = cache(async (storeId: string) => {
  // Get customer segments using SQL for speed
  const result = await db
    .select({
      vip: sql<number>`COUNT(CASE WHEN ${customers.totalSpent}::numeric >= 3000 THEN 1 END)`,
      regular: sql<number>`COUNT(CASE WHEN ${customers.totalOrders} >= 2 AND ${customers.totalSpent}::numeric < 3000 THEN 1 END)`,
      new: sql<number>`COUNT(CASE WHEN ${customers.totalOrders} <= 1 AND ${customers.createdAt} >= NOW() - INTERVAL '30 days' THEN 1 END)`,
      atRisk: sql<number>`COUNT(CASE WHEN ${customers.totalOrders} >= 1 AND ${customers.createdAt} < NOW() - INTERVAL '90 days' THEN 1 END)`,
      total: sql<number>`COUNT(*)`,
    })
    .from(customers)
    .where(eq(customers.storeId, storeId));

  const stats = result[0];
  const total = Number(stats?.total || 1);

  return [
    { segment: 'VIP', count: Number(stats?.vip || 0), revenue: 0, percentage: (Number(stats?.vip || 0) / total) * 100 },
    { segment: 'חוזרים', count: Number(stats?.regular || 0), revenue: 0, percentage: (Number(stats?.regular || 0) / total) * 100 },
    { segment: 'חדשים', count: Number(stats?.new || 0), revenue: 0, percentage: (Number(stats?.new || 0) / total) * 100 },
    { segment: 'בסיכון', count: Number(stats?.atRisk || 0), revenue: 0, percentage: (Number(stats?.atRisk || 0) / total) * 100 },
  ];
});

export const getTopCustomers = cache(async (
  storeId: string,
  limit = 10
) => {
  const result = await db
    .select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      totalOrders: customers.totalOrders,
      totalSpent: customers.totalSpent,
      createdAt: customers.createdAt,
    })
    .from(customers)
    .where(eq(customers.storeId, storeId))
    .orderBy(desc(sql`${customers.totalSpent}::numeric`))
    .limit(limit);

  return result.map(c => ({
    ...c,
    totalSpent: Number(c.totalSpent || 0),
  }));
});

export const getNewVsReturning = cache(async (
  storeId: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: DateRange
) => {
  const { from, to } = getDateRange(period, customRange);
  
  // Check if it's a single day (less than 25 hours difference)
  const isSingleDay = (to.getTime() - from.getTime()) < 25 * 60 * 60 * 1000;
  
  const dateFormat = isSingleDay 
    ? sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD HH24:00:00')`
    : sql<string>`DATE(${orders.createdAt})`;

  const result = await db
    .select({
      date: dateFormat,
      newCustomers: sql<number>`COUNT(DISTINCT CASE WHEN c.total_orders = 1 THEN ${orders.customerId} END)`,
      returningCustomers: sql<number>`COUNT(DISTINCT CASE WHEN c.total_orders > 1 THEN ${orders.customerId} END)`,
    })
    .from(orders)
    .innerJoin(
      sql`(SELECT id, total_orders FROM customers) c`,
      sql`c.id = ${orders.customerId}`
    )
    .where(and(
      eq(orders.storeId, storeId),
      gte(orders.createdAt, from),
      lte(orders.createdAt, to),
      sql`${orders.status} != 'cancelled'`
    ))
    .groupBy(isSingleDay ? sql`to_char(${orders.createdAt}, 'YYYY-MM-DD HH24:00:00')` : sql`DATE(${orders.createdAt})`)
    .orderBy(asc(isSingleDay ? sql`to_char(${orders.createdAt}, 'YYYY-MM-DD HH24:00:00')` : sql`DATE(${orders.createdAt})`));

  if (isSingleDay) {
    // Create a map of hour -> data
    const dataMap = new Map<string, { newCustomers: number; returningCustomers: number }>();
    result.forEach(r => {
      const dateStr = String(r.date);
      dataMap.set(dateStr, {
        newCustomers: Number(r.newCustomers),
        returningCustomers: Number(r.returningCustomers),
      });
    });

    // Generate all 24 hours for the day
    const dayStart = new Date(from);
    dayStart.setHours(0, 0, 0, 0);
    const allHours: Array<{ date: string; newCustomers: number; returningCustomers: number }> = [];
    
    // Get the date string in YYYY-MM-DD format
    const year = dayStart.getFullYear();
    const month = String(dayStart.getMonth() + 1).padStart(2, '0');
    const day = String(dayStart.getDate()).padStart(2, '0');
    
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = String(hour).padStart(2, '0');
      const dateStr = `${year}-${month}-${day} ${hourStr}:00:00`;
      
      const data = dataMap.get(dateStr) || { newCustomers: 0, returningCustomers: 0 };
      allHours.push({
        date: dateStr,
        newCustomers: data.newCustomers,
        returningCustomers: data.returningCustomers,
      });
    }

    return allHours;
  }

  return result.map(r => ({
    date: String(r.date),
    newCustomers: Number(r.newCustomers),
    returningCustomers: Number(r.returningCustomers),
  }));
});

// ============ BEHAVIOR REPORTS ============

export const getConversionFunnel = cache(async (
  storeId: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: DateRange
) => {
  const { from, to } = getDateRange(period, customRange);

  // Try to get data from analytics events first
  const result = await db
    .select({
      eventType: analyticsEvents.eventType,
      count: sql<number>`COUNT(DISTINCT ${analyticsEvents.sessionId})`,
    })
    .from(analyticsEvents)
    .where(and(
      eq(analyticsEvents.storeId, storeId),
      gte(analyticsEvents.createdAt, from),
      lte(analyticsEvents.createdAt, to)
    ))
    .groupBy(analyticsEvents.eventType);

  const eventMap = new Map(result.map(r => [r.eventType, Number(r.count)]));
  
  let pageViews = eventMap.get('page_view') || 0;
  let productViews = eventMap.get('product_view') || 0;
  let addToCart = eventMap.get('add_to_cart') || 0;
  let beginCheckout = eventMap.get('begin_checkout') || 0;
  let purchase = eventMap.get('purchase') || 0;

  // If no analytics data, use order data as fallback to show at least purchases
  if (pageViews === 0 && purchase === 0) {
    // Get order count from orders table
    const [orderStats] = await db
      .select({
        totalOrders: sql<number>`COUNT(CASE WHEN ${orders.status} != 'cancelled' THEN 1 END)`,
        uniqueCustomers: sql<number>`COUNT(DISTINCT ${orders.customerEmail})`,
      })
      .from(orders)
      .where(and(
        eq(orders.storeId, storeId),
        gte(orders.createdAt, from),
        lte(orders.createdAt, to)
      ));

    // Get abandoned carts count
    const [cartStats] = await db
      .select({
        totalCarts: sql<number>`COUNT(*)`,
      })
      .from(abandonedCarts)
      .where(and(
        eq(abandonedCarts.storeId, storeId),
        gte(abandonedCarts.createdAt, from),
        lte(abandonedCarts.createdAt, to)
      ));

    const totalOrders = Number(orderStats?.totalOrders || 0);
    const totalCarts = Number(cartStats?.totalCarts || 0) + totalOrders;
    
    // Estimate funnel based on order data (rough estimates for demo)
    purchase = totalOrders;
    beginCheckout = Math.round(totalOrders * 1.3); // ~77% checkout completion
    addToCart = totalCarts > 0 ? totalCarts : Math.round(totalOrders * 2); // ~50% cart to checkout
    productViews = Math.round(addToCart * 3); // ~33% product view to cart
    pageViews = Math.round(productViews * 2); // ~50% page to product view
  }

  return [
    { step: 'צפיות בדף', count: pageViews, rate: 100 },
    { step: 'צפיות במוצר', count: productViews, rate: pageViews > 0 ? (productViews / pageViews) * 100 : 0 },
    { step: 'הוספה לסל', count: addToCart, rate: pageViews > 0 ? (addToCart / pageViews) * 100 : 0 },
    { step: 'התחלת תשלום', count: beginCheckout, rate: pageViews > 0 ? (beginCheckout / pageViews) * 100 : 0 },
    { step: 'רכישה', count: purchase, rate: pageViews > 0 ? (purchase / pageViews) * 100 : 0 },
  ];
});

export const getTopSearches = cache(async (
  storeId: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  limit = 20,
  customRange?: DateRange
) => {
  const { from, to } = getDateRange(period, customRange);

  const result = await db
    .select({
      query: searchQueries.query,
      searches: sql<number>`COUNT(*)`,
      clickRate: sql<number>`AVG(CASE WHEN ${searchQueries.clickedProductId} IS NOT NULL THEN 1 ELSE 0 END) * 100`,
      avgResults: sql<number>`AVG(${searchQueries.resultsCount})`,
    })
    .from(searchQueries)
    .where(and(
      eq(searchQueries.storeId, storeId),
      gte(searchQueries.createdAt, from),
      lte(searchQueries.createdAt, to)
    ))
    .groupBy(searchQueries.query)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(limit);

  return result.map(r => ({
    query: r.query,
    searches: Number(r.searches),
    clickRate: Number(r.clickRate || 0),
    avgResults: Number(r.avgResults || 0),
  }));
});

export const getAbandonedCartsStats = cache(async (
  storeId: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: DateRange
) => {
  const { from, to } = getDateRange(period, customRange);

  const [stats] = await db
    .select({
      total: sql<number>`COUNT(*)`,
      totalValue: sql<number>`COALESCE(SUM(${abandonedCarts.subtotal}::numeric), 0)`,
      recovered: sql<number>`COUNT(CASE WHEN ${abandonedCarts.recoveredAt} IS NOT NULL THEN 1 END)`,
      recoveredValue: sql<number>`COALESCE(SUM(CASE WHEN ${abandonedCarts.recoveredAt} IS NOT NULL THEN ${abandonedCarts.subtotal}::numeric ELSE 0 END), 0)`,
      remindersSent: sql<number>`COUNT(CASE WHEN ${abandonedCarts.reminderSentAt} IS NOT NULL THEN 1 END)`,
    })
    .from(abandonedCarts)
    .where(and(
      eq(abandonedCarts.storeId, storeId),
      gte(abandonedCarts.createdAt, from),
      lte(abandonedCarts.createdAt, to)
    ));

  const total = Number(stats?.total || 0);
  const recovered = Number(stats?.recovered || 0);

  return {
    total,
    totalValue: Number(stats?.totalValue || 0),
    recovered,
    recoveredValue: Number(stats?.recoveredValue || 0),
    recoveryRate: total > 0 ? (recovered / total) * 100 : 0,
    remindersSent: Number(stats?.remindersSent || 0),
  };
});

export const getRecentAbandonedCarts = cache(async (
  storeId: string,
  limit = 10
) => {
  const result = await db
    .select({
      id: abandonedCarts.id,
      email: abandonedCarts.email,
      subtotal: abandonedCarts.subtotal,
      checkoutStep: abandonedCarts.checkoutStep,
      reminderSentAt: abandonedCarts.reminderSentAt,
      recoveredAt: abandonedCarts.recoveredAt,
      createdAt: abandonedCarts.createdAt,
      items: abandonedCarts.items,
    })
    .from(abandonedCarts)
    .where(and(
      eq(abandonedCarts.storeId, storeId),
      sql`${abandonedCarts.recoveredAt} IS NULL`
    ))
    .orderBy(desc(abandonedCarts.createdAt))
    .limit(limit);

  return result.map(r => ({
    ...r,
    subtotal: Number(r.subtotal || 0),
    items: r.items as Array<{ productName: string; quantity: number }>,
  }));
});

// ============ FINANCIAL REPORTS ============

export const getGiftCardSummary = cache(async (storeId: string) => {
  const [stats] = await db
    .select({
      totalIssued: sql<number>`COUNT(*)`,
      totalValue: sql<number>`COALESCE(SUM(${giftCards.initialBalance}::numeric), 0)`,
      activeCards: sql<number>`COUNT(CASE WHEN ${giftCards.status} = 'active' THEN 1 END)`,
      activeBalance: sql<number>`COALESCE(SUM(CASE WHEN ${giftCards.status} = 'active' THEN ${giftCards.currentBalance}::numeric ELSE 0 END), 0)`,
      usedValue: sql<number>`COALESCE(SUM(${giftCards.initialBalance}::numeric - ${giftCards.currentBalance}::numeric), 0)`,
    })
    .from(giftCards)
    .where(eq(giftCards.storeId, storeId));

  return {
    totalIssued: Number(stats?.totalIssued || 0),
    totalValue: Number(stats?.totalValue || 0),
    activeCards: Number(stats?.activeCards || 0),
    activeBalance: Number(stats?.activeBalance || 0),
    usedValue: Number(stats?.usedValue || 0),
  };
});

export const getInfluencerStats = cache(async (storeId: string) => {
  const result = await db
    .select({
      id: influencers.id,
      name: influencers.name,
      couponCode: influencers.couponCode,
      totalSales: influencers.totalSales,
      totalCommission: influencers.totalCommission,
      totalOrders: influencers.totalOrders,
      isActive: influencers.isActive,
    })
    .from(influencers)
    .where(eq(influencers.storeId, storeId))
    .orderBy(desc(sql`${influencers.totalSales}::numeric`));

  const totals = result.reduce((acc, inf) => ({
    totalSales: acc.totalSales + Number(inf.totalSales || 0),
    totalCommission: acc.totalCommission + Number(inf.totalCommission || 0),
    totalOrders: acc.totalOrders + Number(inf.totalOrders || 0),
  }), { totalSales: 0, totalCommission: 0, totalOrders: 0 });

  return {
    influencers: result.map(i => ({
      ...i,
      totalSales: Number(i.totalSales || 0),
      totalCommission: Number(i.totalCommission || 0),
    })),
    totals,
  };
});

export const getRefundStats = cache(async (
  storeId: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: DateRange
) => {
  const { from, to } = getDateRange(period, customRange);

  const [stats] = await db
    .select({
      total: sql<number>`COUNT(*)`,
      totalAmount: sql<number>`COALESCE(SUM(${refunds.amount}::numeric), 0)`,
      pending: sql<number>`COUNT(CASE WHEN ${refunds.status} = 'pending' THEN 1 END)`,
      approved: sql<number>`COUNT(CASE WHEN ${refunds.status} = 'approved' THEN 1 END)`,
      completed: sql<number>`COUNT(CASE WHEN ${refunds.status} = 'completed' THEN 1 END)`,
      rejected: sql<number>`COUNT(CASE WHEN ${refunds.status} = 'rejected' THEN 1 END)`,
    })
    .from(refunds)
    .where(and(
      eq(refunds.storeId, storeId),
      gte(refunds.createdAt, from),
      lte(refunds.createdAt, to)
    ));

  return {
    total: Number(stats?.total || 0),
    totalAmount: Number(stats?.totalAmount || 0),
    pending: Number(stats?.pending || 0),
    approved: Number(stats?.approved || 0),
    completed: Number(stats?.completed || 0),
    rejected: Number(stats?.rejected || 0),
  };
});

export const getStoreCreditStats = cache(async (storeId: string) => {
  const [stats] = await db
    .select({
      totalIssued: sql<number>`COALESCE(SUM(CASE WHEN ${customerCreditTransactions.type} = 'credit' THEN ${customerCreditTransactions.amount}::numeric ELSE 0 END), 0)`,
      totalUsed: sql<number>`COALESCE(SUM(CASE WHEN ${customerCreditTransactions.type} = 'debit' THEN ABS(${customerCreditTransactions.amount}::numeric) ELSE 0 END), 0)`,
      transactions: sql<number>`COUNT(*)`,
    })
    .from(customerCreditTransactions)
    .where(eq(customerCreditTransactions.storeId, storeId));

  // Get total outstanding balance from customers
  const [balanceStats] = await db
    .select({
      outstandingBalance: sql<number>`COALESCE(SUM(${customers.creditBalance}::numeric), 0)`,
      customersWithCredit: sql<number>`COUNT(CASE WHEN ${customers.creditBalance}::numeric > 0 THEN 1 END)`,
    })
    .from(customers)
    .where(eq(customers.storeId, storeId));

  return {
    totalIssued: Number(stats?.totalIssued || 0),
    totalUsed: Number(stats?.totalUsed || 0),
    outstandingBalance: Number(balanceStats?.outstandingBalance || 0),
    customersWithCredit: Number(balanceStats?.customersWithCredit || 0),
    transactions: Number(stats?.transactions || 0),
  };
});

// ============ INVENTORY REPORTS ============

export const getInventoryStats = cache(async (storeId: string) => {
  // Get product stats (for products without variants)
  const [productStats] = await db
    .select({
      totalProducts: sql<number>`COUNT(*)`,
      totalInventory: sql<number>`COALESCE(SUM(CASE WHEN ${products.hasVariants} = false THEN ${products.inventory} ELSE 0 END), 0)`,
      lowStock: sql<number>`COUNT(CASE WHEN ${products.hasVariants} = false AND ${products.inventory} > 0 AND ${products.inventory} <= 5 AND ${products.trackInventory} = true THEN 1 END)`,
      outOfStock: sql<number>`COUNT(CASE WHEN ${products.hasVariants} = false AND ${products.inventory} = 0 AND ${products.trackInventory} = true THEN 1 END)`,
      tracked: sql<number>`COUNT(CASE WHEN ${products.trackInventory} = true THEN 1 END)`,
    })
    .from(products)
    .where(and(
      eq(products.storeId, storeId),
      eq(products.isActive, true)
    ));

  // Get variant stats (for products with variants)
  const [variantStats] = await db
    .select({
      totalInventory: sql<number>`COALESCE(SUM(${productVariants.inventory}), 0)`,
      lowStock: sql<number>`COUNT(CASE WHEN ${productVariants.inventory} > 0 AND ${productVariants.inventory} <= 5 THEN 1 END)`,
      outOfStock: sql<number>`COUNT(CASE WHEN ${productVariants.inventory} = 0 OR ${productVariants.inventory} IS NULL THEN 1 END)`,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(and(
      eq(products.storeId, storeId),
      eq(products.isActive, true),
      eq(products.hasVariants, true)
    ));

  return {
    totalProducts: Number(productStats?.totalProducts || 0),
    totalInventory: Number(productStats?.totalInventory || 0) + Number(variantStats?.totalInventory || 0),
    lowStock: Number(productStats?.lowStock || 0) + Number(variantStats?.lowStock || 0),
    outOfStock: Number(productStats?.outOfStock || 0) + Number(variantStats?.outOfStock || 0),
    tracked: Number(productStats?.tracked || 0),
  };
});

export const getLowStockProducts = cache(async (
  storeId: string,
  threshold = 5,
  limit = 20
) => {
  // Get low stock products (without variants)
  const productResult = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      inventory: products.inventory,
      image: productImages.url,
      isVariant: sql<boolean>`false`,
      variantTitle: sql<string | null>`null`,
    })
    .from(products)
    .leftJoin(productImages, and(
      eq(productImages.productId, products.id),
      eq(productImages.isPrimary, true)
    ))
    .where(and(
      eq(products.storeId, storeId),
      eq(products.isActive, true),
      eq(products.trackInventory, true),
      eq(products.hasVariants, false),
      sql`${products.inventory} <= ${threshold}`
    ))
    .orderBy(asc(products.inventory))
    .limit(limit);

  // Get low stock variants
  const variantResult = await db
    .select({
      id: productVariants.id,
      name: products.name,
      sku: productVariants.sku,
      inventory: productVariants.inventory,
      image: productImages.url,
      isVariant: sql<boolean>`true`,
      variantTitle: productVariants.title,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(productImages, and(
      eq(productImages.productId, products.id),
      eq(productImages.isPrimary, true)
    ))
    .where(and(
      eq(products.storeId, storeId),
      eq(products.isActive, true),
      eq(products.hasVariants, true),
      sql`${productVariants.inventory} <= ${threshold}`
    ))
    .orderBy(asc(productVariants.inventory))
    .limit(limit);

  // Combine and sort by inventory
  const combined = [...productResult, ...variantResult]
    .sort((a, b) => (a.inventory || 0) - (b.inventory || 0))
    .slice(0, limit);

  return combined;
});

// ============ COMBINED DASHBOARD ============

export const getReportsDashboard = cache(async (
  storeId: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: DateRange
) => {
  // Run all queries in parallel for maximum speed
  const [
    salesOverview,
    salesByDay,
    topProducts,
    trafficSources,
    conversionFunnel,
    customerSegments,
    inventoryStats,
  ] = await Promise.all([
    getSalesOverview(storeId, period, customRange),
    getSalesByDay(storeId, period, customRange),
    getTopProducts(storeId, period, 5, customRange),
    getTrafficSources(storeId, period, customRange),
    getConversionFunnel(storeId, period, customRange),
    getCustomerSegments(storeId),
    getInventoryStats(storeId),
  ]);

  return {
    salesOverview,
    salesByDay,
    topProducts,
    trafficSources,
    conversionFunnel,
    customerSegments,
    inventoryStats,
  };
});

// ============ ORDERS LIST ============

export const getRecentOrders = cache(async (
  storeId: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: DateRange,
  limit: number = 50
) => {
  const { from, to } = getDateRange(period, customRange);

  // Get orders with their item counts via a subquery
  const result = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      total: orders.total,
      status: orders.status,
      financialStatus: orders.financialStatus,
      fulfillmentStatus: orders.fulfillmentStatus,
      discountCode: orders.discountCode,
      discountAmount: orders.discountAmount,
      shippingAmount: orders.shippingAmount,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(
      eq(orders.storeId, storeId),
      gte(orders.createdAt, from),
      lte(orders.createdAt, to)
    ))
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  // Get item counts for all orders in one query
  const orderIds = result.map(o => o.id);
  
  let itemCounts: Record<string, number> = {};
  if (orderIds.length > 0) {
    const itemCountsResult = await db
      .select({
        orderId: orderItems.orderId,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds))
      .groupBy(orderItems.orderId);
    
    itemCounts = Object.fromEntries(
      itemCountsResult.map(ic => [ic.orderId, Number(ic.count)])
    );
  }

  return result.map(o => ({
    ...o,
    total: Number(o.total),
    discountAmount: Number(o.discountAmount || 0),
    shippingAmount: Number(o.shippingAmount || 0),
    itemsCount: itemCounts[o.id] || 0,
  }));
});

// ============ COUPONS REPORT ============

export const getCouponStats = cache(async (
  storeId: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: DateRange
) => {
  const { from, to } = getDateRange(period, customRange);

  // Get all orders with discount codes in period (including discountDetails for filtering)
  const ordersWithCoupons = await db
    .select({
      discountCode: orders.discountCode,
      discountDetails: orders.discountDetails,
      total: orders.total,
      discountAmount: orders.discountAmount,
    })
    .from(orders)
    .where(and(
      eq(orders.storeId, storeId),
      gte(orders.createdAt, from),
      lte(orders.createdAt, to),
      sql`${orders.discountCode} IS NOT NULL AND ${orders.discountCode} != ''`
    ));

  // Get all gift card codes to exclude them
  const giftCardCodes = await db
    .select({ code: giftCards.code })
    .from(giftCards)
    .where(eq(giftCards.storeId, storeId));
  
  const giftCardCodesSet = new Set(giftCardCodes.map(g => g.code.toUpperCase()));

  // Aggregate by coupon code (excluding gift cards)
  const couponMap = new Map<string, { orders: number; revenue: number; discountTotal: number }>();
  
  ordersWithCoupons.forEach(o => {
    const code = o.discountCode!;
    
    // Skip if this is a gift card code
    if (giftCardCodesSet.has(code.toUpperCase())) {
      return;
    }
    
    // Also check discountDetails for gift_card type
    const details = o.discountDetails as Array<{ type: string; code?: string; amount: number }> | null;
    if (details?.some(d => d.type === 'gift_card' && d.code?.toUpperCase() === code.toUpperCase())) {
      return;
    }
    
    // Calculate coupon-only discount (exclude gift card amounts from discountDetails)
    let couponDiscount = Number(o.discountAmount || 0);
    if (details) {
      const giftCardAmount = details
        .filter(d => d.type === 'gift_card')
        .reduce((sum, d) => sum + (d.amount || 0), 0);
      couponDiscount = Math.max(0, couponDiscount - giftCardAmount);
    }
    
    const existing = couponMap.get(code) || { orders: 0, revenue: 0, discountTotal: 0 };
    couponMap.set(code, {
      orders: existing.orders + 1,
      revenue: existing.revenue + Number(o.total),
      discountTotal: existing.discountTotal + couponDiscount,
    });
  });

  const coupons = Array.from(couponMap.entries()).map(([code, stats]) => ({
    code,
    ...stats,
  })).sort((a, b) => b.orders - a.orders);

  const totals = {
    totalCouponsUsed: coupons.length,
    totalOrders: coupons.reduce((sum, c) => sum + c.orders, 0),
    totalRevenue: coupons.reduce((sum, c) => sum + c.revenue, 0),
    totalDiscounts: coupons.reduce((sum, c) => sum + c.discountTotal, 0),
  };

  return { coupons, totals };
});

// ============ GIFT CARDS REPORT ============

export const getGiftCardStats = cache(async (
  storeId: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: DateRange
) => {
  const { from, to } = getDateRange(period, customRange);

  // Get all gift cards for the store
  const allGiftCards = await db
    .select({
      id: giftCards.id,
      code: giftCards.code,
      initialBalance: giftCards.initialBalance,
      currentBalance: giftCards.currentBalance,
      status: giftCards.status,
      recipientEmail: giftCards.recipientEmail,
      purchasedById: giftCards.purchasedById,
      createdAt: giftCards.createdAt,
      expiresAt: giftCards.expiresAt,
    })
    .from(giftCards)
    .where(eq(giftCards.storeId, storeId))
    .orderBy(desc(giftCards.createdAt));

  // Get gift cards created in the period
  const giftCardsInPeriod = allGiftCards.filter(gc => {
    const created = new Date(gc.createdAt!);
    return created >= from && created <= to;
  });

  // Calculate totals
  const totalCreated = giftCardsInPeriod.length;
  const totalValue = giftCardsInPeriod.reduce((sum, gc) => sum + Number(gc.initialBalance), 0);
  const activeCards = allGiftCards.filter(gc => gc.status === 'active').length;
  const usedCards = allGiftCards.filter(gc => gc.status === 'used').length;
  const expiredCards = allGiftCards.filter(gc => gc.status === 'expired').length;
  const totalInitialBalance = allGiftCards.reduce((sum, gc) => sum + Number(gc.initialBalance), 0);
  const totalCurrentBalance = allGiftCards.reduce((sum, gc) => sum + Number(gc.currentBalance), 0);
  const totalUsed = totalInitialBalance - totalCurrentBalance;

  return {
    giftCards: allGiftCards.map(gc => ({
      ...gc,
      initialBalance: Number(gc.initialBalance),
      currentBalance: Number(gc.currentBalance),
      usedAmount: Number(gc.initialBalance) - Number(gc.currentBalance),
    })),
    totals: {
      totalCreated,
      totalValueCreated: totalValue,
      activeCards,
      usedCards,
      expiredCards,
      totalInitialBalance,
      totalCurrentBalance,
      totalUsed,
    },
  };
});

export const getGiftCardTransactions = cache(async (
  storeId: string,
  giftCardId: string,
  limit = 20
) => {
  const { giftCardTransactions } = await import('@/lib/db/schema');
  
  const transactions = await db
    .select({
      id: giftCardTransactions.id,
      amount: giftCardTransactions.amount,
      balanceAfter: giftCardTransactions.balanceAfter,
      note: giftCardTransactions.note,
      orderId: giftCardTransactions.orderId,
      createdAt: giftCardTransactions.createdAt,
    })
    .from(giftCardTransactions)
    .where(eq(giftCardTransactions.giftCardId, giftCardId))
    .orderBy(desc(giftCardTransactions.createdAt))
    .limit(limit);

  return transactions.map(t => ({
    ...t,
    amount: Number(t.amount),
    balanceAfter: Number(t.balanceAfter),
  }));
});

export const getCouponOrders = cache(async (
  storeId: string,
  couponCode: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: DateRange
) => {
  const { from, to } = getDateRange(period, customRange);

  const result = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      total: orders.total,
      discountAmount: orders.discountAmount,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(
      eq(orders.storeId, storeId),
      eq(orders.discountCode, couponCode),
      gte(orders.createdAt, from),
      lte(orders.createdAt, to)
    ))
    .orderBy(desc(orders.createdAt));

  return result.map(o => ({
    ...o,
    total: Number(o.total),
    discountAmount: Number(o.discountAmount || 0),
  }));
});

// Get all coupon codes generated by gamification plugins
export const getGamificationCouponCodes = cache(async (storeId: string) => {
  // Get all gamification campaigns for this store
  const campaigns = await db
    .select({ id: gamificationCampaigns.id })
    .from(gamificationCampaigns)
    .where(eq(gamificationCampaigns.storeId, storeId));

  if (campaigns.length === 0) {
    return [];
  }

  const campaignIds = campaigns.map(c => c.id);

  // Get all coupon codes from gamification wins
  const wins = await db
    .select({ couponCode: gamificationWins.couponCode })
    .from(gamificationWins)
    .where(inArray(gamificationWins.campaignId, campaignIds));

  return wins
    .map(w => w.couponCode)
    .filter((code): code is string => code !== null);
});

// ============ SHIPPING REPORT ============

export const getShippingStats = cache(async (
  storeId: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: DateRange
) => {
  const { from, to } = getDateRange(period, customRange);

  const shippingData = await db
    .select({
      shippingMethod: orders.shippingMethod,
      shippingAmount: orders.shippingAmount,
      total: orders.total,
    })
    .from(orders)
    .where(and(
      eq(orders.storeId, storeId),
      sql`${orders.status} != 'cancelled'`,
      gte(orders.createdAt, from),
      lte(orders.createdAt, to)
    ));

  let totalPaidShipping = 0;
  let totalFreeShipping = 0;
  let paidShippingOrders = 0;
  let freeShippingOrders = 0;
  const methodStats = new Map<string, { orders: number; revenue: number }>();

  shippingData.forEach(o => {
    const shipping = Number(o.shippingAmount || 0);
    const method = o.shippingMethod || 'לא צוין';
    
    if (shipping > 0) {
      totalPaidShipping += shipping;
      paidShippingOrders++;
    } else {
      freeShippingOrders++;
    }

    const existing = methodStats.get(method) || { orders: 0, revenue: 0 };
    methodStats.set(method, {
      orders: existing.orders + 1,
      revenue: existing.revenue + shipping,
    });
  });

  const byMethod = Array.from(methodStats.entries()).map(([method, stats]) => ({
    method,
    ...stats,
  })).sort((a, b) => b.orders - a.orders);

  return {
    totalOrders: shippingData.length,
    paidShippingOrders,
    freeShippingOrders,
    totalPaidShipping,
    averageShipping: paidShippingOrders > 0 ? totalPaidShipping / paidShippingOrders : 0,
    freeShippingPercentage: shippingData.length > 0 ? (freeShippingOrders / shippingData.length) * 100 : 0,
    byMethod,
  };
});

// ============ GIFT CARDS DETAILS ============

export const getGiftCardDetails = cache(async (storeId: string) => {
  const cards = await db
    .select({
      id: giftCards.id,
      code: giftCards.code,
      initialBalance: giftCards.initialBalance,
      currentBalance: giftCards.currentBalance,
      customerEmail: giftCards.recipientEmail,
      customerName: giftCards.recipientName,
      senderName: giftCards.senderName,
      status: giftCards.status,
      createdAt: giftCards.createdAt,
      expiresAt: giftCards.expiresAt,
      lastUsedAt: giftCards.lastUsedAt,
    })
    .from(giftCards)
    .where(eq(giftCards.storeId, storeId))
    .orderBy(desc(giftCards.createdAt))
    .limit(100);

  return cards.map(c => ({
    ...c,
    initialBalance: Number(c.initialBalance),
    currentBalance: Number(c.currentBalance),
    usedAmount: Number(c.initialBalance) - Number(c.currentBalance),
  }));
});

// ============ STORE CREDITS DETAILS ============

export const getStoreCreditDetails = cache(async (storeId: string, limit: number = 100) => {
  const transactions = await db
    .select({
      id: customerCreditTransactions.id,
      customerId: customerCreditTransactions.customerId,
      type: customerCreditTransactions.type,
      amount: customerCreditTransactions.amount,
      balanceAfter: customerCreditTransactions.balanceAfter,
      reason: customerCreditTransactions.reason,
      createdAt: customerCreditTransactions.createdAt,
      customerEmail: customers.email,
      customerName: sql<string>`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`,
    })
    .from(customerCreditTransactions)
    .leftJoin(customers, eq(customerCreditTransactions.customerId, customers.id))
    .where(eq(customerCreditTransactions.storeId, storeId))
    .orderBy(desc(customerCreditTransactions.createdAt))
    .limit(limit);

  return transactions.map(t => ({
    ...t,
    amount: Number(t.amount),
    balanceAfter: Number(t.balanceAfter),
  }));
});

// ============ INFLUENCER ORDERS ============

export const getInfluencerOrders = cache(async (
  storeId: string,
  influencerId: string,
  period: '7d' | '30d' | '90d' | 'custom' = '30d',
  customRange?: DateRange
) => {
  const { from, to } = getDateRange(period, customRange);

  // Get influencer's coupon codes (direct + from linked discounts)
  const [influencer] = await db
    .select({ 
      couponCode: influencers.couponCode,
      discountId: influencers.discountId,
      discountIds: influencers.discountIds,
    })
    .from(influencers)
    .where(eq(influencers.id, influencerId))
    .limit(1);

  // Collect all possible discount IDs to find codes
  const discountIdsList = [
    ...(influencer?.discountId ? [influencer.discountId] : []),
    ...((influencer?.discountIds as string[]) || []),
  ].filter(Boolean);

  // Get all discount codes linked to this influencer
  let allCouponCodes: string[] = [];
  if (influencer?.couponCode) {
    allCouponCodes.push(influencer.couponCode);
  }
  if (discountIdsList.length > 0) {
    const linkedDiscounts = await db
      .select({ code: discounts.code })
      .from(discounts)
      .where(inArray(discounts.id, discountIdsList));
    allCouponCodes.push(...linkedDiscounts.map(d => d.code));
  }

  // Build the OR condition for matching orders
  let matchCondition;
  if (allCouponCodes.length > 0) {
    // Match by influencerId OR by any of the coupon codes
    matchCondition = sql`(${orders.influencerId} = ${influencerId} OR ${orders.discountCode} = ANY(${allCouponCodes}))`;
  } else {
    // Only match by influencerId
    matchCondition = eq(orders.influencerId, influencerId);
  }

  // Find orders linked to this influencer
  const result = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      total: orders.total,
      discountAmount: orders.discountAmount,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(
      eq(orders.storeId, storeId),
      gte(orders.createdAt, from),
      lte(orders.createdAt, to),
      matchCondition
    ))
    .orderBy(desc(orders.createdAt));

  return result.map(o => ({
    ...o,
    total: Number(o.total),
    discountAmount: Number(o.discountAmount || 0),
  }));
});

