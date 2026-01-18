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

// PayPlus callback supports both flat and nested formats
interface PayPlusCallbackBody {
  // New nested format
  transaction_type?: string;
  transaction?: {
    uid?: string;
    status_code?: string;
    payment_page_request_uid?: string;
    more_info?: string;
    more_info_1?: string;
    approval_number?: string;
    voucher_number?: string;
    amount?: number;
  };
  data?: {
    customer_uid?: string;
    card_information?: {
      token?: string;
      four_digits?: string;
      expiry_month?: string;
      expiry_year?: string;
      brand_id?: number;
      clearing_id?: number;
    };
  };
  
  // Old flat format (for backward compatibility)
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
  console.log('[Billing Callback] ========== CALLBACK RECEIVED ==========');
  console.log('[Billing Callback] Timestamp:', new Date().toISOString());
  
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('hash') || '';
    const userAgent = request.headers.get('user-agent') || '';

    console.log('[Billing Callback] Request headers:', {
      'user-agent': userAgent,
      'hash': signature ? signature.substring(0, 20) + '...' : 'none',
      'content-type': request.headers.get('content-type'),
    });

    // Verify callback is from PayPlus (skip in dev)
    // In development, allow manual testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment) {
      if (userAgent !== 'PayPlus') {
        console.error('[Billing Callback] Invalid user-agent:', userAgent);
        return NextResponse.json({ error: 'Invalid request' }, { status: 401 });
      }

      if (!verifyPayPlusCallback(rawBody, signature)) {
        console.error('[Billing Callback] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.log('[Billing Callback] Development mode - skipping signature verification');
    }

    const body: PayPlusCallbackBody = JSON.parse(rawBody);
    
    // Log full callback data for debugging
    console.log('[Billing Callback] Full callback data:', JSON.stringify(body, null, 2));
    
    // Extract data from nested or flat format
    const isNestedFormat = !!body.transaction;
    const statusCode = isNestedFormat 
      ? body.transaction?.status_code 
      : body.status_code;
    const transactionUid = isNestedFormat
      ? body.transaction?.uid
      : body.transaction_uid;
    const moreInfo = isNestedFormat
      ? body.transaction?.more_info
      : body.more_info;
    const moreInfo1 = isNestedFormat
      ? body.transaction?.more_info_1
      : body.more_info_1;
    const customerUid = isNestedFormat
      ? body.data?.customer_uid
      : body.customer_uid;
    const tokenUid = isNestedFormat
      ? body.data?.card_information?.token
      : body.token_uid;
    const fourDigits = isNestedFormat
      ? body.data?.card_information?.four_digits
      : body.four_digits;
    const expiryMonth = isNestedFormat
      ? body.data?.card_information?.expiry_month
      : body.expiry_month;
    const expiryYear = isNestedFormat
      ? body.data?.card_information?.expiry_year
      : body.expiry_year;
    const brandName = isNestedFormat
      ? (body.data?.card_information?.brand_id ? `brand_${body.data.card_information.brand_id}` : undefined)
      : body.brand_name;
    
    console.log('[Billing Callback] Extracted data:', {
      format: isNestedFormat ? 'nested' : 'flat',
      status_code: statusCode,
      transaction_uid: transactionUid,
      customer_uid: customerUid,
      token_uid: tokenUid,
      more_info: moreInfo,
      more_info_1: moreInfo1,
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
      // PayPlus callback: more_info_1 contains JSON, more_info contains Hebrew description
      // Try more_info_1 first (new format), then try to parse more_info as JSON (old format)
      let jsonData = moreInfo1;
      
      // If more_info_1 doesn't exist, check if more_info is JSON (starts with {)
      if (!jsonData && moreInfo) {
        const trimmed = moreInfo.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          jsonData = moreInfo; // Old format - more_info contains JSON
        }
      }
      
      if (!jsonData) {
        throw new Error('No JSON data found in more_info_1 or more_info');
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
        more_info: moreInfo,
        more_info_1: moreInfo1,
        more_info_type: typeof moreInfo,
        more_info_length: moreInfo?.length,
        more_info_preview: moreInfo?.substring(0, 100),
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
    const isSuccess = statusCode === '000' || statusCode === '0';

    if (!isSuccess) {
      console.log('[Billing Callback] Payment failed:', statusCode);
      return NextResponse.json({ 
        success: false, 
        message: 'Payment was not successful' 
      });
    }

    // Validate required fields for successful payment
    if (!customerUid || !tokenUid) {
      console.error('[Billing Callback] Missing customer_uid or token_uid:', {
        customer_uid: customerUid,
        token_uid: tokenUid,
        format: isNestedFormat ? 'nested' : 'flat',
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
        customerUid,
        tokenUid,
        fourDigits || '',
        brandName || '',
        `${expiryMonth || ''}/${expiryYear || ''}`
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
        transactionUid || '',
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
        tokenUid,
        customerUid
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
      transactionUid: transactionUid,
      tokenUid: tokenUid?.substring(0, 8) + '...',
      trialFeesCharged: trialFeesAmount,
      format: isNestedFormat ? 'nested' : 'flat',
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription activated' 
    });
  } catch (error) {
    console.error('[Billing Callback] ========== ERROR ==========');
    console.error('[Billing Callback] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    });
    return NextResponse.json(
      { 
        error: 'Failed to process callback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also handle GET for testing and manual callback simulation
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Allow manual testing with query params
  if (searchParams.has('test')) {
    return NextResponse.json({ 
      message: 'Billing callback endpoint active',
      note: 'For testing, use POST with PayPlus callback data',
      testMode: process.env.NODE_ENV === 'development',
    });
  }
  
  return NextResponse.json({ message: 'Billing callback endpoint active' });
}


