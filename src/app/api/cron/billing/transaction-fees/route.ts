/**
 * Cron Job: Transaction Fees
 * 
 * Runs on 1st and 15th of each month via QStash
 * Charges 0.5% transaction fees on paid orders
 * 
 * Logic (Hybrid approach):
 * - Runs on fixed dates (1st and 15th)
 * - For each store, calculates period from last billing end date to now
 * - This ensures no gaps and no double-charging
 * 
 * URL: /api/cron/billing/transaction-fees
 * Schedule: 1st and 15th of month at 03:00
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/qstash';
import { 
  getStoresDueForTransactionFees, 
  chargeTransactionFees 
} from '@/lib/billing/billing-service';

export async function POST(request: NextRequest) {
  // Verify QStash signature
  const authError = await verifyQStashSignature(request);
  if (authError) return authError;

  try {
    console.log('[Cron] Starting transaction fees billing...');
    
    // Current billing date (now)
    const billingDate = new Date();
    
    // Get all active stores with their last billing info
    const stores = await getStoresDueForTransactionFees();
    console.log(`[Cron] Found ${stores.length} active stores to process`);

    const results: {
      storeId: string;
      success: boolean;
      amount?: number;
      invoiceNumber?: string;
      periodStart?: string;
      periodEnd?: string;
      error?: string;
    }[] = [];

    let totalBilled = 0;
    let totalAmount = 0;

    for (const store of stores) {
      try {
        // Calculate period for this store:
        // - Start: last billing end date, or subscription activation date
        // - End: current billing date
        const periodStart = store.lastPeriodEnd || new Date(billingDate.getTime() - 14 * 24 * 60 * 60 * 1000); // fallback: 14 days ago
        const periodEnd = billingDate;
        
        // Skip if period is too short (less than 1 day) - prevents accidental double-billing
        const periodDays = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
        if (periodDays < 1) {
          console.log(`[Cron] Skipping store ${store.storeId} - period too short (${periodDays.toFixed(1)} days)`);
          results.push({
            storeId: store.storeId,
            success: true,
            amount: 0,
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
            error: `Period too short: ${periodDays.toFixed(1)} days`,
          });
          continue;
        }
        
        console.log(`[Cron] Processing store ${store.storeId}: ${periodStart.toISOString()} to ${periodEnd.toISOString()} (${periodDays.toFixed(1)} days)`);
        
        const result = await chargeTransactionFees(store.storeId, periodStart, periodEnd);
        results.push({
          storeId: store.storeId,
          success: result.success,
          amount: result.amount,
          invoiceNumber: result.invoiceNumber,
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          error: result.error,
        });
        
        if (result.success && result.amount && result.amount > 0) {
          totalBilled++;
          totalAmount += result.amount;
          console.log(`[Cron] Charged ₪${result.amount.toFixed(2)} fees for store ${store.storeId}`);
        }
      } catch (error) {
        console.error(`[Cron] Error charging fees for store ${store.storeId}:`, error);
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
      timestamp: billingDate.toISOString(),
      summary: {
        storesChecked: stores.length,
        storesBilled: totalBilled,
        totalAmount: totalAmount.toFixed(2),
        failed: failureCount,
      },
      results,
    });
  } catch (error) {
    console.error('[Cron] Transaction fees billing failed:', error);
    return NextResponse.json(
      { error: 'Failed to process transaction fees' },
      { status: 500 }
    );
  }
}

export const GET = POST;










