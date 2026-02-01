import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers, customerCreditTransactions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'לא מורשה' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { customerId, storeId, type, amount, reason } = body;

    // Validate
    if (!customerId || !storeId || !type || !amount) {
      return NextResponse.json(
        { success: false, error: 'חסרים נתונים' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'סכום חייב להיות חיובי' },
        { status: 400 }
      );
    }

    // Get current customer balance
    const [customer] = await db
      .select({ creditBalance: customers.creditBalance })
      .from(customers)
      .where(and(
        eq(customers.id, customerId),
        eq(customers.storeId, storeId)
      ))
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'לקוח לא נמצא' },
        { status: 404 }
      );
    }

    const currentBalance = Number(customer.creditBalance) || 0;

    // Calculate new balance
    let newBalance: number;
    let transactionAmount: number;
    let transactionType: 'credit' | 'debit' | 'refund' | 'adjustment';

    if (type === 'credit') {
      newBalance = currentBalance + amount;
      transactionAmount = amount;
      transactionType = 'credit';
    } else if (type === 'debit') {
      if (amount > currentBalance) {
        return NextResponse.json(
          { success: false, error: 'לא ניתן לחייב יותר מהיתרה' },
          { status: 400 }
        );
      }
      newBalance = currentBalance - amount;
      transactionAmount = -amount;
      transactionType = 'debit';
    } else {
      return NextResponse.json(
        { success: false, error: 'סוג פעולה לא תקין' },
        { status: 400 }
      );
    }

    // Update customer balance
    await db
      .update(customers)
      .set({ 
        creditBalance: newBalance.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));

    // Create transaction record
    await db.insert(customerCreditTransactions).values({
      customerId,
      storeId,
      type: transactionType,
      amount: transactionAmount.toFixed(2),
      balanceAfter: newBalance.toFixed(2),
      reason: reason || (type === 'credit' ? 'זיכוי ידני' : 'חיוב ידני'),
      createdById: session.user.id,
    });

    return NextResponse.json({ 
      success: true,
      newBalance,
    });
  } catch (error) {
    console.error('Credit update error:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בעדכון הקרדיט' },
      { status: 500 }
    );
  }
}











