import { notFound, redirect } from 'next/navigation';
import { getStoreBySlug, getPageSections, getCategoriesByStore } from '@/lib/db/queries';
import { auth } from '@/lib/auth';
import { ThemeEditor } from './theme-editor';
import { db } from '@/lib/db';
import { pages, stores } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { defaultProductPageSections } from '@/lib/product-page-sections';
import { getStoreMetafields } from '../admin/metafields/actions';

// ============================================
// Theme Editor Page - Full Screen (No Admin Layout)
// Preview uses iframe, so no need to fetch categories/products here
// NEW ARCHITECTURE: Sections stored as JSON on pages/stores
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
        seoTitle: true,
        seoDescription: true,
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
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
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
  // NEW ARCHITECTURE: Updates stores.comingSoonSections JSON
  if (currentPage === 'coming_soon' && sections.length === 0) {
    const defaultComingSoonSections = [
      {
        id: randomUUID(),
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
        id: randomUUID(),
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
    ];
    
    // Update stores table with coming_soon sections
    await db.update(stores)
      .set({ comingSoonSections: defaultComingSoonSections })
      .where(eq(stores.id, store.id));
    
    // Refetch after creation
    sections = await getPageSections(store.id, currentPage);
  }

  // For product page: auto-create default sections if none exist
  // NEW ARCHITECTURE: Product page is fully editable like home page
  if (currentPage === 'product') {
    // Check if we need to migrate from old product_info to new granular sections
    const hasOldProductInfo = sections.some(s => s.type === 'product_info');
    const hasNewSections = sections.some(s => 
      s.type === 'product_badges' || 
      s.type === 'product_title' || 
      s.type === 'product_price'
    );
    
    // Migrate if using old structure OR no sections exist
    if (sections.length === 0 || (hasOldProductInfo && !hasNewSections)) {
      // Generate unique IDs for default sections
      const productSectionsWithIds = defaultProductPageSections.map(s => ({
        ...s,
        id: randomUUID(),
      }));
      
      // Update stores table with product page sections
      await db.update(stores)
        .set({ productPageSections: productSectionsWithIds })
        .where(eq(stores.id, store.id));
      
      // Refetch after creation
      sections = await getPageSections(store.id, currentPage);
    }
  }

  // Type-cast sections to match expected interface
  const typedSections = sections.map(s => ({
    ...s,
    content: (s.content || {}) as Record<string, unknown>,
    settings: (s.settings || {}) as Record<string, unknown>,
  }));

  // Fetch categories and metafields for the editor
  const [storeCategories, metafields] = await Promise.all([
    getCategoriesByStore(store.id),
    getStoreMetafields(store.id),
  ]);
  
  const categoriesForEditor = storeCategories.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    imageUrl: c.imageUrl,
    parentId: c.parentId,
  }));
  
  // Filter metafields for dynamic source picker (only active ones that show on product)
  const metafieldsForPicker = metafields
    .filter(m => m.isActive && m.showOnProduct)
    .map(m => ({
      id: m.id,
      name: m.name,
      key: m.key,
      type: m.type,
      isActive: m.isActive,
      showOnProduct: m.showOnProduct,
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
      metafields={metafieldsForPicker}
    />
  );
}
