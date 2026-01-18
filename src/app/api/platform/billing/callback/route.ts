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
    
    // Log full callback data for debugging
    console.log('[Billing Callback] Full callback data:', JSON.stringify(body, null, 2));
    console.log('[Billing Callback] Received:', {
      status_code: body.status_code,
      transaction_uid: body.transaction_uid,
      customer_uid: body.customer_uid,
      token_uid: body.token_uid,
      more_info: body.more_info,
      more_info_1: body.more_info_1,
    });

    // Parse more_info_1 (JSON) to get store and plan details
    // more_info contains Hebrew description, more_info_1 contains JSON data
    // PayPlus might return more_info_1 in callback, or might return more_info with JSON (old format)
    let paymentData: {
      type: string;
      storeId: string;
      plan: 'branding' | 'quickshop';
      amount: number;
      basePrice: number;
      vatAmount: number;
    };

    try {
      // PayPlus callback returns more_info with JSON data
      // Try more_info first (primary), then more_info_1 (backup)
      let jsonData = body.more_info || body.more_info_1;
      
      if (!jsonData) {
        throw new Error('No more_info or more_info_1 found in callback');
      }
      
      // Parse JSON
      paymentData = JSON.parse(jsonData);
      console.log('[Billing Callback] Parsed payment data:', paymentData);
      
      // Validate required fields
      if (!paymentData.storeId || !paymentData.plan) {
        throw new Error('Missing storeId or plan in payment data');
      }
    } catch (error) {
      console.error('[Billing Callback] Invalid more_info format:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        more_info: body.more_info,
        more_info_1: body.more_info_1,
        more_info_type: typeof body.more_info,
        more_info_length: body.more_info?.length,
        rawBody_preview: rawBody.substring(0, 1000), // First 1000 chars for debugging
      });
      return NextResponse.json({ 
        error: 'Invalid payment data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 400 });
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
      console.error('[Billing Callback] Missing customer_uid or token_uid:', {
        customer_uid: body.customer_uid,
        token_uid: body.token_uid,
      });
      return NextResponse.json({ error: 'Missing payment token' }, { status: 400 });
    }

    // Check if subscription exists before activating
    const existingSubscription = await db.query.storeSubscriptions.findFirst({
      where: eq(storeSubscriptions.storeId, paymentData.storeId),
    });

    if (!existingSubscription) {
      console.error('[Billing Callback] Subscription not found for store:', paymentData.storeId);
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    console.log('[Billing Callback] Activating subscription:', {
      storeId: paymentData.storeId,
      plan: paymentData.plan,
      currentStatus: existingSubscription.status,
      currentPlan: existingSubscription.plan,
    });

    // Activate subscription
    try {
      await activateSubscription(
        paymentData.storeId,
        paymentData.plan,
        body.customer_uid,
        body.token_uid,
        body.four_digits || '',
        body.brand_name || '',
        `${body.expiry_month}/${body.expiry_year}`
      );
      console.log('[Billing Callback] activateSubscription completed');
      
      // Verify subscription was updated
      const updatedSubscription = await db.query.storeSubscriptions.findFirst({
        where: eq(storeSubscriptions.storeId, paymentData.storeId),
      });
      
      if (!updatedSubscription) {
        throw new Error('Subscription not found after activation');
      }
      
      console.log('[Billing Callback] Subscription verification:', {
        status: updatedSubscription.status,
        plan: updatedSubscription.plan,
        hasToken: !!updatedSubscription.payplusTokenUid,
        periodEnd: updatedSubscription.currentPeriodEnd,
      });
      
      if (updatedSubscription.status !== 'active') {
        throw new Error(`Subscription status is ${updatedSubscription.status}, expected 'active'`);
      }
    } catch (error) {
      console.error('[Billing Callback] Error activating subscription:', error);
      throw error; // Re-throw to be caught by outer catch
    }

    // Create invoice record for subscription
    try {
      await createSubscriptionInvoice(
        paymentData.storeId,
        paymentData.plan,
        body.transaction_uid || '',
        body.invoice_number || null,
        body.invoice_link || null
      );
      console.log('[Billing Callback] Invoice created successfully');
    } catch (error) {
      console.error('[Billing Callback] Error creating invoice:', error);
      // Don't fail the whole callback if invoice creation fails
    }

    // Charge trial period transaction fees (if any sales during trial)
    let trialFeesAmount = 0;
    try {
      const trialFeesResult = await chargeTrialPeriodFees(
        paymentData.storeId,
        body.token_uid,
        body.customer_uid
      );
      trialFeesAmount = trialFeesResult.amount || 0;
      console.log('[Billing Callback] Trial fees charged:', trialFeesResult);
    } catch (error) {
      console.error('[Billing Callback] Error charging trial fees:', error);
      // Don't fail the whole callback if trial fees fail
    }

    console.log('[Billing Callback] Subscription activated successfully:', {
      storeId: paymentData.storeId,
      plan: paymentData.plan,
      transactionUid: body.transaction_uid,
      tokenUid: body.token_uid?.substring(0, 8) + '...',
      trialFeesCharged: trialFeesAmount,
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


