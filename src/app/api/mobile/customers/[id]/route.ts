/**
 * Mobile Customer Detail API
 * GET /api/mobile/customers/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers, orders, orderItems } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireMobileAuthWithStore } from '@/lib/mobile-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireMobileAuthWithStore(request);
    const { id } = await params;
    
    // Get customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(
        eq(customers.id, id),
        eq(customers.storeId, auth.store.id)
      ))
      .limit(1);
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Get recent orders
    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        total: orders.total,
        itemCount: sql<number>`(SELECT COUNT(*) FROM ${orderItems} WHERE ${orderItems.orderId} = ${orders.id})`,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.customerId, customer.id))
      .orderBy(desc(orders.createdAt))
      .limit(10);
    
    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        name: [customer.firstName, customer.lastName].filter(Boolean).join(' ') || null,
        phone: customer.phone,
        defaultAddress: customer.defaultAddress,
        totalOrders: customer.totalOrders,
        totalSpent: Number(customer.totalSpent),
        creditBalance: Number(customer.creditBalance),
        acceptsMarketing: customer.acceptsMarketing,
        emailVerified: !!customer.emailVerifiedAt,
        notes: customer.notes,
        createdAt: customer.createdAt,
      },
      recentOrders: recentOrders.map(o => ({
        ...o,
        total: Number(o.total),
        itemCount: Number(o.itemCount),
      })),
    });
    
  } catch (error) {
    console.error('Mobile customer detail error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

