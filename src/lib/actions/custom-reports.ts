'use server';

import { db } from '@/lib/db';
import { 
  products, 
  orders, 
  orderItems,
  customers, 
  discounts, 
  categories,
  productVariants
} from '@/lib/db/schema';
import { eq, and, gte, lte, sql, desc, asc, isNull, isNotNull, count, sum } from 'drizzle-orm';
import type { ReportParams } from './custom-reports-config';

// ============================================
// Custom Report Builder - Server Actions
// Fast queries using only necessary columns
// ============================================

// Main report generation function
export async function generateCustomReport(params: ReportParams) {
  const { storeId, subject, columns, filters, sortBy, sortDirection, limit = 100 } = params;
  
  // Build date filter
  const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date();
  dateTo.setHours(23, 59, 59, 999);
  
  switch (subject) {
    case 'products':
      return generateProductsReport(storeId, columns, filters, sortBy, sortDirection, limit, dateFrom, dateTo);
    case 'orders':
      return generateOrdersReport(storeId, columns, filters, sortBy, sortDirection, limit, dateFrom, dateTo);
    case 'customers':
      return generateCustomersReport(storeId, columns, filters, sortBy, sortDirection, limit, dateFrom, dateTo);
    case 'coupons':
      return generateCouponsReport(storeId, columns, filters, sortBy, sortDirection, limit, dateFrom, dateTo);
    case 'inventory':
      return generateInventoryReport(storeId, columns, filters, sortBy, sortDirection, limit);
    default:
      return { data: [], total: 0 };
  }
}

// Products Report
async function generateProductsReport(
  storeId: string,
  columns: string[],
  filters: { categoryId?: string },
  sortBy: string,
  sortDirection: 'asc' | 'desc',
  limit: number,
  dateFrom: Date,
  dateTo: Date
) {
  // Build query with sales data
  const data = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      barcode: products.barcode,
      categoryName: categories.name,
      price: products.price,
      comparePrice: products.comparePrice,
      cost: products.cost,
      inventory: products.inventory,
      createdAt: products.createdAt,
      // Aggregated sales data
      quantitySold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)::int`,
      revenue: sql<number>`COALESCE(SUM(${orderItems.total}), 0)::numeric`,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(orderItems, eq(products.id, orderItems.productId))
    .leftJoin(orders, and(
      eq(orderItems.orderId, orders.id),
      gte(orders.createdAt, dateFrom),
      lte(orders.createdAt, dateTo),
      eq(orders.financialStatus, 'paid')
    ))
    .where(and(
      eq(products.storeId, storeId),
      eq(products.isActive, true),
      filters.categoryId ? eq(products.categoryId, filters.categoryId) : undefined
    ))
    .groupBy(products.id, categories.name)
    .orderBy(sortDirection === 'desc' 
      ? desc(sortBy === 'quantitySold' ? sql`COALESCE(SUM(${orderItems.quantity}), 0)` :
             sortBy === 'revenue' ? sql`COALESCE(SUM(${orderItems.total}), 0)` :
             sortBy === 'price' ? products.price :
             sortBy === 'inventory' ? products.inventory :
             products.name)
      : asc(sortBy === 'quantitySold' ? sql`COALESCE(SUM(${orderItems.quantity}), 0)` :
            sortBy === 'revenue' ? sql`COALESCE(SUM(${orderItems.total}), 0)` :
            sortBy === 'price' ? products.price :
            sortBy === 'inventory' ? products.inventory :
            products.name)
    )
    .limit(limit);

  // Calculate profit fields if needed
  const enrichedData = data.map(row => ({
    ...row,
    profit: row.cost && row.price ? Number(row.price) - Number(row.cost) : null,
    profitMargin: row.cost && row.price && Number(row.price) > 0 
      ? ((Number(row.price) - Number(row.cost)) / Number(row.price) * 100).toFixed(1) + '%'
      : null,
  }));

  return { data: enrichedData, total: data.length };
}

// Orders Report
async function generateOrdersReport(
  storeId: string,
  columns: string[],
  filters: { status?: string; minValue?: number; maxValue?: number },
  sortBy: string,
  sortDirection: 'asc' | 'desc',
  limit: number,
  dateFrom: Date,
  dateTo: Date
) {
  const statusFilter = filters.status 
    ? eq(orders.status, filters.status as 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded')
    : undefined;

  const data = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      createdAt: orders.createdAt,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      customerPhone: orders.customerPhone,
      status: orders.status,
      financialStatus: orders.financialStatus,
      total: orders.total,
      subtotal: orders.subtotal,
      discountAmount: orders.discountAmount,
      discountCode: orders.discountCode,
      shippingMethod: orders.shippingMethod,
      shippingAmount: orders.shippingAmount,
      paymentMethod: orders.paymentMethod,
      shippingAddress: orders.shippingAddress,
      utmSource: orders.utmSource,
      utmCampaign: orders.utmCampaign,
      deviceType: orders.deviceType,
    })
    .from(orders)
    .where(and(
      eq(orders.storeId, storeId),
      gte(orders.createdAt, dateFrom),
      lte(orders.createdAt, dateTo),
      statusFilter,
      isNull(orders.archivedAt),
      filters.minValue ? gte(orders.total, String(filters.minValue)) : undefined,
      filters.maxValue ? lte(orders.total, String(filters.maxValue)) : undefined
    ))
    .orderBy(sortDirection === 'desc'
      ? desc(sortBy === 'total' ? orders.total :
             sortBy === 'createdAt' ? orders.createdAt :
             sortBy === 'orderNumber' ? orders.orderNumber :
             orders.createdAt)
      : asc(sortBy === 'total' ? orders.total :
            sortBy === 'createdAt' ? orders.createdAt :
            sortBy === 'orderNumber' ? orders.orderNumber :
            orders.createdAt)
    )
    .limit(limit);

  // Extract city from shipping address
  const enrichedData = data.map(row => ({
    ...row,
    city: (row.shippingAddress as { city?: string })?.city || null,
  }));

  // Get item counts
  const orderIds = data.map(o => o.id);
  if (orderIds.length > 0 && columns.includes('itemCount')) {
    const itemCounts = await db
      .select({
        orderId: orderItems.orderId,
        itemCount: count(),
      })
      .from(orderItems)
      .where(sql`${orderItems.orderId} = ANY(${orderIds})`)
      .groupBy(orderItems.orderId);

    const countMap = new Map(itemCounts.map(i => [i.orderId, i.itemCount]));
    enrichedData.forEach(row => {
      (row as Record<string, unknown>).itemCount = countMap.get(row.id) || 0;
    });
  }

  return { data: enrichedData, total: data.length };
}

// Customers Report
async function generateCustomersReport(
  storeId: string,
  columns: string[],
  filters: { minValue?: number },
  sortBy: string,
  sortDirection: 'asc' | 'desc',
  limit: number,
  dateFrom: Date,
  dateTo: Date
) {
  // Get customers with order stats
  const data = await db
    .select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phone: customers.phone,
      createdAt: customers.createdAt,
      totalOrders: customers.totalOrders,
      totalSpent: customers.totalSpent,
      defaultAddress: customers.defaultAddress,
    })
    .from(customers)
    .where(and(
      eq(customers.storeId, storeId),
      filters.minValue ? gte(customers.totalSpent, String(filters.minValue)) : undefined
    ))
    .orderBy(sortDirection === 'desc'
      ? desc(sortBy === 'totalSpent' ? customers.totalSpent :
             sortBy === 'totalOrders' ? customers.totalOrders :
             sortBy === 'createdAt' ? customers.createdAt :
             customers.createdAt)
      : asc(sortBy === 'totalSpent' ? customers.totalSpent :
            sortBy === 'totalOrders' ? customers.totalOrders :
            sortBy === 'createdAt' ? customers.createdAt :
            customers.createdAt)
    )
    .limit(limit);

  // Enrich with computed fields
  const enrichedData = data.map(row => ({
    ...row,
    name: [row.firstName, row.lastName].filter(Boolean).join(' ') || 'אורח',
    avgOrderValue: row.totalOrders && Number(row.totalOrders) > 0 
      ? (Number(row.totalSpent) / Number(row.totalOrders)).toFixed(2)
      : null,
    city: (row.defaultAddress as { city?: string })?.city || null,
  }));

  // Get last order dates if needed
  if (columns.includes('lastOrderDate')) {
    const customerIds = data.map(c => c.id);
    if (customerIds.length > 0) {
      const lastOrders = await db
        .select({
          customerId: orders.customerId,
          lastOrderDate: sql<Date>`MAX(${orders.createdAt})`,
        })
        .from(orders)
        .where(sql`${orders.customerId} = ANY(${customerIds})`)
        .groupBy(orders.customerId);

      const dateMap = new Map(lastOrders.map(o => [o.customerId, o.lastOrderDate]));
      enrichedData.forEach(row => {
        (row as Record<string, unknown>).lastOrderDate = dateMap.get(row.id) || null;
      });
    }
  }

  return { data: enrichedData, total: data.length };
}

// Coupons Report
async function generateCouponsReport(
  storeId: string,
  columns: string[],
  _filters: { dateFrom?: string; dateTo?: string },
  sortBy: string,
  sortDirection: 'asc' | 'desc',
  limit: number,
  dateFrom: Date,
  dateTo: Date
) {
  const data = await db
    .select({
      id: discounts.id,
      code: discounts.code,
      title: discounts.title,
      type: discounts.type,
      value: discounts.value,
      usageCount: discounts.usageCount,
      usageLimit: discounts.usageLimit,
      startsAt: discounts.startsAt,
      endsAt: discounts.endsAt,
      isActive: discounts.isActive,
    })
    .from(discounts)
    .where(eq(discounts.storeId, storeId))
    .orderBy(sortDirection === 'desc'
      ? desc(sortBy === 'usageCount' ? discounts.usageCount :
             sortBy === 'value' ? discounts.value :
             discounts.code)
      : asc(sortBy === 'usageCount' ? discounts.usageCount :
            sortBy === 'value' ? discounts.value :
            discounts.code)
    )
    .limit(limit);

  // Calculate revenue and total discount for each coupon
  const couponCodes = data.map(d => d.code);
  if (couponCodes.length > 0 && (columns.includes('revenue') || columns.includes('totalDiscount'))) {
    const couponStats = await db
      .select({
        discountCode: orders.discountCode,
        revenue: sum(orders.total),
        totalDiscount: sum(orders.discountAmount),
      })
      .from(orders)
      .where(and(
        eq(orders.storeId, storeId),
        isNotNull(orders.discountCode),
        gte(orders.createdAt, dateFrom),
        lte(orders.createdAt, dateTo)
      ))
      .groupBy(orders.discountCode);

    const statsMap = new Map(couponStats.map(s => [s.discountCode, s]));
    const enrichedData = data.map(row => ({
      ...row,
      revenue: statsMap.get(row.code)?.revenue || 0,
      totalDiscount: statsMap.get(row.code)?.totalDiscount || 0,
    }));

    return { data: enrichedData, total: data.length };
  }

  return { data, total: data.length };
}

// Inventory Report
async function generateInventoryReport(
  storeId: string,
  columns: string[],
  filters: { minValue?: number; maxValue?: number },
  sortBy: string,
  sortDirection: 'asc' | 'desc',
  limit: number
) {
  // Products without variants
  const simpleProducts = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      price: products.price,
      inventory: products.inventory,
      hasVariants: products.hasVariants,
    })
    .from(products)
    .where(and(
      eq(products.storeId, storeId),
      eq(products.hasVariants, false),
      eq(products.trackInventory, true),
      filters.maxValue !== undefined ? lte(products.inventory, filters.maxValue) : undefined,
      filters.minValue !== undefined ? gte(products.inventory, filters.minValue) : undefined
    ));

  // Products with variants
  const variantProducts = await db
    .select({
      id: productVariants.id,
      productId: products.id,
      name: products.name,
      variantTitle: productVariants.title,
      sku: productVariants.sku,
      price: productVariants.price,
      inventory: productVariants.inventory,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(and(
      eq(products.storeId, storeId),
      eq(products.hasVariants, true),
      filters.maxValue !== undefined ? lte(productVariants.inventory, filters.maxValue) : undefined,
      filters.minValue !== undefined ? gte(productVariants.inventory, filters.minValue) : undefined
    ));

  // Combine and sort
  const combined = [
    ...simpleProducts.map(p => ({
      id: p.id,
      name: p.name,
      variantTitle: null,
      sku: p.sku,
      price: p.price,
      inventory: p.inventory,
      inventoryValue: p.inventory && p.price ? Number(p.inventory) * Number(p.price) : 0,
    })),
    ...variantProducts.map(v => ({
      id: v.id,
      name: v.name,
      variantTitle: v.variantTitle,
      sku: v.sku,
      price: v.price,
      inventory: v.inventory,
      inventoryValue: v.inventory && v.price ? Number(v.inventory) * Number(v.price) : 0,
    })),
  ];

  // Sort
  combined.sort((a, b) => {
    const aVal = sortBy === 'inventory' ? (a.inventory || 0) :
                 sortBy === 'price' ? Number(a.price || 0) :
                 sortBy === 'inventoryValue' ? a.inventoryValue :
                 a.name;
    const bVal = sortBy === 'inventory' ? (b.inventory || 0) :
                 sortBy === 'price' ? Number(b.price || 0) :
                 sortBy === 'inventoryValue' ? b.inventoryValue :
                 b.name;
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    }
    return sortDirection === 'desc' 
      ? String(bVal).localeCompare(String(aVal), 'he')
      : String(aVal).localeCompare(String(bVal), 'he');
  });

  return { data: combined.slice(0, limit), total: combined.length };
}

// Get categories for filter
export async function getStoreCategories(storeId: string) {
  return db
    .select({
      id: categories.id,
      name: categories.name,
    })
    .from(categories)
    .where(eq(categories.storeId, storeId))
    .orderBy(categories.name);
}
