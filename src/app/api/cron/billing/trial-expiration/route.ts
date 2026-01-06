/**
 * Cron Job: Trial Expiration
 * 
 * Runs daily via QStash
 * Checks for expired trials and marks them accordingly
 * 
 * URL: /api/cron/billing/trial-expiration
 * Schedule: Daily at 00:00
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/qstash';
import { getExpiredTrials, expireTrialSubscription } from '@/lib/billing/billing-service';

export async function POST(request: NextRequest) {
  // Verify QStash signature
  const authError = await verifyQStashSignature(request);
  if (authError) return authError;

  try {
    console.log('[Cron] Starting trial expiration check...');
    
    // Get expired trials
    const expiredTrials = await getExpiredTrials();
    console.log(`[Cron] Found ${expiredTrials.length} expired trials`);

    const results: {
      storeId: string;
      storeName: string;
      trialEndsAt: string;
      success: boolean;
      error?: string;
    }[] = [];

    for (const trial of expiredTrials) {
      try {
        await expireTrialSubscription(trial.storeId);
        results.push({
          storeId: trial.storeId,
          storeName: trial.storeName,
          trialEndsAt: trial.trialEndsAt.toISOString(),
          success: true,
        });
        console.log(`[Cron] Expired trial for store: ${trial.storeName}`);
      } catch (error) {
        console.error(`[Cron] Error expiring trial for store ${trial.storeId}:`, error);
        results.push({
          storeId: trial.storeId,
          storeName: trial.storeName,
          trialEndsAt: trial.trialEndsAt.toISOString(),
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
        expired: expiredTrials.length,
        processed: successCount,
        failed: failureCount,
      },
      results,
    });
  } catch (error) {
    console.error('[Cron] Trial expiration check failed:', error);
    return NextResponse.json(
      { error: 'Failed to process trial expirations' },
      { status: 500 }
    );
  }
}

export const GET = POST;

