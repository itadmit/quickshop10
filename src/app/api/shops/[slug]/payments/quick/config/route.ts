/**
 * Quick Payments Config API
 * GET /api/shops/[slug]/payments/quick/config
 * 
 * Returns public configuration for QuickPayments Hosted Fields
 * Only returns public key and settings - no secrets
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, paymentProviders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;
    
    // Get store
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);
    
    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }
    
    // Get Quick Payments provider config
    const [providerConfig] = await db
      .select()
      .from(paymentProviders)
      .where(
        and(
          eq(paymentProviders.storeId, store.id),
          eq(paymentProviders.provider, 'quick_payments'),
          eq(paymentProviders.isActive, true)
        )
      )
      .limit(1);
    
    if (!providerConfig) {
      return NextResponse.json(
        { error: 'Quick Payments not configured' },
        { status: 404 }
      );
    }
    
    const settings = providerConfig.settings as Record<string, unknown>;
    
    // Use platform's shared PayMe public key from environment
    // Each store only provides their seller ID (MPL), the platform provides the API key
    const platformPublicKey = process.env.PAYME_PUBLIC_KEY;
    
    if (!platformPublicKey) {
      return NextResponse.json(
        { error: 'Payment provider not configured' },
        { status: 500 }
      );
    }
    
    // Only return public information - never return secrets
    return NextResponse.json({
      publicKey: platformPublicKey,
      testMode: providerConfig.testMode,
      maxInstallments: settings.maxInstallments ?? 12,
      language: settings.language ?? 'he',
    });
    
  } catch (error) {
    console.error('[Quick Payments Config] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

