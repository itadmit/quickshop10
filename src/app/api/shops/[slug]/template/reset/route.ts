/**
 * API Route: Reset Template to Default
 * POST /api/shops/[slug]/template/reset
 * 
 * Resets all sections to the template default and clears custom settings.
 * Updated: uses pageSections table
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, pageSections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { templates } from '@/lib/templates';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { templateId } = await request.json();

    console.log('🔄 Reset template request:', { slug, templateId });

    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      console.log('❌ Store not found:', slug);
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }

    console.log('✅ Store found:', store.id);

    // Get template definition
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      console.log('❌ Template not found:', templateId);
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    console.log('✅ Template found:', template.name, 'with', template.sections.length, 'sections');

    // Delete all existing home page sections
    const deleteResult = await db
      .delete(pageSections)
      .where(
        and(
          eq(pageSections.storeId, store.id),
          eq(pageSections.page, 'home')
        )
      );

    console.log('🗑️ Deleted existing sections');

    // Create fresh sections from template
    const newSections = template.sections.map((section, index) => ({
      id: crypto.randomUUID(),
      storeId: store.id,
      page: 'home' as const,
      type: section.type as typeof pageSections.$inferInsert.type,
      title: section.title || null,
      subtitle: section.subtitle || null,
      content: section.content || {},
      settings: section.settings || {},
      sortOrder: index,
      isActive: true,
    }));

    console.log('📝 New sections to insert:', newSections.map(s => s.type));

    // Insert new sections
    if (newSections.length > 0) {
      await db.insert(pageSections).values(newSections);
      console.log('✅ Inserted', newSections.length, 'new sections');
    }

    // Create sections for homeSections JSON field (the actual source!)
    const homeSectionsJson = template.sections.map((section, index) => ({
      id: crypto.randomUUID(),
      type: section.type,
      title: section.title || null,
      subtitle: section.subtitle || null,
      content: section.content || {},
      settings: section.settings || {},
      sortOrder: index,
      isActive: true,
    }));

    // Helper to extract first font name from CSS font stack
    const extractFontName = (fontStack: string): string => {
      // Remove quotes and get first font name
      // "'Assistant', 'Heebo', sans-serif" -> "Assistant"
      const firstFont = fontStack.split(',')[0].trim();
      return firstFont.replace(/['"]/g, '');
    };

    // Reset theme settings to template defaults
    const currentSettings = (store.settings as Record<string, unknown>) || {};
    const updatedSettings = {
      ...currentSettings,
      templateId,
      // Reset typography to defaults (extract just the font name, not the full stack)
      headingFont: extractFontName(template.cssVariables['--template-font-heading'] || 'Noto Sans Hebrew'),
      bodyFont: extractFontName(template.cssVariables['--template-font-body'] || 'Assistant'),
      // Clear other custom settings if needed
    };

    // CRITICAL: Update BOTH pageSections table AND homeSections JSON field!
    await db
      .update(stores)
      .set({
        settings: updatedSettings,
        homeSections: homeSectionsJson, // <-- This is what the page actually reads!
        updatedAt: new Date(),
      })
      .where(eq(stores.id, store.id));
    
    console.log('✅ Updated stores.homeSections with', homeSectionsJson.length, 'sections');

    console.log('✅ Template reset complete!');

    // Clear the sections cache (CRITICAL!)
    revalidateTag('sections', { expire: 0 });
    revalidateTag('page-sections', { expire: 0 });
    
    // Revalidate all related pages
    revalidatePath(`/shops/${slug}`);
    revalidatePath(`/shops/${slug}/admin/design`);
    revalidatePath(`/shops/${slug}/editor`);

    return NextResponse.json({
      success: true,
      message: 'Template reset successfully',
      sectionsCount: newSections.length,
    });

  } catch (error) {
    console.error('❌ Reset template error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
