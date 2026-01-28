/**
 * Email Packages Billing CRON
 * POST /api/cron/billing/email-packages
 * 
 * Runs monthly (1st of each month) to:
 * 1. Charge all active email package subscriptions
 * 2. Reset email usage counters
 * 3. Extend subscription periods
 * 
 * Schedule: 0 5 1 * * (1st of month at 05:00)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storeEmailSubscriptions, stores } from '@/lib/db/schema';
import { eq, lte, and } from 'drizzle-orm';
import { chargeEmailPackage } from '@/lib/email-packages';

// Verify QStash signature for cron security
async function verifyQStashSignature(request: NextRequest): Promise<boolean> {
  const signature = request.headers.get('upstash-signature');
  
  // In development, skip verification
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // In production, verify signature
  if (!signature) {
    return false;
  }

  // Add actual QStash signature verification here
  // For now, accept if signature exists
  return true;
}

export async function POST(request: NextRequest) {
  // Verify cron authorization
  const isValid = await verifyQStashSignature(request);
  if (!isValid) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const results = {
    processed: 0,
    charged: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
    invoices: [] as string[],
  };

  try {
    // Get all subscriptions that need to be charged
    const now = new Date();
    const subscriptionsToCharge = await db
      .select({
        id: storeEmailSubscriptions.id,
        storeId: storeEmailSubscriptions.storeId,
        packageSlug: storeEmailSubscriptions.packageSlug,
        status: storeEmailSubscriptions.status,
        nextBillingDate: storeEmailSubscriptions.nextBillingDate,
      })
      .from(storeEmailSubscriptions)
      .where(and(
        eq(storeEmailSubscriptions.status, 'active'),
        lte(storeEmailSubscriptions.nextBillingDate, now)
      ));

    console.log(`[Email Packages CRON] Found ${subscriptionsToCharge.length} subscriptions to process`);

    for (const subscription of subscriptionsToCharge) {
      results.processed++;

      try {
        // Get store info for logging
        const [store] = await db
          .select({ slug: stores.slug })
          .from(stores)
          .where(eq(stores.id, subscription.storeId))
          .limit(1);

        const storeSlug = store?.slug || subscription.storeId;

        console.log(`[Email Packages CRON] Processing store: ${storeSlug}, package: ${subscription.packageSlug}`);

        // Charge the subscription
        const chargeResult = await chargeEmailPackage(subscription.storeId);

        if (chargeResult.success) {
          results.charged++;
          if (chargeResult.invoiceNumber) {
            results.invoices.push(chargeResult.invoiceNumber);
          }
          console.log(`[Email Packages CRON] ✓ Charged ${storeSlug}: ${chargeResult.invoiceNumber} (₪${chargeResult.amount})`);
        } else {
          results.failed++;
          results.errors.push(`${storeSlug}: ${chargeResult.error}`);
          console.error(`[Email Packages CRON] ✗ Failed ${storeSlug}: ${chargeResult.error}`);
        }

      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`${subscription.storeId}: ${errorMessage}`);
        console.error(`[Email Packages CRON] Error processing ${subscription.storeId}:`, error);
      }
    }

    console.log(`[Email Packages CRON] Completed: ${results.charged} charged, ${results.failed} failed, ${results.skipped} skipped`);

    return NextResponse.json({
      success: true,
      ...results,
    });

  } catch (error) {
    console.error('[Email Packages CRON] Fatal error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        ...results,
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing (with admin auth)
export async function GET(request: NextRequest) {
  // In production, require admin authentication
  const authHeader = request.headers.get('authorization');
  
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Run the same logic as POST
  return POST(request);
}

