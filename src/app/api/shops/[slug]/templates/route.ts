import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { templates, getTemplateById } from '@/lib/templates';
import { getStoreBySlug, updatePageSections } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/shops/[slug]/templates - Get all templates
export async function GET() {
  const templateList = templates.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    previewImage: t.previewImage,
    isPro: t.isPro,
    sectionsCount: t.sections.length,
  }));

  return NextResponse.json(templateList);
}

// POST /api/shops/[slug]/templates - Apply a template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { templateId, applySettings = true, applySections = true } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'templateId is required' },
        { status: 400 }
      );
    }

    const store = await getStoreBySlug(slug);
    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    const template = getTemplateById(templateId);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Apply template settings
    if (applySettings) {
      const currentSettings = (store.settings || {}) as Record<string, unknown>;
      const newSettings = {
        ...currentSettings,
        templateId: template.id,
        headerLayout: template.themeSettings.headerLayout,
        headerSticky: template.themeSettings.headerSticky,
        headerTransparent: template.themeSettings.headerTransparent,
        announcementText: template.themeSettings.announcementText,
        announcementBg: template.themeSettings.announcementBg,
        announcementColor: template.themeSettings.announcementColor,
      };

      // Update store settings directly
      await db
        .update(stores)
        .set({
          settings: newSettings,
          updatedAt: new Date(),
        })
        .where(eq(stores.id, store.id));
    }

    // Apply template sections
    if (applySections) {
      // Convert template sections to page sections format
      // Use crypto.randomUUID() - built into Node.js, no external package needed
      const sections = template.sections.map((section, index) => ({
        id: crypto.randomUUID(),
        type: section.type,
        title: section.title,
        subtitle: section.subtitle,
        content: section.content,
        settings: section.settings,
        sortOrder: index,
        isActive: true,
      }));

      // Delete existing sections and insert new ones
      await updatePageSections(store.id, 'home', sections);
    }

    // CRITICAL: Revalidate cache so changes are visible immediately
    // Without this, old template sections would still show from cache
    revalidatePath(`/shops/${slug}`);
    revalidatePath(`/shops/${slug}/editor`);

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
      },
    });
  } catch (error) {
    console.error('Error applying template:', error);
    return NextResponse.json(
      { error: 'Failed to apply template' },
      { status: 500 }
    );
  }
}
