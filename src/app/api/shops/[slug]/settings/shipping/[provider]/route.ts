import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stores, shippingProviders, storeMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { ShippingProviderType } from '@/lib/shipping/types';

/**
 * Shipping Providers API
 * CRUD operations for store shipping provider configuration
 */

// Valid provider types
const VALID_PROVIDERS: ShippingProviderType[] = ['focus', 'cargo', 'cheetah', 'hfd', 'boxit', 'baldar', 'manual'];

// Helper to verify store access
async function verifyStoreAccess(slug: string, userId: string) {
  const store = await db
    .select({ id: stores.id, ownerId: stores.ownerId })
    .from(stores)
    .where(eq(stores.slug, slug))
    .then(rows => rows[0]);

  if (!store) return null;

  // Check if owner or team member
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

// GET - Get provider configuration
export async function GET(
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

    const existing = await db
      .select()
      .from(shippingProviders)
      .where(and(
        eq(shippingProviders.storeId, store.id),
        eq(shippingProviders.provider, provider)
      ))
      .then(rows => rows[0]);

    if (!existing) {
      return NextResponse.json({ error: 'Provider not configured' }, { status: 404 });
    }

    // Don't expose credentials in response
    return NextResponse.json({
      id: existing.id,
      provider: existing.provider,
      isActive: existing.isActive,
      isDefault: existing.isDefault,
      displayName: existing.displayName,
      testMode: existing.testMode,
      settings: existing.settings,
      hasCredentials: Object.keys(existing.credentials as object || {}).length > 0,
    });
  } catch (error) {
    console.error('Error getting shipping provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new provider configuration
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
    const { credentials, settings, testMode, displayName, isActive } = body;

    // Check if already exists
    const existing = await db
      .select()
      .from(shippingProviders)
      .where(and(
        eq(shippingProviders.storeId, store.id),
        eq(shippingProviders.provider, provider)
      ))
      .then(rows => rows[0]);

    if (existing) {
      return NextResponse.json({ error: 'Provider already configured' }, { status: 409 });
    }

    // Check if this is the first active provider - make it default
    const activeProviders = await db
      .select()
      .from(shippingProviders)
      .where(and(
        eq(shippingProviders.storeId, store.id),
        eq(shippingProviders.isActive, true)
      ));

    const isDefault = activeProviders.length === 0;

    // Create new provider
    const [newProvider] = await db.insert(shippingProviders).values({
      storeId: store.id,
      provider,
      credentials: credentials || {},
      settings: settings || {},
      testMode: testMode ?? true,
      displayName: displayName || null,
      isActive: isActive ?? true,
      isDefault,
    }).returning();

    return NextResponse.json({
      success: true,
      provider: {
        id: newProvider.id,
        provider: newProvider.provider,
        isActive: newProvider.isActive,
        isDefault: newProvider.isDefault,
      },
    });
  } catch (error) {
    console.error('Error creating shipping provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update provider configuration
export async function PATCH(
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

    const existing = await db
      .select()
      .from(shippingProviders)
      .where(and(
        eq(shippingProviders.storeId, store.id),
        eq(shippingProviders.provider, provider)
      ))
      .then(rows => rows[0]);

    if (!existing) {
      return NextResponse.json({ error: 'Provider not configured' }, { status: 404 });
    }

    const body = await request.json();
    const { credentials, settings, testMode, displayName, isActive, isDefault } = body;

    // Build update object
    const updateData: Partial<typeof shippingProviders.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (credentials !== undefined) {
      // Merge credentials - keep existing if not provided
      const existingCreds = existing.credentials as Record<string, string> || {};
      const newCreds: Record<string, string> = {};
      for (const [key, value] of Object.entries(credentials)) {
        if (value && typeof value === 'string' && value.trim()) {
          newCreds[key] = value;
        } else if (existingCreds[key]) {
          newCreds[key] = existingCreds[key];
        }
      }
      updateData.credentials = newCreds;
    }

    if (settings !== undefined) {
      updateData.settings = { ...(existing.settings as object), ...settings };
    }

    if (testMode !== undefined) {
      updateData.testMode = testMode;
    }

    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Handle setting as default
    if (isDefault === true) {
      // Clear other defaults first
      await db
        .update(shippingProviders)
        .set({ isDefault: false })
        .where(eq(shippingProviders.storeId, store.id));
      
      updateData.isDefault = true;
    }

    // Update
    const [updated] = await db
      .update(shippingProviders)
      .set(updateData)
      .where(eq(shippingProviders.id, existing.id))
      .returning();

    return NextResponse.json({
      success: true,
      provider: {
        id: updated.id,
        provider: updated.provider,
        isActive: updated.isActive,
        isDefault: updated.isDefault,
      },
    });
  } catch (error) {
    console.error('Error updating shipping provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove provider configuration
export async function DELETE(
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

    await db
      .delete(shippingProviders)
      .where(and(
        eq(shippingProviders.storeId, store.id),
        eq(shippingProviders.provider, provider)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shipping provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

