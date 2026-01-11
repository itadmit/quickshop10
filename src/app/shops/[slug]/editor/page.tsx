import { notFound, redirect } from 'next/navigation';
import { getStoreBySlug, getPageSections, getCategoriesByStore } from '@/lib/db/queries';
import { auth } from '@/lib/auth';
import { ThemeEditor } from './theme-editor';
import { db } from '@/lib/db';
import { pageSections, pages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// ============================================
// Theme Editor Page - Full Screen (No Admin Layout)
// Preview uses iframe, so no need to fetch categories/products here
// ============================================

interface EditorPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ template?: string; page?: string }>;
}

export default async function EditorPage({ params, searchParams }: EditorPageProps) {
  const { slug } = await params;
  const { template, page: pageParam } = await searchParams;
  
  // Current page being edited (home, coming_soon, etc.)
  const currentPage = pageParam || 'home';
  
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/shops/${slug}/editor`);
  }

  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Verify user owns this store (or is platform admin)
  if (store.ownerId !== session.user.id && session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch internal pages in parallel with sections
  const [rawSections, internalPagesRaw] = await Promise.all([
    getPageSections(store.id, currentPage),
    db.query.pages.findMany({
      where: eq(pages.storeId, store.id),
      columns: {
        id: true,
        title: true,
        slug: true,
        isPublished: true,
      },
      orderBy: (pages, { asc }) => [asc(pages.title)],
    }),
  ]);
  
  // Map internal pages
  const internalPages = internalPagesRaw.map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    isPublished: p.isPublished,
  }));
  
  // Re-declare rawSections as mutable for potential modifications
  let sections = rawSections;

  // For internal pages: verify the page exists
  if (currentPage.startsWith('pages/')) {
    const pageSlug = currentPage.replace('pages/', '');
    const pageExists = await db.query.pages.findFirst({
      where: and(eq(pages.storeId, store.id), eq(pages.slug, pageSlug)),
    });
    
    if (!pageExists) {
      // Page doesn't exist, redirect to home editor
      redirect(`/shops/${slug}/editor?page=home`);
    }
  }

  // For coming_soon page: auto-create default sections if none exist
  // This handles existing stores that don't have coming_soon sections yet
  if (currentPage === 'coming_soon' && sections.length === 0) {
    await db.insert(pageSections).values([
      {
        storeId: store.id,
        page: 'coming_soon',
        type: 'hero',
        title: 'Coming Soon',
        subtitle: store.name,
        content: {
          imageUrl: 'https://static.zara.net/assets/public/7d17/93b6/642f4cafb9ab/b570acca9761/image-landscape-d9c8c30a-51dc-4c2c-a132-17471fd14151-default_0/image-landscape-d9c8c30a-51dc-4c2c-a132-17471fd14151-default_0.jpg?ts=1760467352233&w=3420',
          buttonText: '',
          buttonLink: '',
        },
        settings: {
          height: '100vh',
          overlay: 0.6,
        },
        sortOrder: 0,
        isActive: true,
      },
      {
        storeId: store.id,
        page: 'coming_soon',
        type: 'newsletter',
        title: 'הישארו מעודכנים',
        subtitle: 'אנחנו עובדים על משהו מיוחד. השאירו את האימייל שלכם ונעדכן אתכם כשנפתח.',
        content: {
          placeholder: 'כתובת אימייל',
          buttonText: 'עדכנו אותי',
        },
        settings: {
          maxWidth: '500px',
        },
        sortOrder: 1,
        isActive: true,
      },
    ]);
    // Refetch after creation
    sections = await getPageSections(store.id, currentPage);
  }

  // Type-cast sections to match expected interface
  const typedSections = sections.map(s => ({
    ...s,
    content: (s.content || {}) as Record<string, unknown>,
    settings: (s.settings || {}) as Record<string, unknown>,
  }));

  // Fetch categories for the editor (simple list for checkbox selection)
  const storeCategories = await getCategoriesByStore(store.id);
  const categoriesForEditor = storeCategories.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    imageUrl: c.imageUrl,
    parentId: c.parentId,
  }));

  // Get theme settings
  const themeSettings = (store.themeSettings || {}) as Record<string, unknown>;
  const currentTemplateId = template || (themeSettings.templateId as string) || 'noir';

  return (
    <ThemeEditor
      key={currentPage} // Force remount when page changes
      store={store}
      slug={slug}
      sections={typedSections}
      templateId={currentTemplateId}
      categories={categoriesForEditor}
      currentPage={currentPage}
      isPublished={store.isPublished}
      internalPages={internalPages}
    />
  );
}
