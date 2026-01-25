/**
 * Cron Job: Transaction Fees
 * 
 * Runs every 2 weeks via QStash
 * Charges 0.5% transaction fees on paid orders
 * 
 * URL: /api/cron/billing/transaction-fees
 * Schedule: Every 2 weeks (1st and 15th of month)
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
    
    // Calculate period (last 2 weeks)
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd);
    periodStart.setDate(periodStart.getDate() - 14);
    
    // Get stores due for transaction fee billing
    const storeIds = await getStoresDueForTransactionFees();
    console.log(`[Cron] Found ${storeIds.length} stores due for transaction fee billing`);

    const results: {
      storeId: string;
      success: boolean;
      amount?: number;
      invoiceNumber?: string;
      error?: string;
    }[] = [];

    let totalBilled = 0;
    let totalAmount = 0;

    for (const storeId of storeIds) {
      try {
        const result = await chargeTransactionFees(storeId, periodStart, periodEnd);
        results.push({
          storeId,
          success: result.success,
          amount: result.amount,
          invoiceNumber: result.invoiceNumber,
          error: result.error,
        });
        
        if (result.success && result.amount && result.amount > 0) {
          totalBilled++;
          totalAmount += result.amount;
          console.log(`[Cron] Charged ₪${result.amount.toFixed(2)} fees for store ${storeId}`);
        }
      } catch (error) {
        console.error(`[Cron] Error charging fees for store ${storeId}:`, error);
        results.push({
          storeId,
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
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      summary: {
        storesChecked: storeIds.length,
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





