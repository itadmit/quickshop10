/**
 * Mobile Analytics Summary API
 * GET /api/mobile/analytics/summary
 * 
 * Returns dashboard summary statistics for the store
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, products, customers, orderItems, analyticsDaily } from '@/lib/db/schema';
import { eq, and, sql, gte, lte, isNull, desc, lt } from 'drizzle-orm';
import { requireMobileAuthWithStore } from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuthWithStore(request);
    const { searchParams } = new URL(request.url);
    
    // Parse period parameter
    const period = searchParams.get('period') || 'today'; // today, week, month, custom
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now.setHours(23, 59, 59, 999));
    let previousStartDate: Date;
    let previousEndDate: Date;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousEndDate = new Date(previousStartDate);
        previousEndDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        previousEndDate = new Date(startDate);
        previousEndDate.setTime(previousEndDate.getTime() - 1);
        break;
      case 'month':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 30);
        previousEndDate = new Date(startDate);
        previousEndDate.setTime(previousEndDate.getTime() - 1);
        break;
      case 'custom':
        startDate = dateFrom ? new Date(dateFrom) : new Date();
        endDate = dateTo ? new Date(dateTo) : new Date();
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        previousEndDate = new Date(startDate);
        previousEndDate.setTime(previousEndDate.getTime() - 1);
        previousStartDate = new Date(previousEndDate);
        previousStartDate.setDate(previousStartDate.getDate() - daysDiff);
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousEndDate = new Date(previousStartDate);
        previousEndDate.setHours(23, 59, 59, 999);
    }
    
    // Get current period stats
    const [currentStats] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
        orderCount: sql<number>`COUNT(*)`,
        averageOrderValue: sql<number>`COALESCE(AVG(${orders.total}), 0)`,
      })
      .from(orders)
      .where(and(
        eq(orders.storeId, auth.store.id),
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
        isNull(orders.archivedAt),
        sql`${orders.status} != 'cancelled'`
      ));
    
    // Get previous period stats for comparison
    const [previousStats] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
        orderCount: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(and(
        eq(orders.storeId, auth.store.id),
        gte(orders.createdAt, previousStartDate),
        lte(orders.createdAt, previousEndDate),
        isNull(orders.archivedAt),
        sql`${orders.status} != 'cancelled'`
      ));
    
    // Calculate percentage change
    const revenueChange = previousStats?.totalRevenue && Number(previousStats.totalRevenue) > 0
      ? ((Number(currentStats?.totalRevenue || 0) - Number(previousStats.totalRevenue)) / Number(previousStats.totalRevenue)) * 100
      : 0;
    
    const ordersChange = previousStats?.orderCount && Number(previousStats.orderCount) > 0
      ? ((Number(currentStats?.orderCount || 0) - Number(previousStats.orderCount)) / Number(previousStats.orderCount)) * 100
      : 0;
    
    // Get pending orders count
    const [pendingOrders] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(
        eq(orders.storeId, auth.store.id),
        eq(orders.status, 'pending'),
        isNull(orders.archivedAt)
      ));
    
    // Get unread orders count
    const [unreadOrders] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(
        eq(orders.storeId, auth.store.id),
        eq(orders.isRead, false),
        isNull(orders.archivedAt)
      ));
    
    // Get low stock products
    const [lowStockCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(
        eq(products.storeId, auth.store.id),
        eq(products.trackInventory, true),
        lt(products.inventory, 5),
        sql`${products.inventory} > 0`
      ));
    
    // Get out of stock products
    const [outOfStockCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(
        eq(products.storeId, auth.store.id),
        eq(products.trackInventory, true),
        lte(products.inventory, 0)
      ));
    
    // Get new customers in period
    const [newCustomers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(and(
        eq(customers.storeId, auth.store.id),
        gte(customers.createdAt, startDate),
        lte(customers.createdAt, endDate)
      ));
    
    // Get top selling products in period
    const topProducts = await db
      .select({
        productId: orderItems.productId,
        name: orderItems.name,
        totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
        totalRevenue: sql<number>`SUM(${orderItems.total})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(
        eq(orders.storeId, auth.store.id),
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
        sql`${orders.status} != 'cancelled'`
      ))
      .groupBy(orderItems.productId, orderItems.name)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(5);
    
    // Get recent orders
    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        status: orders.status,
        total: orders.total,
        isRead: orders.isRead,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(and(
        eq(orders.storeId, auth.store.id),
        isNull(orders.archivedAt)
      ))
      .orderBy(desc(orders.createdAt))
      .limit(5);
    
    return NextResponse.json({
      success: true,
      summary: {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        revenue: {
          current: Number(currentStats?.totalRevenue || 0),
          previous: Number(previousStats?.totalRevenue || 0),
          changePercent: Math.round(revenueChange * 100) / 100,
        },
        orders: {
          current: Number(currentStats?.orderCount || 0),
          previous: Number(previousStats?.orderCount || 0),
          changePercent: Math.round(ordersChange * 100) / 100,
        },
        averageOrderValue: Number(currentStats?.averageOrderValue || 0),
        pendingOrders: Number(pendingOrders?.count || 0),
        unreadOrders: Number(unreadOrders?.count || 0),
        newCustomers: Number(newCustomers?.count || 0),
        inventory: {
          lowStock: Number(lowStockCount?.count || 0),
          outOfStock: Number(outOfStockCount?.count || 0),
        },
      },
      topProducts: topProducts.map(p => ({
        productId: p.productId,
        name: p.name,
        totalQuantity: Number(p.totalQuantity),
        totalRevenue: Number(p.totalRevenue),
      })),
      recentOrders: recentOrders.map(o => ({
        ...o,
        total: Number(o.total),
      })),
    });
    
  } catch (error) {
    console.error('Mobile analytics summary error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

