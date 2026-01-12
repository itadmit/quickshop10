import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pageTemplates, pageSections, stores } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { getStoreBySlug } from '@/lib/db/queries';

// GET /api/shops/[slug]/page-templates - List all templates for a store
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const store = await getStoreBySlug(slug);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const templates = await db
      .select()
      .from(pageTemplates)
      .where(eq(pageTemplates.storeId, store.id))
      .orderBy(asc(pageTemplates.sortOrder));

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching page templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST /api/shops/[slug]/page-templates - Create a new template from current page
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { name, description, pageSlug } = body;

    if (!name) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    const store = await getStoreBySlug(slug);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get sections from the specified page
    let sectionsData: unknown[] = [];
    
    if (pageSlug) {
      // Determine page type
      const page = pageSlug.startsWith('pages/') ? pageSlug : pageSlug;
      
      const sections = await db
        .select()
        .from(pageSections)
        .where(eq(pageSections.storeId, store.id))
        .orderBy(asc(pageSections.sortOrder));

      // Filter sections for the current page
      sectionsData = sections
        .filter(s => s.page === page || (page === 'home' && s.page === 'home'))
        .map(s => ({
          type: s.type,
          title: s.title,
          subtitle: s.subtitle,
          content: s.content,
          settings: s.settings,
          sortOrder: s.sortOrder,
        }));
    }

    // Get current max sortOrder
    const existingTemplates = await db
      .select({ sortOrder: pageTemplates.sortOrder })
      .from(pageTemplates)
      .where(eq(pageTemplates.storeId, store.id));
    
    const maxSortOrder = existingTemplates.reduce((max, t) => Math.max(max, t.sortOrder), -1);

    // Create the template
    const [newTemplate] = await db.insert(pageTemplates).values({
      storeId: store.id,
      name,
      description: description || null,
      sections: sectionsData,
      sortOrder: maxSortOrder + 1,
    }).returning();

    return NextResponse.json({ 
      success: true, 
      template: newTemplate,
    });
  } catch (error) {
    console.error('Error creating page template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

