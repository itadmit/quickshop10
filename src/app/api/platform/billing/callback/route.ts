/**
 * PayPlus Billing Callback
 * POST /api/platform/billing/callback
 * 
 * מקבל callback מ-PayPlus אחרי תשלום מנוי
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPayPlusCallback } from '@/lib/billing/payplus-billing';
import { activateSubscription, createSubscriptionInvoice, chargeTrialPeriodFees } from '@/lib/billing/billing-service';
import { db } from '@/lib/db';
import { storeSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface PayPlusCallbackBody {
  transaction_uid?: string;
  transaction_number?: string;
  status_code?: string;
  page_request_uid?: string;
  more_info?: string; // תיאור בעברית
  more_info_1?: string; // JSON עם נתונים טכניים
  customer_uid?: string;
  token_uid?: string;
  four_digits?: string;
  brand_name?: string;
  expiry_month?: string;
  expiry_year?: string;
  amount?: number;
  invoice_number?: string;
  invoice_link?: string;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('hash') || '';
    const userAgent = request.headers.get('user-agent') || '';

    // Verify callback is from PayPlus (skip in dev)
    if (process.env.NODE_ENV !== 'development') {
      if (userAgent !== 'PayPlus') {
        console.error('[Billing Callback] Invalid user-agent:', userAgent);
        return NextResponse.json({ error: 'Invalid request' }, { status: 401 });
      }

      if (!verifyPayPlusCallback(rawBody, signature)) {
        console.error('[Billing Callback] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const body: PayPlusCallbackBody = JSON.parse(rawBody);
    console.log('[Billing Callback] Received:', {
      status_code: body.status_code,
      transaction_uid: body.transaction_uid,
      more_info: body.more_info, // תיאור בעברית
      more_info_1: body.more_info_1, // JSON עם נתונים טכניים
    });

    // Parse more_info_1 (JSON) to get store and plan details
    // more_info contains Hebrew description, more_info_1 contains JSON data
    let paymentData: {
      type: string;
      storeId: string;
      plan: 'branding' | 'quickshop';
      amount: number;
      basePrice: number;
      vatAmount: number;
    };

    try {
      // Try more_info_1 first (new format), fallback to more_info (old format for backward compatibility)
      const jsonData = body.more_info_1 || body.more_info || '{}';
      paymentData = JSON.parse(jsonData);
    } catch {
      console.error('[Billing Callback] Invalid more_info format:', {
        more_info: body.more_info,
        more_info_1: body.more_info_1,
      });
      return NextResponse.json({ error: 'Invalid payment data' }, { status: 400 });
    }

    // Verify this is a subscription payment
    if (paymentData.type !== 'subscription') {
      console.error('[Billing Callback] Unknown payment type:', paymentData.type);
      return NextResponse.json({ error: 'Unknown payment type' }, { status: 400 });
    }

    // Check if payment was successful
    const isSuccess = body.status_code === '000' || body.status_code === '0';

    if (!isSuccess) {
      console.log('[Billing Callback] Payment failed:', body.status_code);
      return NextResponse.json({ 
        success: false, 
        message: 'Payment was not successful' 
      });
    }

    // Validate required fields for successful payment
    if (!body.customer_uid || !body.token_uid) {
      console.error('[Billing Callback] Missing customer_uid or token_uid');
      return NextResponse.json({ error: 'Missing payment token' }, { status: 400 });
    }

    // Activate subscription
    await activateSubscription(
      paymentData.storeId,
      paymentData.plan,
      body.customer_uid,
      body.token_uid,
      body.four_digits || '',
      body.brand_name || '',
      `${body.expiry_month}/${body.expiry_year}`
    );

    // Create invoice record for subscription
    await createSubscriptionInvoice(
      paymentData.storeId,
      paymentData.plan,
      body.transaction_uid || '',
      body.invoice_number || null,
      body.invoice_link || null
    );

    // Charge trial period transaction fees (if any sales during trial)
    const trialFeesResult = await chargeTrialPeriodFees(
      paymentData.storeId,
      body.token_uid,
      body.customer_uid
    );

    console.log('[Billing Callback] Subscription activated:', {
      storeId: paymentData.storeId,
      plan: paymentData.plan,
      tokenUid: body.token_uid?.substring(0, 8) + '...',
      trialFeesCharged: trialFeesResult.amount || 0,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription activated' 
    });
  } catch (error) {
    console.error('[Billing Callback] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process callback' },
      { status: 500 }
    );
  }
}

// Also handle GET for testing
export async function GET() {
  return NextResponse.json({ message: 'Billing callback endpoint active' });
}


