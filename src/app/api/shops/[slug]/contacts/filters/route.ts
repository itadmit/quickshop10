import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, contacts } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// GET /api/shops/[slug]/contacts/filters
// Returns available tags and sources for filtering
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    console.log('[Filters] Getting filters for:', { slug, type });

    // Get store
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, slug),
      columns: { id: true },
    });

    if (!store) {
      console.log('[Filters] Store not found:', slug);
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    console.log('[Filters] Found store:', store.id);

    // Build conditions
    const conditions = [eq(contacts.storeId, store.id)];
    if (type && type !== 'all') {
      conditions.push(eq(contacts.type, type as 'newsletter' | 'club_member' | 'contact_form' | 'popup_form'));
    }

    // Get all contacts for this type to extract unique tags and sources
    const contactsData = await db.query.contacts.findMany({
      where: and(...conditions),
      columns: {
        source: true,
        metadata: true,
      },
    });

    // Extract unique tags from metadata
    const tagsSet = new Set<string>();
    const sourcesSet = new Set<string>();

    for (const contact of contactsData) {
      // Extract tag from metadata
      const metadata = (contact.metadata || {}) as { tag?: string };
      if (metadata.tag) {
        tagsSet.add(metadata.tag);
      }

      // Extract source
      if (contact.source) {
        sourcesSet.add(contact.source);
      }
    }

    console.log('[Filters] Found', tagsSet.size, 'tags and', sourcesSet.size, 'sources');

    return NextResponse.json({
      tags: Array.from(tagsSet).sort(),
      sources: Array.from(sourcesSet).sort(),
    });

  } catch (error) {
    console.error('[Filters] Error:', error);
    return NextResponse.json({ error: 'Failed to get filters', details: String(error) }, { status: 500 });
  }
}

