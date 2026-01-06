/**
 * Mobile Customers List API
 * GET /api/mobile/customers
 * 
 * Returns paginated list of customers for the store
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers, orders } from '@/lib/db/schema';
import { eq, and, desc, asc, like, or, sql, gte } from 'drizzle-orm';
import { requireMobileAuthWithStore } from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuthWithStore(request);
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const search = searchParams.get('search');
    const hasOrders = searchParams.get('hasOrders');
    const hasCredit = searchParams.get('hasCredit') === 'true';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const offset = (page - 1) * limit;
    
    // Build conditions
    const conditions = [eq(customers.storeId, auth.store.id)];
    
    // Filters
    if (hasOrders === 'true') {
      conditions.push(gte(customers.totalOrders, 1));
    } else if (hasOrders === 'false') {
      conditions.push(eq(customers.totalOrders, 0));
    }
    
    if (hasCredit) {
      conditions.push(sql`${customers.creditBalance} > 0`);
    }
    
    // Search
    if (search) {
      conditions.push(
        or(
          like(customers.email, `%${search}%`),
          like(customers.firstName, `%${search}%`),
          like(customers.lastName, `%${search}%`),
          like(customers.phone, `%${search}%`)
        )!
      );
    }
    
    // Sort
    let orderByColumn;
    switch (sortBy) {
      case 'name':
        orderByColumn = customers.firstName;
        break;
      case 'totalSpent':
        orderByColumn = customers.totalSpent;
        break;
      case 'totalOrders':
        orderByColumn = customers.totalOrders;
        break;
      default:
        orderByColumn = customers.createdAt;
    }
    const orderDirection = sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn);
    
    // Get customers
    const customersData = await db
      .select({
        id: customers.id,
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
        phone: customers.phone,
        totalOrders: customers.totalOrders,
        totalSpent: customers.totalSpent,
        creditBalance: customers.creditBalance,
        acceptsMarketing: customers.acceptsMarketing,
        emailVerifiedAt: customers.emailVerifiedAt,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .where(and(...conditions))
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset);
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(and(...conditions));
    
    // Get stats
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        withOrders: sql<number>`count(*) filter (where ${customers.totalOrders} > 0)`,
        returning: sql<number>`count(*) filter (where ${customers.totalOrders} > 1)`,
        withCredit: sql<number>`count(*) filter (where ${customers.creditBalance} > 0)`,
        acceptsMarketing: sql<number>`count(*) filter (where ${customers.acceptsMarketing} = true)`,
      })
      .from(customers)
      .where(eq(customers.storeId, auth.store.id));
    
    return NextResponse.json({
      success: true,
      customers: customersData.map(c => ({
        ...c,
        name: [c.firstName, c.lastName].filter(Boolean).join(' ') || null,
        totalSpent: Number(c.totalSpent),
        creditBalance: Number(c.creditBalance),
      })),
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
      stats: {
        total: Number(stats?.total || 0),
        withOrders: Number(stats?.withOrders || 0),
        returning: Number(stats?.returning || 0),
        withCredit: Number(stats?.withCredit || 0),
        acceptsMarketing: Number(stats?.acceptsMarketing || 0),
      },
    });
    
  } catch (error) {
    console.error('Mobile customers list error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

