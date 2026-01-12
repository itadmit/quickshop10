/**
 * Payment Provider Settings API
 * GET/POST/PATCH /api/shops/[slug]/settings/payments/[provider]
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, paymentProviders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import type { PaymentProviderType } from '@/lib/payments/types';

interface RouteParams {
  params: Promise<{
    slug: string;
    provider: string;
  }>;
}

// GET - Get provider configuration
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, provider: providerStr } = await params;
    const provider = providerStr as PaymentProviderType;

    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get provider config
    const [config] = await db
      .select()
      .from(paymentProviders)
      .where(
        and(
          eq(paymentProviders.storeId, store.id),
          eq(paymentProviders.provider, provider)
        )
      )
      .limit(1);

    if (!config) {
      return NextResponse.json({ error: 'Provider not configured' }, { status: 404 });
    }

    // Don't expose sensitive credentials
    const safeConfig = {
      ...config,
      credentials: Object.keys(config.credentials as Record<string, string> || {}).reduce((acc, key) => {
        acc[key] = '••••••••';
        return acc;
      }, {} as Record<string, string>),
    };

    return NextResponse.json(safeConfig);
  } catch (error) {
    console.error('Get payment provider error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new provider configuration
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, provider: providerStr } = await params;
    const provider = providerStr as PaymentProviderType;
    const body = await request.json();

    // Validate provider type
    const validProviders: PaymentProviderType[] = ['payplus', 'pelecard', 'quick_payments'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Check if already exists
    const [existing] = await db
      .select()
      .from(paymentProviders)
      .where(
        and(
          eq(paymentProviders.storeId, store.id),
          eq(paymentProviders.provider, provider)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: 'Provider already configured' }, { status: 400 });
    }

    // Check if this will be the first/only active provider - make it default
    const [otherActive] = await db
      .select()
      .from(paymentProviders)
      .where(
        and(
          eq(paymentProviders.storeId, store.id),
          eq(paymentProviders.isActive, true)
        )
      )
      .limit(1);

    const isDefault = !otherActive && body.isActive !== false;

    // Create provider config
    const [newProvider] = await db.insert(paymentProviders).values({
      storeId: store.id,
      provider,
      isActive: body.isActive ?? true,
      isDefault,
      displayName: body.displayName || null,
      testMode: body.testMode ?? true,
      credentials: body.credentials || {},
      settings: body.settings || {},
    }).returning();

    return NextResponse.json({
      success: true,
      provider: {
        ...newProvider,
        credentials: undefined, // Don't return credentials
      },
    });
  } catch (error) {
    console.error('Create payment provider error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update provider configuration
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, provider: providerStr } = await params;
    const provider = providerStr as PaymentProviderType;
    const body = await request.json();

    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get existing config
    const [existing] = await db
      .select()
      .from(paymentProviders)
      .where(
        and(
          eq(paymentProviders.storeId, store.id),
          eq(paymentProviders.provider, provider)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Provider not configured' }, { status: 404 });
    }

    // Build update object
    const updateData: Partial<typeof paymentProviders.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    if (body.displayName !== undefined) {
      updateData.displayName = body.displayName;
    }

    if (body.testMode !== undefined) {
      updateData.testMode = body.testMode;
    }

    if (body.credentials) {
      // Merge with existing credentials (allow partial updates)
      updateData.credentials = {
        ...(existing.credentials as Record<string, string>),
        ...body.credentials,
      };
    }

    if (body.settings) {
      updateData.settings = {
        ...(existing.settings as Record<string, unknown>),
        ...body.settings,
      };
    }

    // Handle isDefault - unset other providers if setting this one as default
    if (body.isDefault === true) {
      // First, unset all other defaults for this store
      await db
        .update(paymentProviders)
        .set({ isDefault: false })
        .where(eq(paymentProviders.storeId, store.id));

      updateData.isDefault = true;
    }

    // Update
    const [updated] = await db
      .update(paymentProviders)
      .set(updateData)
      .where(eq(paymentProviders.id, existing.id))
      .returning();

    return NextResponse.json({
      success: true,
      provider: {
        ...updated,
        credentials: undefined,
      },
    });
  } catch (error) {
    console.error('Update payment provider error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove provider configuration
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, provider: providerStr } = await params;
    const provider = providerStr as PaymentProviderType;

    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Delete provider config
    await db
      .delete(paymentProviders)
      .where(
        and(
          eq(paymentProviders.storeId, store.id),
          eq(paymentProviders.provider, provider)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete payment provider error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

