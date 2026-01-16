import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { storeSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    // Only platform admin can set custom pricing
    if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
      return NextResponse.json(
        { error: 'אין הרשאה' },
        { status: 403 }
      );
    }

    const { id: storeId } = await params;
    const body = await req.json();
    const { customPrice, customFeePercentage } = body;

    // Validate customPrice
    if (customPrice !== null && customPrice !== undefined) {
      const price = parseFloat(customPrice);
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { error: 'מחיר לא תקין' },
          { status: 400 }
        );
      }
    }

    // Validate customFeePercentage
    if (customFeePercentage !== null && customFeePercentage !== undefined) {
      const fee = parseFloat(customFeePercentage);
      if (isNaN(fee) || fee < 0 || fee > 1) {
        return NextResponse.json(
          { error: 'עמלה לא תקינה (צריכה להיות בין 0 ל-1)' },
          { status: 400 }
        );
      }
    }

    // Update or create subscription with custom price
    const [existing] = await db
      .select()
      .from(storeSubscriptions)
      .where(eq(storeSubscriptions.storeId, storeId))
      .limit(1);

    if (existing) {
      // Update existing subscription
      await db
        .update(storeSubscriptions)
        .set({
          customMonthlyPrice: customPrice !== null && customPrice !== undefined 
            ? customPrice.toString() 
            : null,
          customFeePercentage: customFeePercentage !== null && customFeePercentage !== undefined 
            ? customFeePercentage.toString() 
            : null,
          updatedAt: new Date(),
        })
        .where(eq(storeSubscriptions.storeId, storeId));
    } else {
      // Create new subscription with custom price
      await db.insert(storeSubscriptions).values({
        storeId,
        customMonthlyPrice: customPrice !== null && customPrice !== undefined 
          ? customPrice.toString() 
          : null,
        customFeePercentage: customFeePercentage !== null && customFeePercentage !== undefined 
          ? customFeePercentage.toString() 
          : null,
        plan: 'trial',
        status: 'trial',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'ההגדרות עודכנו בהצלחה' 
    });
  } catch (error) {
    console.error('Error updating custom pricing:', error);
    return NextResponse.json(
      { error: 'שגיאה בעדכון ההגדרות' },
      { status: 500 }
    );
  }
}
