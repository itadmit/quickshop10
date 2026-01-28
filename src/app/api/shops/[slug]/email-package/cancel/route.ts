/**
 * Email Package Cancel API
 * POST /api/shops/[slug]/email-package/cancel
 * 
 * Cancels email package subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { cancelEmailSubscription } from '@/lib/email-packages';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    // Get store
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }

    // Parse optional reason from body
    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = body.reason;
    } catch {
      // No body or invalid JSON - that's ok
    }

    // Cancel subscription
    const result = await cancelEmailSubscription(store.id, reason);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'חבילת הדיוור בוטלה. תוכל להמשיך להשתמש בה עד סוף תקופת החיוב הנוכחית.',
    });

  } catch (error) {
    console.error('[Email Package Cancel] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

