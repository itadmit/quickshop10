import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts, stores } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/contact/[storeSlug] - Create a new contact
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const body = await request.json();
    
    const { 
      email, 
      firstName, 
      lastName, 
      phone, 
      type = 'newsletter',
      metadata = {},
      source,
      sourceUrl,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get store
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
      columns: { id: true },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }

    // Check if contact already exists
    const existing = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.storeId, store.id),
        eq(contacts.email, email),
        eq(contacts.type, type)
      ),
    });

    if (existing) {
      // Update existing contact
      await db.update(contacts)
        .set({
          firstName: firstName || existing.firstName,
          lastName: lastName || existing.lastName,
          phone: phone || existing.phone,
          metadata: { ...(existing.metadata as Record<string, unknown>), ...metadata },
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, existing.id));

      return NextResponse.json({ success: true, updated: true });
    }

    // Get request info
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Create new contact
    await db.insert(contacts).values({
      storeId: store.id,
      email,
      firstName,
      lastName,
      phone,
      type,
      metadata,
      source,
      sourceUrl,
      ipAddress,
      userAgent,
      utmSource,
      utmMedium,
      utmCampaign,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to create contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}











