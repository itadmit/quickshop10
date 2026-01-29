/**
 * Cron Job: Subscription Renewal
 * 
 * Runs daily via QStash
 * Renews subscriptions that are due
 * 
 * URL: /api/cron/billing/subscription-renewal
 * Schedule: Daily at 02:00 AM
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/qstash';
import { getStoresDueForRenewal, renewSubscription } from '@/lib/billing/billing-service';

export async function POST(request: NextRequest) {
  // Verify QStash signature
  const authError = await verifyQStashSignature(request);
  if (authError) return authError;

  try {
    console.log('[Cron] Starting subscription renewal check...');
    
    // Get stores due for renewal
    const storeIds = await getStoresDueForRenewal();
    console.log(`[Cron] Found ${storeIds.length} stores due for renewal`);

    const results: {
      storeId: string;
      success: boolean;
      invoiceNumber?: string;
      error?: string;
    }[] = [];

    for (const storeId of storeIds) {
      try {
        const result = await renewSubscription(storeId);
        results.push({
          storeId,
          success: result.success,
          invoiceNumber: result.invoiceNumber,
          error: result.error,
        });
        
        if (result.success) {
          console.log(`[Cron] Renewed subscription for store ${storeId}`);
        } else {
          console.error(`[Cron] Failed to renew store ${storeId}:`, result.error);
        }
      } catch (error) {
        console.error(`[Cron] Error renewing store ${storeId}:`, error);
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
      summary: {
        checked: storeIds.length,
        renewed: successCount,
        failed: failureCount,
      },
      results,
    });
  } catch (error) {
    console.error('[Cron] Subscription renewal failed:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription renewals' },
      { status: 500 }
    );
  }
}

export const GET = POST;









