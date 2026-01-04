import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { discounts, automaticDiscounts, stores, customers } from '@/lib/db/schema';
import { eq, and, isNull, or, lte, gte } from 'drizzle-orm';
import { 
  calculateDiscounts, 
  dbDiscountToEngine, 
  type CartItem, 
  type Discount 
} from '@/lib/discount-engine';

/**
 * 🎯 API לחישוב הנחות
 * 
 * POST /api/discount/calculate
 * 
 * Request Body:
 * {
 *   storeId: string,
 *   items: CartItem[],
 *   couponCode?: string,
 *   customerEmail?: string,
 *   shippingAmount?: number
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   result?: CalculationResult,
 *   error?: string
 * }
 */

interface RequestBody {
  storeId: string;
  items: CartItem[];
  couponCode?: string;
  customerEmail?: string;
  shippingAmount?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { storeId, items, couponCode, customerEmail, shippingAmount = 0 } = body;

    // Validation
    if (!storeId) {
      return NextResponse.json({ success: false, error: 'חסר מזהה חנות' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'חסרים פריטים בסל' }, { status: 400 });
    }

    // Verify store exists
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
    if (!store) {
      return NextResponse.json({ success: false, error: 'חנות לא נמצאה' }, { status: 404 });
    }

    // Check if customer is a member
    let isMember = false;
    if (customerEmail) {
      const [customer] = await db
        .select()
        .from(customers)
        .where(and(eq(customers.storeId, storeId), eq(customers.email, customerEmail.toLowerCase())))
        .limit(1);
      isMember = !!customer;
    }

    const now = new Date();
    const allDiscounts: Discount[] = [];

    // 1. Get automatic discounts
    const autoDiscounts = await db
      .select()
      .from(automaticDiscounts)
      .where(and(
        eq(automaticDiscounts.storeId, storeId),
        eq(automaticDiscounts.isActive, true),
        or(
          isNull(automaticDiscounts.startsAt),
          lte(automaticDiscounts.startsAt, now)
        ),
        or(
          isNull(automaticDiscounts.endsAt),
          gte(automaticDiscounts.endsAt, now)
        )
      ));

    for (const ad of autoDiscounts) {
      allDiscounts.push(dbDiscountToEngine(ad));
    }

    // 2. Get coupon discount if provided
    if (couponCode) {
      const normalizedCode = couponCode.toUpperCase().trim();
      
      const [coupon] = await db
        .select()
        .from(discounts)
        .where(and(
          eq(discounts.storeId, storeId),
          eq(discounts.code, normalizedCode),
          eq(discounts.isActive, true),
          or(
            isNull(discounts.startsAt),
            lte(discounts.startsAt, now)
          ),
          or(
            isNull(discounts.endsAt),
            gte(discounts.endsAt, now)
          )
        ))
        .limit(1);

      if (coupon) {
        // Check usage limit
        const usageOk = !coupon.usageLimit || !coupon.usageCount || coupon.usageCount < coupon.usageLimit;
        
        if (usageOk) {
          allDiscounts.push(dbDiscountToEngine(coupon));
        }
      }
    }

    // Calculate discounts
    const result = calculateDiscounts(items, allDiscounts, {
      isMember,
      shippingAmount,
    });

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error) {
    console.error('Discount calculation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'שגיאה בחישוב ההנחות' 
    }, { status: 500 });
  }
}

/**
 * GET /api/discount/calculate - תיעוד ה-API
 */
export async function GET() {
  return NextResponse.json({
    name: 'QuickShop Discount Calculator API',
    version: '1.0',
    description: 'API לחישוב הנחות על סל קניות',
    endpoints: {
      POST: {
        description: 'חישוב הנחות',
        body: {
          storeId: 'string (required)',
          items: 'CartItem[] (required)',
          couponCode: 'string (optional)',
          customerEmail: 'string (optional - for member discounts)',
          shippingAmount: 'number (optional - for shipping calculation)',
        },
        response: {
          success: 'boolean',
          result: {
            originalTotal: 'number',
            discountTotal: 'number',
            finalTotal: 'number',
            freeShipping: 'boolean',
            appliedDiscounts: 'DiscountResult[]',
            giftItems: 'CartItem[]',
            errors: 'string[]',
          },
        },
      },
    },
    discountTypes: [
      'percentage - אחוז הנחה',
      'fixed_amount - סכום קבוע',
      'free_shipping - משלוח חינם',
      'buy_x_pay_y - קנה X שלם Y',
      'buy_x_get_y - קנה X קבל Y חינם',
      'quantity_discount - הנחות כמות',
      'spend_x_pay_y - קנה ב-X שלם Y',
    ],
  });
}

