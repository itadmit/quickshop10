/**
 * Payment Provider Connection Test API
 * POST /api/shops/[slug]/settings/payments/[provider]/test
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { createProviderInstance } from '@/lib/payments';
import type { PaymentProviderType, PaymentProviderConfig } from '@/lib/payments/types';

interface RouteParams {
  params: Promise<{
    slug: string;
    provider: string;
  }>;
}

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
    const validProviders: PaymentProviderType[] = ['payplus', 'placard', 'quick_payments'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider', success: false }, { status: 400 });
    }

    // Get store (just to verify access)
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found', success: false }, { status: 404 });
    }

    // Validate credentials provided
    if (!body.credentials || Object.keys(body.credentials).length === 0) {
      return NextResponse.json({ error: 'Credentials required', success: false }, { status: 400 });
    }

    // Create provider instance
    const providerInstance = createProviderInstance(provider);

    // Configure with provided credentials
    const config: PaymentProviderConfig = {
      provider,
      credentials: body.credentials,
      settings: body.settings || {},
      isActive: true,
      testMode: body.testMode ?? true,
    };

    try {
      providerInstance.configure(config);
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Invalid configuration',
      });
    }

    // Test connection
    const result = await providerInstance.testConnection();

    return NextResponse.json({
      success: result.success,
      error: result.error,
    });
  } catch (error) {
    console.error('Test payment provider error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    }, { status: 500 });
  }
}

