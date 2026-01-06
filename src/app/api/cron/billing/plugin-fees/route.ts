/**
 * Cron Job: Plugin Fees
 * 
 * Runs monthly via QStash
 * Charges plugin subscription fees
 * 
 * URL: /api/cron/billing/plugin-fees
 * Schedule: Monthly (1st of month)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/qstash';
import { db } from '@/lib/db';
import { storeSubscriptions, storePlugins } from '@/lib/db/schema';
import { eq, and, lte, or, isNull } from 'drizzle-orm';
import { chargePluginFees } from '@/lib/billing/billing-service';

export async function POST(request: NextRequest) {
  // Verify QStash signature
  const authError = await verifyQStashSignature(request);
  if (authError) return authError;

  try {
    console.log('[Cron] Starting plugin fees billing...');
    
    const now = new Date();
    
    // Get stores with active subscriptions that have plugins due for billing
    const storesWithPlugins = await db
      .select({
        storeId: storeSubscriptions.storeId,
      })
      .from(storeSubscriptions)
      .innerJoin(storePlugins, eq(storePlugins.storeId, storeSubscriptions.storeId))
      .where(and(
        eq(storeSubscriptions.status, 'active'),
        eq(storePlugins.isActive, true),
        eq(storePlugins.subscriptionStatus, 'active'),
        or(
          isNull(storePlugins.nextBillingDate),
          lte(storePlugins.nextBillingDate, now)
        )
      ))
      .groupBy(storeSubscriptions.storeId);

    console.log(`[Cron] Found ${storesWithPlugins.length} stores with plugins due for billing`);

    const results: {
      storeId: string;
      success: boolean;
      amount?: number;
      invoiceNumber?: string;
      error?: string;
    }[] = [];

    let totalBilled = 0;
    let totalAmount = 0;

    for (const store of storesWithPlugins) {
      try {
        const result = await chargePluginFees(store.storeId);
        results.push({
          storeId: store.storeId,
          success: result.success,
          amount: result.amount,
          invoiceNumber: result.invoiceNumber,
          error: result.error,
        });
        
        if (result.success && result.amount && result.amount > 0) {
          totalBilled++;
          totalAmount += result.amount;
          console.log(`[Cron] Charged ₪${result.amount.toFixed(2)} plugin fees for store ${store.storeId}`);
        }
      } catch (error) {
        console.error(`[Cron] Error charging plugin fees for store ${store.storeId}:`, error);
        results.push({
          storeId: store.storeId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        storesChecked: storesWithPlugins.length,
        storesBilled: totalBilled,
        totalAmount: totalAmount.toFixed(2),
        failed: failureCount,
      },
      results,
    });
  } catch (error) {
    console.error('[Cron] Plugin fees billing failed:', error);
    return NextResponse.json(
      { error: 'Failed to process plugin fees' },
      { status: 500 }
    );
  }
}

export const GET = POST;

