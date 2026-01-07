/**
 * Product Reviews Plugin Config API
 * 
 * PUT: Update plugin configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { storePlugins, stores } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const config = await request.json();

    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Update plugin config
    await db
      .update(storePlugins)
      .set({
        config: config,
        updatedAt: new Date(),
      })
      .where(and(
        eq(storePlugins.storeId, store.id),
        eq(storePlugins.pluginSlug, 'product-reviews')
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating plugin config:', error);
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 }
    );
  }
}

