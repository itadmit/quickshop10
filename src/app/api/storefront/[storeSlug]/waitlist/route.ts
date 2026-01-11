import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productWaitlist, products, productVariants, stores } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * POST /api/storefront/[storeSlug]/waitlist
 * הוספת לקוח לרשימת המתנה למוצר שאזל מהמלאי
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const body = await request.json();
    
    const { productId, variantId, email, firstName, phone } = body;
    
    // Validation
    if (!productId || !email) {
      return NextResponse.json(
        { success: false, error: 'חסרים שדות חובה' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'כתובת האימייל אינה תקינה' },
        { status: 400 }
      );
    }
    
    // Get store
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.slug, storeSlug))
      .limit(1);
    
    if (!store) {
      return NextResponse.json(
        { success: false, error: 'החנות לא נמצאה' },
        { status: 404 }
      );
    }
    
    // Verify product exists
    const [product] = await db
      .select({ 
        id: products.id, 
        hasVariants: products.hasVariants,
        inventory: products.inventory,
        trackInventory: products.trackInventory
      })
      .from(products)
      .where(and(
        eq(products.id, productId),
        eq(products.storeId, store.id)
      ))
      .limit(1);
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'המוצר לא נמצא' },
        { status: 404 }
      );
    }
    
    // If has variants, check variant
    if (product.hasVariants && variantId) {
      const [variant] = await db
        .select({ 
          id: productVariants.id,
          inventory: productVariants.inventory
        })
        .from(productVariants)
        .where(and(
          eq(productVariants.id, variantId),
          eq(productVariants.productId, productId)
        ))
        .limit(1);
      
      if (!variant) {
        return NextResponse.json(
          { success: false, error: 'הוריאנט לא נמצא' },
          { status: 404 }
        );
      }
      
      // Check if variant is actually out of stock
      if (variant.inventory && variant.inventory > 0) {
        return NextResponse.json(
          { success: false, error: 'המוצר זמין במלאי' },
          { status: 400 }
        );
      }
    } else {
      // Simple product - check inventory
      if (product.trackInventory && product.inventory && product.inventory > 0) {
        return NextResponse.json(
          { success: false, error: 'המוצר זמין במלאי' },
          { status: 400 }
        );
      }
    }
    
    // Check if already registered (the unique index will prevent duplicates, but we can give a better message)
    const existing = await db
      .select({ id: productWaitlist.id })
      .from(productWaitlist)
      .where(and(
        eq(productWaitlist.storeId, store.id),
        eq(productWaitlist.productId, productId),
        variantId ? eq(productWaitlist.variantId, variantId) : isNull(productWaitlist.variantId),
        eq(productWaitlist.email, email.toLowerCase().trim())
      ))
      .limit(1);
    
    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'כבר נרשמת לרשימת ההמתנה למוצר זה',
        alreadyExists: true
      });
    }
    
    // Insert into waitlist
    await db.insert(productWaitlist).values({
      storeId: store.id,
      productId,
      variantId: variantId || null,
      email: email.toLowerCase().trim(),
      firstName: firstName || null,
      phone: phone || null,
      isNotified: false,
    });
    
    return NextResponse.json({
      success: true,
      message: 'נרשמת בהצלחה לרשימת ההמתנה! נעדכן אותך ברגע שהמוצר יחזור למלאי'
    });
    
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json({
        success: true,
        message: 'כבר נרשמת לרשימת ההמתנה למוצר זה',
        alreadyExists: true
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'שגיאה בהוספה לרשימת ההמתנה' },
      { status: 500 }
    );
  }
}

