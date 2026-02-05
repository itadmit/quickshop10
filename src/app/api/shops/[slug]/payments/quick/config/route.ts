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
    
    const credentials = providerConfig.credentials as Record<string, string>;
    const settings = providerConfig.settings as Record<string, unknown>;
    const sellerMPL = credentials?.sellerPaymeId;
    const testMode = providerConfig.testMode ?? true;
    
    if (!sellerMPL) {
      return NextResponse.json(
        { error: 'Seller ID not configured' },
        { status: 400 }
      );
    }
    
    // Fetch seller's public key from PayMe API
    const clientKey = process.env.PAYME_CLIENT_KEY;
    if (!clientKey) {
      return NextResponse.json(
        { error: 'Payment provider not configured' },
        { status: 500 }
      );
    }
    
    const apiUrl = testMode 
      ? 'https://sandbox.payme.io/api' 
      : 'https://ng.payme.io/api';
    
    try {
      const response = await fetch(`${apiUrl}/sellers/${sellerMPL}/public-keys`, {
        method: 'GET',
        headers: {
          'PayMe-Partner-Key': clientKey,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('[Quick Config] Failed to fetch public key:', response.status);
        return NextResponse.json(
          { error: 'Failed to get payment configuration' },
          { status: 500 }
        );
      }
      
      const data = await response.json();
      const publicKey = data.items?.find((item: { is_active?: boolean; uuid?: string }) => item.is_active)?.uuid 
        || data.items?.[0]?.uuid;
      
      if (!publicKey) {
        return NextResponse.json(
          { error: 'Seller public key not found' },
          { status: 404 }
        );
      }
      
      // Only return public information - never return secrets
      return NextResponse.json({
        publicKey,
        testMode,
        maxInstallments: settings.maxInstallments ?? 12,
        language: settings.language ?? 'he',
      });
    } catch (error) {
      console.error('[Quick Config] Error fetching public key:', error);
      return NextResponse.json(
        { error: 'Failed to get payment configuration' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('[Quick Payments Config] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

