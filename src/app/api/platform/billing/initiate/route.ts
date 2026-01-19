/**
 * Initiate Subscription Payment
 * POST /api/platform/billing/initiate
 * 
 * יוצר עמוד תשלום PayPlus לתשלום ראשוני של מנוי
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stores, storeSubscriptions, storeMembers, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { initiateSubscriptionPayment, calculateSubscriptionPrice } from '@/lib/billing';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { storeId, plan, billingDetails: providedBillingDetails } = body as {
      storeId: string;
      plan: 'branding' | 'quickshop';
      billingDetails?: {
        name?: string;
        email?: string;
        phone?: string;
        vatNumber?: string;
        address?: string;
        city?: string;
      };
    };

    // Get user details as fallback for billing info
    const user = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, session.user.id))
      .then(rows => rows[0]);

    // Use provided billing details or fallback to user details
    const billingDetails = {
      name: providedBillingDetails?.name || user?.name || session.user.name || 'לקוח',
      email: providedBillingDetails?.email || user?.email || session.user.email || '',
      phone: providedBillingDetails?.phone,
      vatNumber: providedBillingDetails?.vatNumber,
      address: providedBillingDetails?.address,
      city: providedBillingDetails?.city,
    };

    // Validate plan
    if (!['branding', 'quickshop'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get store and verify ownership
    const store = await db
      .select({
        id: stores.id,
        name: stores.name,
        ownerId: stores.ownerId,
      })
      .from(stores)
      .where(eq(stores.id, storeId))
      .then(rows => rows[0]);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Check if user is owner or member
    const isOwner = store.ownerId === session.user.id;
    const isMember = !isOwner && await db
      .select({ id: storeMembers.id })
      .from(storeMembers)
      .where(and(
        eq(storeMembers.storeId, storeId),
        eq(storeMembers.userId, session.user.id)
      ))
      .then(rows => rows.length > 0);

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get or create subscription
    let subscription = await db
      .select()
      .from(storeSubscriptions)
      .where(eq(storeSubscriptions.storeId, storeId))
      .then(rows => rows[0]);

    if (!subscription) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      [subscription] = await db
        .insert(storeSubscriptions)
        .values({
          storeId,
          plan: 'trial',
          status: 'trial',
          trialEndsAt,
          billingEmail: billingDetails.email,
          billingName: store.name, // Default to store name
          billingPhone: billingDetails.phone,
          vatNumber: billingDetails.vatNumber,
        })
        .returning();
    }
    // NOTE: We don't override billing details here - they are managed via the billing-details API
    // This allows users to set custom billing names that persist across payments

    // Build URLs - use slug for clean URLs
    // Use origin from request for localhost support, fallback to env var
    const origin = request.headers.get('origin') || request.headers.get('host') 
      ? `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`
      : null;
    const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || '';
    
    // Get store slug from DB
    const storeWithSlug = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
      columns: { slug: true },
    });
    const storeSlug = storeWithSlug?.slug || store.id; // Fallback to ID if slug not found
    const successUrl = `${baseUrl}/shops/${storeSlug}/admin/settings/subscription?success=true`;
    const failureUrl = `${baseUrl}/shops/${storeSlug}/admin/settings/subscription?error=true`;
    const callbackUrl = `${baseUrl}/api/platform/billing/callback`;

    console.log('[Billing Initiate] Building URLs:', {
      origin,
      baseUrl,
      successUrl,
      failureUrl,
      callbackUrl,
      envUrl: process.env.NEXT_PUBLIC_APP_URL,
    });

    // Initiate PayPlus payment
    // Use billingName from subscription (user can customize this)
    const invoiceName = subscription.billingName || store.name;
    
    const { paymentPageUrl, pageRequestUid } = await initiateSubscriptionPayment({
      storeId,
      storeName: store.name,
      plan,
      customer: {
        name: invoiceName, // Use billing name for invoice (customizable)
        email: subscription.billingEmail || billingDetails.email,
        phone: subscription.billingPhone || billingDetails.phone,
        vatNumber: subscription.vatNumber || billingDetails.vatNumber,
        address: billingDetails.address,
        city: billingDetails.city,
      },
      successUrl,
      failureUrl,
      callbackUrl, // Pass callback URL for localhost support
    });

    // Return payment page URL
    const pricing = calculateSubscriptionPrice(plan);

    return NextResponse.json({
      success: true,
      paymentPageUrl,
      pageRequestUid,
      pricing: {
        basePrice: pricing.basePrice,
        vatAmount: pricing.vatAmount,
        totalPrice: pricing.totalPrice,
      },
    });
  } catch (error) {
    console.error('[Billing] Error initiating payment:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}

