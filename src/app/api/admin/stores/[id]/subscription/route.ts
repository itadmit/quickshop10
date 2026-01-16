/**
 * Admin Subscription Management API
 * 
 * Actions:
 * - extend_trial: Extend trial period by X days
 * - change_status: Change subscription status (with billing type)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storeSubscriptions, stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  // Only platform admin
  if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: storeId } = await params;
  const body = await request.json();
  const { action } = body;

  // Verify store exists
  const store = await db.query.stores.findFirst({
    where: eq(stores.id, storeId),
  });

  if (!store) {
    return NextResponse.json({ error: 'החנות לא נמצאה' }, { status: 404 });
  }

  // Get subscription (don't auto-create - let actions handle it)
  let subscription = await db.query.storeSubscriptions.findFirst({
    where: eq(storeSubscriptions.storeId, storeId),
  });

  try {
    switch (action) {
      case 'create_trial': {
        const { days } = body;
        const trialDays = days || 7; // Default 7 days trial
        const trialEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

        // Check if subscription already exists
        if (subscription) {
          return NextResponse.json({ error: 'כבר קיים מנוי לחנות זו' }, { status: 400 });
        }

        const [newSub] = await db.insert(storeSubscriptions).values({
          storeId,
          plan: 'trial',
          status: 'trial',
          trialEndsAt: trialEnd,
        }).returning();

        console.log(`[Subscription] Created trial for store ${storeId}: ${trialDays} days until ${trialEnd.toISOString()}`);

        return NextResponse.json({ 
          success: true, 
          message: `נוצר מנוי נסיון ל-${trialDays} ימים`,
          trialEndsAt: trialEnd.toISOString(),
          subscription: newSub,
        });
      }

      case 'extend_trial': {
        if (!subscription) {
          return NextResponse.json({ error: 'אין מנוי לחנות זו' }, { status: 400 });
        }
        
        const { days } = body;
        if (!days || days < 1) {
          return NextResponse.json({ error: 'מספר ימים לא תקין' }, { status: 400 });
        }

        // Calculate new trial end date
        const currentEnd = subscription.trialEndsAt || new Date();
        const baseDate = new Date(currentEnd) < new Date() ? new Date() : new Date(currentEnd);
        const newTrialEnd = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

        await db.update(storeSubscriptions)
          .set({
            trialEndsAt: newTrialEnd,
            status: 'trial', // Reset to trial if was expired
            updatedAt: new Date(),
          })
          .where(eq(storeSubscriptions.id, subscription.id));

        console.log(`[Subscription] Trial extended for store ${storeId}: +${days} days until ${newTrialEnd.toISOString()}`);

        return NextResponse.json({ 
          success: true, 
          message: `הנסיון הוארך ב-${days} ימים`,
          newTrialEnd: newTrialEnd.toISOString(),
        });
      }

      case 'set_trial_date': {
        if (!subscription) {
          return NextResponse.json({ error: 'אין מנוי לחנות זו' }, { status: 400 });
        }
        
        const { date } = body;
        if (!date) {
          return NextResponse.json({ error: 'תאריך לא תקין' }, { status: 400 });
        }

        const newTrialEnd = new Date(date);
        
        await db.update(storeSubscriptions)
          .set({
            trialEndsAt: newTrialEnd,
            status: 'trial',
            updatedAt: new Date(),
          })
          .where(eq(storeSubscriptions.id, subscription.id));

        console.log(`[Subscription] Trial date set for store ${storeId}: ${newTrialEnd.toISOString()}`);

        return NextResponse.json({ 
          success: true, 
          message: `תאריך הנסיון עודכן`,
          newTrialEnd: newTrialEnd.toISOString(),
        });
      }

      case 'change_status': {
        const { status } = body;
        
        if (!subscription) {
          return NextResponse.json({ error: 'אין מנוי לחנות זו' }, { status: 400 });
        }
        
        const validStatuses = ['trial', 'active', 'expired', 'cancelled', 'past_due'];
        if (!validStatuses.includes(status)) {
          return NextResponse.json({ error: 'סטטוס לא תקין' }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {
          status,
          updatedAt: new Date(),
        };

        // If changing to active, set period dates
        if (status === 'active' && subscription.status !== 'active') {
          updateData.currentPeriodStart = new Date();
          updateData.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }

        await db.update(storeSubscriptions)
          .set(updateData)
          .where(eq(storeSubscriptions.id, subscription.id));

        console.log(`[Subscription] Status changed for store ${storeId}: ${subscription.status} -> ${status}`);

        return NextResponse.json({ 
          success: true, 
          message: 'הסטטוס עודכן בהצלחה',
        });
      }

      default:
        return NextResponse.json({ error: 'פעולה לא מוכרת' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Subscription] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'שגיאה בעדכון המנוי' 
    }, { status: 500 });
  }
}

// GET - Get subscription details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: storeId } = await params;

  const subscription = await db.query.storeSubscriptions.findFirst({
    where: eq(storeSubscriptions.storeId, storeId),
  });

  if (!subscription) {
    return NextResponse.json({ subscription: null });
  }

  return NextResponse.json({
    subscription: {
      ...subscription,
      hasPaymentMethod: !!subscription.payplusTokenUid,
      billingType: 'automatic', // Default billing type
    },
  });
}

