/**
 * Newsletter Subscription API
 * POST /api/shops/[slug]/newsletter/subscribe
 * 
 * Adds email to contacts table with type='newsletter'
 * If email already exists, returns appropriate message
 * 
 * PERFORMANCE: Single DB query with upsert logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts, stores } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { email, firstName, source } = await request.json();
    
    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'כתובת אימייל לא תקינה' },
        { status: 400 }
      );
    }
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Get store
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);
    
    if (!store) {
      return NextResponse.json(
        { success: false, error: 'חנות לא נמצאה' },
        { status: 404 }
      );
    }
    
    // Check if email already exists for this store
    const [existingContact] = await db
      .select({ id: contacts.id, status: contacts.status })
      .from(contacts)
      .where(
        and(
          eq(contacts.storeId, store.id),
          eq(contacts.email, normalizedEmail),
          eq(contacts.type, 'newsletter')
        )
      )
      .limit(1);
    
    if (existingContact) {
      // Email already subscribed
      if (existingContact.status === 'active') {
        return NextResponse.json({ 
          success: true, 
          message: 'כבר נרשמת לניוזלטר שלנו!',
          alreadySubscribed: true,
        });
      } else {
        // Reactivate unsubscribed contact
        await db
          .update(contacts)
          .set({ 
            status: 'active',
            updatedAt: new Date(),
          })
          .where(eq(contacts.id, existingContact.id));
        
        return NextResponse.json({ 
          success: true, 
          message: 'ברוכים הבאים בחזרה! נרשמת מחדש לניוזלטר.',
          reactivated: true,
        });
      }
    }
    
    // Create new newsletter subscription
    await db.insert(contacts).values({
      storeId: store.id,
      email: normalizedEmail,
      firstName: firstName || null,
      type: 'newsletter',
      status: 'active',
      source: source || 'footer_newsletter',
      sourceUrl: request.headers.get('referer') || null,
      metadata: {},
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'תודה! נרשמת בהצלחה לניוזלטר.',
      newSubscription: true,
    });
    
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בהרשמה, נסה שוב' },
      { status: 500 }
    );
  }
}





