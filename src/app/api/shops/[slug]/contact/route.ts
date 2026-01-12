import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, pageSections, contacts } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// Contact form submission handler
// Supports: database storage, email notification (via external service), webhook

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  sectionId?: string;
}

// POST /api/shops/[slug]/contact
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Parse form data (supports both JSON and FormData)
    let formData: ContactFormData;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      formData = await request.json();
    } else {
      const form = await request.formData();
      formData = {
        name: form.get('name') as string,
        email: form.get('email') as string,
        phone: form.get('phone') as string || undefined,
        message: form.get('message') as string,
        sectionId: form.get('sectionId') as string || undefined,
      };
    }

    const { name, email, message, phone, sectionId } = formData;

    // Validation
    if (!name || !email || !message) {
      // For form submissions, redirect back with error
      if (!contentType.includes('application/json')) {
        const referer = request.headers.get('referer') || `/${slug}`;
        return NextResponse.redirect(new URL(`${referer}?error=missing_fields`), 303);
      }
      return NextResponse.json(
        { success: false, error: 'שם, אימייל והודעה הם שדות חובה' },
        { status: 400 }
      );
    }

    // Get store
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, slug),
      columns: { id: true, name: true, settings: true },
    });

    if (!store) {
      if (!contentType.includes('application/json')) {
        return NextResponse.redirect(new URL('/404'), 303);
      }
      return NextResponse.json(
        { success: false, error: 'חנות לא נמצאה' },
        { status: 404 }
      );
    }

    // Get contact section settings if sectionId provided
    let sectionContent: Record<string, unknown> = {};
    
    if (sectionId) {
      // Use raw SQL to avoid enum type mismatch
      const section = await db.execute(
        sql`SELECT content FROM page_sections WHERE id = ${sectionId} AND type = 'contact' LIMIT 1`
      );
      if (section.rows && section.rows.length > 0) {
        sectionContent = (section.rows[0].content as Record<string, unknown>) || {};
      }
    }

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     undefined;
    const userAgent = request.headers.get('user-agent') || undefined;
    const sourceUrl = request.headers.get('referer') || undefined;

    // Parse name into first/last
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(' ') || null;

    // 1. Save to database using contacts table
    const [contact] = await db.insert(contacts).values({
      storeId: store.id,
      email,
      firstName,
      lastName,
      phone: phone || null,
      type: 'contact_form',
      status: 'active',
      metadata: {
        message,
        sectionId: sectionId || null,
      },
      source: 'contact_page',
      sourceUrl: sourceUrl || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    }).returning();

    // 2. Send to webhook (if configured)
    const webhookUrl = sectionContent.webhookUrl as string;
    
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'contact_form_submission',
            store: {
              id: store.id,
              name: store.name,
              slug,
            },
            submission: {
              id: contact.id,
              name,
              email,
              phone: phone || null,
              message,
              createdAt: contact.createdAt,
            },
            metadata: {
              ipAddress,
              userAgent,
              sourceUrl,
            },
          }),
        });
      } catch (webhookError) {
        console.error('Failed to send contact webhook:', webhookError);
        // Don't fail the request if webhook fails
      }
    }

    // 3. Send email notification via platform email service (if configured)
    // This uses the platform's internal email sending - handled separately
    const notificationEmail = (sectionContent.notificationEmail as string) || 
                              ((store.settings as Record<string, unknown>)?.contactEmail as string);
    
    if (notificationEmail) {
      // Emit event for email notification (handled by event system)
      console.log(`[Contact] New submission from ${email} for store ${store.name}, should notify: ${notificationEmail}`);
    }

    // Success response
    if (!contentType.includes('application/json')) {
      // For form submissions, redirect to thank you or back with success
      const successUrl = (sectionContent.successUrl as string) || 
                        request.headers.get('referer') || 
                        `/${slug}`;
      const separator = successUrl.includes('?') ? '&' : '?';
      return NextResponse.redirect(new URL(`${successUrl}${separator}contact=success`), 303);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'הפנייה נשלחה בהצלחה',
      id: contact.id,
    });

  } catch (error) {
    console.error('Contact form error:', error);
    
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const referer = request.headers.get('referer') || '/';
      return NextResponse.redirect(new URL(`${referer}?error=server_error`), 303);
    }
    
    return NextResponse.json(
      { success: false, error: 'אירעה שגיאה בשליחת הטופס' },
      { status: 500 }
    );
  }
}
