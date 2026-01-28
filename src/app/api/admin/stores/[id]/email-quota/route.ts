import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { storeEmailSubscriptions, emailPackages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    // Super admin emails
    const SUPER_ADMINS = ['yogev@tadmit.co.il', 'admin@quickshop.co.il'];
    
    // Only super admins can modify quotas
    if (!session?.user?.email || !SUPER_ADMINS.includes(session.user.email)) {
      console.log('[Email Quota] Unauthorized access attempt:', session?.user?.email);
      return NextResponse.json(
        { error: 'אין הרשאה' },
        { status: 403 }
      );
    }

    const { id: storeId } = await params;
    const { action, amount, packageSlug } = await request.json();

    // Special action: activate package (gift from admin)
    if (action === 'activate') {
      if (!packageSlug) {
        return NextResponse.json(
          { error: 'יש לבחור חבילה' },
          { status: 400 }
        );
      }

      // Get package info
      const [pkg] = await db
        .select()
        .from(emailPackages)
        .where(eq(emailPackages.slug, packageSlug))
        .limit(1);

      if (!pkg) {
        return NextResponse.json(
          { error: 'חבילה לא נמצאה' },
          { status: 404 }
        );
      }

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      // Check if already has subscription
      const existingSub = await db.query.storeEmailSubscriptions.findFirst({
        where: eq(storeEmailSubscriptions.storeId, storeId),
      });

      if (existingSub) {
        // Update existing
        await db
          .update(storeEmailSubscriptions)
          .set({
            packageSlug,
            status: 'active',
            emailsLimit: pkg.monthlyEmails,
            emailsUsedThisPeriod: 0,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            nextBillingDate: periodEnd,
            updatedAt: now,
          })
          .where(eq(storeEmailSubscriptions.id, existingSub.id));
      } else {
        // Create new
        await db.insert(storeEmailSubscriptions).values({
          storeId,
          packageSlug,
          status: 'active',
          emailsLimit: pkg.monthlyEmails,
          emailsUsedThisPeriod: 0,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          nextBillingDate: periodEnd,
        });
      }

      return NextResponse.json({
        success: true,
        message: `חבילת ${pkg.name} הופעלה בהצלחה (מתנה מהמערכת)`,
      });
    }

    // Get current subscription
    const subscription = await db.query.storeEmailSubscriptions.findFirst({
      where: eq(storeEmailSubscriptions.storeId, storeId),
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'לא נמצא מנוי דיוור לחנות זו' },
        { status: 404 }
      );
    }

    let updateData: Partial<typeof storeEmailSubscriptions.$inferInsert> = {
      updatedAt: new Date(),
    };

    switch (action) {
      case 'add':
        // Add emails to the limit
        updateData.emailsLimit = subscription.emailsLimit + amount;
        break;
      
      case 'set':
        // Set a new limit
        updateData.emailsLimit = amount;
        break;
      
      case 'reset':
        // Reset usage to 0
        updateData.emailsUsedThisPeriod = 0;
        break;
      
      case 'delete':
        // Delete subscription completely
        await db
          .delete(storeEmailSubscriptions)
          .where(eq(storeEmailSubscriptions.id, subscription.id));
        
        return NextResponse.json({
          success: true,
          message: 'חבילת הדיוור נמחקה לחלוטין',
        });
      
      default:
        return NextResponse.json(
          { error: 'פעולה לא חוקית' },
          { status: 400 }
        );
    }

    await db
      .update(storeEmailSubscriptions)
      .set(updateData)
      .where(eq(storeEmailSubscriptions.id, subscription.id));

    return NextResponse.json({
      success: true,
      message: action === 'add' 
        ? `נוספו ${amount} מיילים למכסה`
        : action === 'set'
        ? `המכסה הוגדרה ל-${amount}`
        : 'השימוש החודשי אופס',
    });
  } catch (error) {
    console.error('Error updating email quota:', error);
    return NextResponse.json(
      { error: 'שגיאה בעדכון המכסה' },
      { status: 500 }
    );
  }
}

