import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, contacts, customers } from '@/lib/db/schema';
import { eq, and, desc, gt } from 'drizzle-orm';

// UTF-8 BOM for Excel compatibility with Hebrew
const UTF8_BOM = '\uFEFF';

// GET /api/shops/[slug]/contacts/export
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const tagFilter = searchParams.get('tag');
    const sourceFilter = searchParams.get('source');

    console.log('[Export] Starting export:', { slug, type, tagFilter, sourceFilter });

    // Get store
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, slug),
      columns: { id: true, name: true },
    });

    if (!store) {
      console.log('[Export] Store not found:', slug);
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    console.log('[Export] Found store:', store.id);

    // Type labels for Hebrew
    const typeLabels: Record<string, string> = {
      customer: 'לקוח',
      newsletter: 'ניוזלטר',
      club_member: 'מועדון',
      contact_form: 'יצירת קשר',
      popup_form: 'פופאפ',
    };

    const sourceLabels: Record<string, string> = {
      checkout: 'צ׳קאאוט',
      contact_page: 'עמוד יצירת קשר',
      registration: 'הרשמה',
      popup: 'פופאפ',
      newsletter: 'ניוזלטר',
      import: 'יבוא',
      manual: 'ידני',
      api: 'API',
      homepage: 'עמוד הבית',
      product_page: 'עמוד מוצר',
      category_page: 'עמוד קטגוריה',
      cart: 'עגלה',
      account: 'אזור אישי',
    };

    const statusLabels: Record<string, string> = {
      active: 'פעיל',
      unsubscribed: 'הוסר',
      spam: 'ספאם',
    };

    // Special handling for customers (from customers table)
    if (type === 'customer') {
      const customersData = await db
        .select({
          firstName: customers.firstName,
          lastName: customers.lastName,
          email: customers.email,
          phone: customers.phone,
          totalOrders: customers.totalOrders,
          totalSpent: customers.totalSpent,
          createdAt: customers.createdAt,
        })
        .from(customers)
        .where(and(eq(customers.storeId, store.id), gt(customers.totalOrders, 0)))
        .orderBy(desc(customers.createdAt));

      // Build CSV for customers
      const headers = ['שם פרטי', 'שם משפחה', 'אימייל', 'טלפון', 'סוג', 'הזמנות', 'סה"כ קניות', 'תאריך הצטרפות'];
      const csvRows = [headers.join(',')];

      for (const customer of customersData) {
        csvRows.push([
          escapeCsvField(customer.firstName || ''),
          escapeCsvField(customer.lastName || ''),
          escapeCsvField(customer.email),
          escapeCsvField(customer.phone || ''),
          'לקוח',
          String(customer.totalOrders || 0),
          `₪${customer.totalSpent || '0'}`,
          formatDate(customer.createdAt),
        ].join(','));
      }

      const csv = UTF8_BOM + csvRows.join('\n');
      const filename = `customers-${formatDateForFilename(new Date())}.csv`;

      console.log('[Export] Exporting', customersData.length, 'customers');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        },
      });
    }

    // Build conditions for contacts
    const conditions = [eq(contacts.storeId, store.id)];
    if (type && type !== 'all') {
      conditions.push(eq(contacts.type, type as 'newsletter' | 'club_member' | 'contact_form' | 'popup_form'));
    }
    if (sourceFilter) {
      conditions.push(eq(contacts.source, sourceFilter));
    }

    console.log('[Export] Querying contacts with', conditions.length, 'conditions');

    // Get contacts
    let contactsData = await db.query.contacts.findMany({
      where: and(...conditions),
      orderBy: desc(contacts.createdAt),
    });

    console.log('[Export] Found', contactsData.length, 'contacts before tag filter');

    // Filter by tag (from metadata) - done in JS since it's in JSONB
    if (tagFilter) {
      contactsData = contactsData.filter(contact => {
        const metadata = (contact.metadata || {}) as { tag?: string };
        return metadata.tag === tagFilter;
      });
    }

    // Build CSV
    const headers = ['שם פרטי', 'שם משפחה', 'אימייל', 'טלפון', 'סוג', 'סטטוס', 'מקור', 'תגית', 'הודעה', 'תאריך'];
    const csvRows = [headers.join(',')];

    for (const contact of contactsData) {
      const metadata = (contact.metadata || {}) as { message?: string; tag?: string };
      
      csvRows.push([
        escapeCsvField(contact.firstName || ''),
        escapeCsvField(contact.lastName || ''),
        escapeCsvField(contact.email),
        escapeCsvField(contact.phone || ''),
        typeLabels[contact.type] || contact.type,
        statusLabels[contact.status] || contact.status,
        contact.source ? (sourceLabels[contact.source] || contact.source) : '',
        escapeCsvField(metadata.tag || ''),
        escapeCsvField(metadata.message || ''),
        formatDate(contact.createdAt),
      ].join(','));
    }

    const csv = UTF8_BOM + csvRows.join('\n');
    const typeLabel = type && type !== 'all' ? `-${type}` : '';
    const dateStr = formatDateForFilename(new Date());
    // Use ASCII-safe filename, encode non-ASCII parts with RFC 5987
    const baseFilename = `contacts${typeLabel}-${dateStr}.csv`;
    const fullFilename = `contacts${typeLabel}${tagFilter ? `-${tagFilter}` : ''}${sourceFilter ? `-${sourceFilter}` : ''}-${dateStr}.csv`;
    const encodedFilename = encodeURIComponent(fullFilename);

    console.log('[Export] Exporting', contactsData.length, 'contacts');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        // RFC 5987 format for UTF-8 filenames
        'Content-Disposition': `attachment; filename="${baseFilename}"; filename*=UTF-8''${encodedFilename}`,
      },
    });

  } catch (error) {
    console.error('[Export] Error:', error);
    return NextResponse.json({ error: 'Export failed', details: String(error) }, { status: 500 });
  }
}

// Escape CSV field (handle commas, quotes, newlines)
function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// Format date for display
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Format date for filename
function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0];
}

