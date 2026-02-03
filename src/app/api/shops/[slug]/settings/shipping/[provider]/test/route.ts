import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stores, storeMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { ShippingProviderType, ShippingProviderConfig } from '@/lib/shipping/types';
import { createShippingProviderInstance } from '@/lib/shipping/factory';

/**
 * Test Shipping Provider Connection
 * POST /api/shops/[slug]/settings/shipping/[provider]/test
 */

const VALID_PROVIDERS: ShippingProviderType[] = ['focus', 'cargo', 'cheetah', 'hfd', 'boxit', 'baldar', 'manual'];

// Helper to verify store access
async function verifyStoreAccess(slug: string, userId: string) {
  const store = await db
    .select({ id: stores.id, ownerId: stores.ownerId })
    .from(stores)
    .where(eq(stores.slug, slug))
    .then(rows => rows[0]);

  if (!store) return null;

  if (store.ownerId === userId) return store;

  const storeMember = await db
    .select()
    .from(storeMembers)
    .where(and(
      eq(storeMembers.storeId, store.id),
      eq(storeMembers.userId, userId)
    ))
    .then(rows => rows[0]);

  if (storeMember) return store;
  return null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string; provider: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, provider: providerStr } = await context.params;
    const provider = providerStr as ShippingProviderType;

    if (!VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const store = await verifyStoreAccess(slug, session.user.id);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const body = await request.json();
    const { credentials, testMode } = body;

    // Manual provider always succeeds
    if (provider === 'manual') {
      return NextResponse.json({ success: true, message: 'ספק ידני לא דורש בדיקת חיבור' });
    }

    // Create provider instance and test
    const providerInstance = createShippingProviderInstance(provider);
    
    if (!providerInstance) {
      return NextResponse.json({ 
        success: false, 
        error: 'ספק זה עדיין לא נתמך' 
      });
    }

    const config: ShippingProviderConfig = {
      provider,
      credentials: credentials || {},
      settings: {},
      isActive: true,
      testMode: testMode ?? true,
    };

    providerInstance.configure(config);

    const result = await providerInstance.testConnection();

    return NextResponse.json({
      success: result.success,
      error: result.error,
    });
  } catch (error) {
    console.error('Error testing shipping provider:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'שגיאה בבדיקת החיבור' 
    });
  }
}

