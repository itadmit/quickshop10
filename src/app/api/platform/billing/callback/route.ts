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
import { storeSubscriptions, stores, platformInvoices, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';

// Super Admin email for notifications
const SUPER_ADMIN_EMAIL = 'quickshop.israel@gmail.com';

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
    // PayPlus returns invoice in nested format: body.invoice.docu_number, body.invoice.original_url
    // Or flat format: body.invoice_number, body.invoice_link
    const invoiceData = (body as { invoice?: { docu_number?: string; original_url?: string; copy_url?: string } }).invoice;
    let invoiceNumber = invoiceData?.docu_number || body.invoice_number || null;
    let invoiceUrl = invoiceData?.original_url || invoiceData?.copy_url || body.invoice_link || null;
    
    console.log('[Billing Callback] Invoice from callback:', { invoiceNumber, invoiceUrl });
    
    try {
      await createSubscriptionInvoice(
        paymentData.storeId,
        paymentData.plan,
        transactionUid || '',
        invoiceNumber,
        invoiceUrl
      );
      console.log('[Billing Callback] Invoice record created successfully:', invoiceNumber);
    } catch (error) {
      console.error('[Billing Callback] Error creating invoice record:', error);
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

    // 📧 Send notification email to Super Admin
    try {
      // Get store details for the email
      const storeDetails = await db
        .select({
          name: stores.name,
          slug: stores.slug,
          ownerId: stores.ownerId,
        })
        .from(stores)
        .where(eq(stores.id, paymentData.storeId))
        .limit(1);
      
      if (storeDetails.length > 0) {
        const store = storeDetails[0];
        
        // Get owner details
        let ownerEmail = '';
        let ownerName = '';
        if (store.ownerId) {
          const ownerDetails = await db
            .select({ email: users.email, name: users.name })
            .from(users)
            .where(eq(users.id, store.ownerId))
            .limit(1);
          
          if (ownerDetails.length > 0) {
            ownerEmail = ownerDetails[0].email || '';
            ownerName = ownerDetails[0].name || '';
          }
        }
        
        const planName = paymentData.plan === 'quickshop' ? 'QuickShop Pro' : 'אתר תדמית';
        const amount = paymentData.amount || 0;
        const now = new Date();
        const dateStr = now.toLocaleDateString('he-IL', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
      <div style="width: 64px; height: 64px; background: white; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 32px;">🎉</span>
      </div>
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">מנוי חדש!</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">לקוח חדש הצטרף ל-QuickShop</p>
    </div>
    
    <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 16px; font-size: 18px; color: #1e293b;">פרטי החנות</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">שם החנות:</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: left;">${store.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">כתובת:</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: left;">
              <a href="https://my-quickshop.com/shops/${store.slug}" style="color: #10b981; text-decoration: none;">my-quickshop.com/shops/${store.slug}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">בעל החנות:</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: left;">${ownerName || '—'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">אימייל:</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: left;">
              <a href="mailto:${ownerEmail}" style="color: #10b981; text-decoration: none;">${ownerEmail || '—'}</a>
            </td>
          </tr>
        </table>
      </div>
      
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 16px; font-size: 18px; color: #92400e;">פרטי התשלום</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #a16207; font-size: 14px;">מסלול:</td>
            <td style="padding: 8px 0; color: #92400e; font-size: 14px; font-weight: 600; text-align: left;">${planName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a16207; font-size: 14px;">סכום:</td>
            <td style="padding: 8px 0; color: #92400e; font-size: 14px; font-weight: 600; text-align: left;">₪${amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a16207; font-size: 14px;">תאריך:</td>
            <td style="padding: 8px 0; color: #92400e; font-size: 14px; text-align: left;">${dateStr}</td>
          </tr>
          ${trialFeesAmount > 0 ? `
          <tr>
            <td style="padding: 8px 0; color: #a16207; font-size: 14px;">עמלות תקופת ניסיון:</td>
            <td style="padding: 8px 0; color: #92400e; font-size: 14px; font-weight: 600; text-align: left;">₪${trialFeesAmount.toLocaleString()}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <div style="text-align: center; padding-top: 16px;">
        <a href="https://my-quickshop.com/admin/stores" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">צפה בכל החנויות</a>
      </div>
    </div>
    
    <div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">QuickShop Platform • התראה אוטומטית</p>
    </div>
  </div>
</body>
</html>
`;
        
        await sendEmail({
          to: SUPER_ADMIN_EMAIL,
          subject: `🎉 מנוי חדש! ${store.name} הצטרף למסלול ${planName}`,
          html: emailHtml,
        });
        
        console.log('[Billing Callback] Admin notification email sent to:', SUPER_ADMIN_EMAIL);
      }
    } catch (emailError) {
      // Don't fail the callback if email fails
      console.error('[Billing Callback] Error sending admin notification email:', emailError);
    }

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


