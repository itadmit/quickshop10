/**
 * Mobile Store Info API
 * GET /api/mobile/store - Get current store info
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, products, orders, customers, paymentProviders } from '@/lib/db/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { requireMobileAuthWithStore } from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuthWithStore(request);
    
    // Get store details
    const [store] = await db
      .select({
        id: stores.id,
        name: stores.name,
        slug: stores.slug,
        logoUrl: stores.logoUrl,
        faviconUrl: stores.faviconUrl,
        customDomain: stores.customDomain,
        currency: stores.currency,
        timezone: stores.timezone,
        settings: stores.settings,
        isPublished: stores.isPublished,
        plan: stores.plan,
        createdAt: stores.createdAt,
      })
      .from(stores)
      .where(eq(stores.id, auth.store.id))
      .limit(1);
    
    if (!store) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }
    
    // Get counts
    const [productCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.storeId, auth.store.id));
    
    const [orderCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(
        eq(orders.storeId, auth.store.id),
        isNull(orders.archivedAt)
      ));
    
    const [customerCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(eq(customers.storeId, auth.store.id));
    
    // Check payment providers
    const paymentProvidersList = await db
      .select({
        provider: paymentProviders.provider,
        isActive: paymentProviders.isActive,
        displayName: paymentProviders.displayName,
      })
      .from(paymentProviders)
      .where(eq(paymentProviders.storeId, auth.store.id));
    
    return NextResponse.json({
      success: true,
      store: {
        ...store,
        role: auth.store.role,
        permissions: auth.store.permissions,
      },
      settings: {
        currency: store.currency,
        timezone: store.timezone,
        ...(store.settings as Record<string, unknown> || {}),
      },
      counts: {
        products: Number(productCount?.count || 0),
        orders: Number(orderCount?.count || 0),
        customers: Number(customerCount?.count || 0),
      },
      paymentProviders: paymentProvidersList,
    });
    
  } catch (error) {
    console.error('Mobile store info error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch store info' },
      { status: 500 }
    );
  }
}

