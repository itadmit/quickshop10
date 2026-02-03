/**
 * Public API v1 - Analytics
 * GET /api/v1/analytics - Get store analytics summary
 * 
 * Requires: X-API-Key header
 * Scopes: analytics:read
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, products, contacts, discounts, automaticDiscounts } from '@/lib/db/schema';
import { eq, and, sql, gte, lte, isNull, desc } from 'drizzle-orm';
import { requireApiAuth, apiSuccess, apiError, logApiRequest } from '@/lib/api-auth';

// GET /api/v1/analytics
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Authenticate
  const result = await requireApiAuth(request, 'analytics:read');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Date range parameters
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 365d, custom
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    // Calculate date range
    let dateFrom: Date;
    let dateTo = new Date();
    
    if (period === 'custom' && startDate && endDate) {
      dateFrom = new Date(startDate);
      dateTo = new Date(endDate);
    } else {
      const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '365d' ? 365 : 30;
      dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);
    }
    
    // Previous period for comparison
    const periodLength = dateTo.getTime() - dateFrom.getTime();
    const prevDateTo = new Date(dateFrom.getTime() - 1);
    const prevDateFrom = new Date(prevDateTo.getTime() - periodLength);
    
    // ===== Current Period Stats =====
    
    // Orders stats
    const [currentOrderStats] = await db
      .select({
        total_orders: sql<number>`count(*)`,
        total_revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
        avg_order_value: sql<number>`coalesce(avg(${orders.total}), 0)`,
        completed_orders: sql<number>`count(*) filter (where ${orders.status} = 'completed')`,
        pending_orders: sql<number>`count(*) filter (where ${orders.status} = 'pending')`,
        processing_orders: sql<number>`count(*) filter (where ${orders.status} = 'processing')`,
        cancelled_orders: sql<number>`count(*) filter (where ${orders.status} = 'cancelled')`,
      })
      .from(orders)
      .where(and(
        eq(orders.storeId, auth.store.id),
        isNull(orders.archivedAt),
        gte(orders.createdAt, dateFrom),
        lte(orders.createdAt, dateTo)
      ));
    
    // Previous period orders for comparison
    const [prevOrderStats] = await db
      .select({
        total_orders: sql<number>`count(*)`,
        total_revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
      })
      .from(orders)
      .where(and(
        eq(orders.storeId, auth.store.id),
        isNull(orders.archivedAt),
        gte(orders.createdAt, prevDateFrom),
        lte(orders.createdAt, prevDateTo)
      ));
    
    // Products stats
    const [productStats] = await db
      .select({
        total_products: sql<number>`count(*)`,
        active_products: sql<number>`count(*) filter (where ${products.isActive} = true)`,
        inactive_products: sql<number>`count(*) filter (where ${products.isActive} = false)`,
        featured_products: sql<number>`count(*) filter (where ${products.isFeatured} = true)`,
        low_stock: sql<number>`count(*) filter (where ${products.trackInventory} = true and ${products.inventory} <= 5)`,
        out_of_stock: sql<number>`count(*) filter (where ${products.trackInventory} = true and ${products.inventory} <= 0)`,
      })
      .from(products)
      .where(eq(products.storeId, auth.store.id));
    
    // Customers stats
    const [customerStats] = await db
      .select({
        total_customers: sql<number>`count(distinct ${orders.customerEmail})`,
        new_customers: sql<number>`count(distinct ${orders.customerEmail}) filter (where ${orders.createdAt} >= ${dateFrom})`,
      })
      .from(orders)
      .where(and(
        eq(orders.storeId, auth.store.id),
        isNull(orders.archivedAt)
      ));
    
    // Contacts/Subscribers stats
    const [contactStats] = await db
      .select({
        total_contacts: sql<number>`count(*)`,
        club_members: sql<number>`count(*) filter (where ${contacts.type} = 'club_member')`,
        newsletter_subscribers: sql<number>`count(*) filter (where ${contacts.type} = 'newsletter')`,
      })
      .from(contacts)
      .where(eq(contacts.storeId, auth.store.id));
    
    // Top products in period
    const topProducts = await db
      .select({
        product_id: orderItems.productId,
        product_name: orderItems.name,
        total_quantity: sql<number>`sum(${orderItems.quantity})`,
        total_revenue: sql<number>`sum(${orderItems.price} * ${orderItems.quantity})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(
        eq(orders.storeId, auth.store.id),
        isNull(orders.archivedAt),
        gte(orders.createdAt, dateFrom),
        lte(orders.createdAt, dateTo)
      ))
      .groupBy(orderItems.productId, orderItems.name)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(10);
    
    // Sales by day
    const salesByDay = await db
      .select({
        date: sql<string>`date_trunc('day', ${orders.createdAt})::date`,
        orders: sql<number>`count(*)`,
        revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
      })
      .from(orders)
      .where(and(
        eq(orders.storeId, auth.store.id),
        isNull(orders.archivedAt),
        gte(orders.createdAt, dateFrom),
        lte(orders.createdAt, dateTo)
      ))
      .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
      .orderBy(sql`date_trunc('day', ${orders.createdAt})`);
    
    // Active discounts count
    const now = new Date();
    const [discountStats] = await db
      .select({
        active_coupons: sql<number>`count(*)`,
      })
      .from(discounts)
      .where(and(
        eq(discounts.storeId, auth.store.id),
        eq(discounts.isActive, true),
        sql`(${discounts.startsAt} is null or ${discounts.startsAt} <= ${now})`,
        sql`(${discounts.endsAt} is null or ${discounts.endsAt} >= ${now})`
      ));
    
    const [autoDiscountStats] = await db
      .select({
        active_auto_discounts: sql<number>`count(*)`,
      })
      .from(automaticDiscounts)
      .where(and(
        eq(automaticDiscounts.storeId, auth.store.id),
        eq(automaticDiscounts.isActive, true),
        sql`(${automaticDiscounts.startsAt} is null or ${automaticDiscounts.startsAt} <= ${now})`,
        sql`(${automaticDiscounts.endsAt} is null or ${automaticDiscounts.endsAt} >= ${now})`
      ));
    
    // Calculate growth percentages
    const revenueGrowth = prevOrderStats?.total_revenue && Number(prevOrderStats.total_revenue) > 0
      ? ((Number(currentOrderStats?.total_revenue || 0) - Number(prevOrderStats.total_revenue)) / Number(prevOrderStats.total_revenue)) * 100
      : 0;
    
    const ordersGrowth = prevOrderStats?.total_orders && Number(prevOrderStats.total_orders) > 0
      ? ((Number(currentOrderStats?.total_orders || 0) - Number(prevOrderStats.total_orders)) / Number(prevOrderStats.total_orders)) * 100
      : 0;
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    
    return apiSuccess({
      period: {
        start: dateFrom.toISOString(),
        end: dateTo.toISOString(),
        days: Math.ceil(periodLength / (1000 * 60 * 60 * 24)),
      },
      orders: {
        total: Number(currentOrderStats?.total_orders || 0),
        revenue: Number(currentOrderStats?.total_revenue || 0),
        average_order_value: Number(currentOrderStats?.avg_order_value || 0),
        completed: Number(currentOrderStats?.completed_orders || 0),
        pending: Number(currentOrderStats?.pending_orders || 0),
        processing: Number(currentOrderStats?.processing_orders || 0),
        cancelled: Number(currentOrderStats?.cancelled_orders || 0),
        growth: {
          revenue_percent: Math.round(revenueGrowth * 100) / 100,
          orders_percent: Math.round(ordersGrowth * 100) / 100,
        },
      },
      products: {
        total: Number(productStats?.total_products || 0),
        active: Number(productStats?.active_products || 0),
        inactive: Number(productStats?.inactive_products || 0),
        featured: Number(productStats?.featured_products || 0),
        low_stock: Number(productStats?.low_stock || 0),
        out_of_stock: Number(productStats?.out_of_stock || 0),
      },
      customers: {
        total: Number(customerStats?.total_customers || 0),
        new_in_period: Number(customerStats?.new_customers || 0),
      },
      contacts: {
        total: Number(contactStats?.total_contacts || 0),
        club_members: Number(contactStats?.club_members || 0),
        newsletter: Number(contactStats?.newsletter_subscribers || 0),
      },
      discounts: {
        active_coupons: Number(discountStats?.active_coupons || 0),
        active_automatic: Number(autoDiscountStats?.active_auto_discounts || 0),
      },
      top_products: topProducts.map(p => ({
        product_id: p.product_id,
        name: p.product_name,
        quantity_sold: Number(p.total_quantity),
        revenue: Number(p.total_revenue),
      })),
      sales_by_day: salesByDay.map(d => ({
        date: d.date,
        orders: Number(d.orders),
        revenue: Number(d.revenue),
      })),
    });
    
  } catch (error) {
    console.error('API v1 analytics error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to fetch analytics', 500);
  }
}
