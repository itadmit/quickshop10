/**
 * Gift Card Purchase API
 * POST /api/shops/[slug]/gift-cards/purchase
 * 
 * Initiates a gift card purchase with payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, giftCards, pendingPayments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getDefaultProvider } from '@/lib/payments';
import { nanoid } from 'nanoid';
import { getGiftCardSettings } from '@/app/shops/[slug]/admin/gift-cards/settings/actions';
import { defaultGiftCardSettings } from '@/app/shops/[slug]/admin/gift-cards/settings/types';

interface PurchaseBody {
  amount: number;
  recipientName: string;
  recipientEmail: string;
  senderName?: string;
  message?: string;
}

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// Generate unique gift card code
function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json() as PurchaseBody;

    // Validate required fields
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'יש לציין סכום תקין' },
        { status: 400 }
      );
    }

    if (!body.recipientEmail || !body.recipientName) {
      return NextResponse.json(
        { error: 'יש להזין שם ואימייל של הנמען' },
        { status: 400 }
      );
    }

    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json(
        { error: 'החנות לא נמצאה' },
        { status: 404 }
      );
    }

    // Get gift card settings
    const settings = await getGiftCardSettings(store.id);

    if (!settings.enabled) {
      return NextResponse.json(
        { error: 'רכישת גיפט קארד לא זמינה בחנות זו' },
        { status: 400 }
      );
    }

    // Validate amount
    const isPresetAmount = settings.amounts.includes(body.amount);
    const isCustomAmount = settings.allowCustomAmount && 
      body.amount >= settings.minAmount && 
      body.amount <= settings.maxAmount;

    if (!isPresetAmount && !isCustomAmount) {
      return NextResponse.json(
        { error: `סכום לא תקין. טווח מותר: ₪${settings.minAmount} - ₪${settings.maxAmount}` },
        { status: 400 }
      );
    }

    // Get payment provider
    const provider = await getDefaultProvider(store.id);

    if (!provider) {
      return NextResponse.json(
        { error: 'לא הוגדר ספק תשלומים בחנות' },
        { status: 400 }
      );
    }

    // Generate unique reference
    const orderReference = `GC-${nanoid(10)}`;

    // Build URLs
    const platformUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!platformUrl) {
      return NextResponse.json(
        { error: 'Configuration error - missing platform URL' },
        { status: 500 }
      );
    }

    const successUrl = `${platformUrl}/shops/${slug}/gift-card/thank-you?ref=${orderReference}`;
    const failureUrl = `${platformUrl}/shops/${slug}/gift-card?error=payment_failed`;
    const callbackUrl = `${platformUrl}/api/shops/${slug}/gift-cards/callback`;

    // Calculate expiry date
    const expiresAt = settings.defaultExpiryMonths 
      ? new Date(Date.now() + settings.defaultExpiryMonths * 30 * 24 * 60 * 60 * 1000)
      : null;

    // Create pending payment record with gift card data
    // Note: providerRequestId will be updated after payment initiation
    const pendingPaymentData = {
      storeId: store.id,
      provider: provider.providerType,
      providerRequestId: orderReference, // Temporary, will be updated
      amount: body.amount.toString(),
      currency: store.currency || 'ILS',
      customerEmail: body.recipientEmail,
      orderData: {
        type: 'gift_card',
        metadata: {
          type: 'gift_card',
          recipientName: body.recipientName,
          recipientEmail: body.recipientEmail,
          senderName: body.senderName || null,
          message: body.message || null,
          cardImage: settings.cardImage,
          expiresAt: expiresAt?.toISOString() || null,
          storeName: store.name,
        },
      },
      cartItems: [{
        name: `גיפט קארד ₪${body.amount}`,
        quantity: 1,
        price: body.amount,
      }],
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    };
    
    await db.insert(pendingPayments).values(pendingPaymentData);

    // Initiate payment
    const paymentResponse = await provider.initiatePayment({
      storeId: store.id,
      storeSlug: slug,
      amount: body.amount,
      currency: store.currency || 'ILS',
      orderReference,
      successUrl,
      failureUrl,
      customer: {
        name: body.senderName || body.recipientName,
        email: body.recipientEmail,
        phone: '',
      },
      items: [{
        name: `גיפט קארד ₪${body.amount}`,
        sku: 'GIFT-CARD',
        quantity: 1,
        price: body.amount,
      }],
      orderData: {
        type: 'gift_card',
        recipientEmail: body.recipientEmail,
        recipientName: body.recipientName,
      },
    });

    if (!paymentResponse.success || !paymentResponse.paymentUrl) {
      return NextResponse.json(
        { error: paymentResponse.errorMessage || 'שגיאה ביצירת עמוד תשלום' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResponse.paymentUrl,
      orderReference,
    });

  } catch (error) {
    console.error('[Gift Card Purchase] Error:', error);
    return NextResponse.json(
      { error: 'אירעה שגיאה בתהליך הרכישה' },
      { status: 500 }
    );
  }
}

