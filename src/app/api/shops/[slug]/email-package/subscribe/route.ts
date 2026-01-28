/**
 * Email Package Subscribe API
 * POST /api/shops/[slug]/email-package/subscribe
 * 
 * Initiates purchase of an email package
 * Either redirects to PayPlus payment or activates immediately if store has saved payment method
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, storeSubscriptions, emailPackages, storeEmailSubscriptions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getEmailPackage, subscribeToEmailPackage } from '@/lib/email-packages';
import { chargeWithToken } from '@/lib/billing/payplus-billing';
import { platformInvoices, platformInvoiceItems } from '@/lib/db/schema';

const VAT_RATE = 0.18;

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `EM-${year}${month}-${random}`;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const { packageSlug } = await request.json();

    if (!packageSlug) {
      return NextResponse.json(
        { success: false, error: 'Package slug is required' },
        { status: 400 }
      );
    }

    // Get store
    const [store] = await db
      .select({ id: stores.id, name: stores.name })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }

    // Get package info
    const pkg = await getEmailPackage(packageSlug);
    if (!pkg) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }

    // Get store subscription (for payment token)
    const [storeSub] = await db
      .select()
      .from(storeSubscriptions)
      .where(eq(storeSubscriptions.storeId, store.id))
      .limit(1);

    // Check if store has a saved payment method
    if (!storeSub?.payplusTokenUid || !storeSub?.payplusCustomerUid) {
      // No saved payment method - redirect to payment page
      // For now, return error - in production, would redirect to PayPlus
      return NextResponse.json(
        { 
          success: false, 
          error: 'אין אמצעי תשלום שמור. יש להוסיף אמצעי תשלום בהגדרות החיוב תחילה.',
          requiresPayment: true,
        },
        { status: 400 }
      );
    }

    // Check if already has this package
    const [existingSub] = await db
      .select()
      .from(storeEmailSubscriptions)
      .where(eq(storeEmailSubscriptions.storeId, store.id))
      .limit(1);

    if (existingSub?.packageSlug === packageSlug && existingSub.status === 'active') {
      return NextResponse.json(
        { success: false, error: 'כבר יש לך חבילה זו פעילה' },
        { status: 400 }
      );
    }

    // Calculate amounts
    const subtotal = pkg.monthlyPrice;
    const vatAmount = Math.round(subtotal * VAT_RATE * 100) / 100;
    const totalAmount = subtotal + vatAmount;

    // Charge with token
    const chargeResult = await chargeWithToken({
      tokenUid: storeSub.payplusTokenUid,
      customerUid: storeSub.payplusCustomerUid,
      amount: totalAmount,
      description: `חבילת דיוור - ${pkg.name}`,
      invoiceItems: [{
        name: `חבילת דיוור: ${pkg.name} (${pkg.monthlyEmails} מיילים)`,
        quantity: 1,
        price: subtotal,
      }],
    });

    if (!chargeResult.success) {
      return NextResponse.json(
        { success: false, error: chargeResult.error || 'שגיאה בחיוב' },
        { status: 400 }
      );
    }

    // Create invoice
    const invoiceNumber = await generateInvoiceNumber();
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const [invoice] = await db
      .insert(platformInvoices)
      .values({
        storeId: store.id,
        subscriptionId: storeSub.id,
        invoiceNumber,
        type: 'email_package',
        status: 'paid',
        subtotal: String(subtotal),
        vatRate: String(VAT_RATE * 100),
        vatAmount: String(vatAmount),
        totalAmount: String(totalAmount),
        periodStart: now,
        periodEnd,
        description: `חבילת דיוור - ${pkg.name}`,
        payplusTransactionUid: chargeResult.transactionUid,
        payplusInvoiceNumber: chargeResult.invoiceNumber,
        payplusInvoiceUrl: chargeResult.invoiceUrl,
        issuedAt: now,
        paidAt: now,
      })
      .returning();

    // Create invoice item
    await db.insert(platformInvoiceItems).values({
      invoiceId: invoice.id,
      description: `חבילת דיוור: ${pkg.name} (${pkg.monthlyEmails} מיילים)`,
      quantity: 1,
      unitPrice: String(subtotal),
      totalPrice: String(subtotal),
      referenceType: 'email_package',
      referenceId: pkg.slug,
    });

    // Activate subscription
    const result = await subscribeToEmailPackage({
      storeId: store.id,
      packageSlug,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `חבילת ${pkg.name} הופעלה בהצלחה!`,
      invoiceNumber,
    });

  } catch (error) {
    console.error('[Email Package Subscribe] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

