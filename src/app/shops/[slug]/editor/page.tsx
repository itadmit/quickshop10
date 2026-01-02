import { notFound, redirect } from 'next/navigation';
import { getStoreBySlug, getPageSections, getCategoriesByStore, getProductsByStore } from '@/lib/db/queries';
import { auth } from '@/lib/auth';
import { ThemeEditor } from './theme-editor';

// ============================================
// Theme Editor Page - Full Screen (No Admin Layout)
// ============================================

interface EditorPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ template?: string }>;
}

export default async function EditorPage({ params, searchParams }: EditorPageProps) {
  const { slug } = await params;
  const { template } = await searchParams;
  
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

  // Fetch all data needed for preview - parallel for speed!
  const [rawSections, categories, products] = await Promise.all([
    getPageSections(store.id, 'home'),
    getCategoriesByStore(store.id),
    getProductsByStore(store.id, 12),
  ]);

  // Type-cast sections to match expected interface
  const sections = rawSections.map(s => ({
    ...s,
    content: (s.content || {}) as Record<string, unknown>,
    settings: (s.settings || {}) as Record<string, unknown>,
  }));

  // Get theme settings
  const themeSettings = (store.themeSettings || {}) as Record<string, unknown>;
  const currentTemplateId = template || (themeSettings.templateId as string) || 'noir';

  return (
    <ThemeEditor
      store={store}
      slug={slug}
      sections={sections}
      categories={categories}
      products={products}
      templateId={currentTemplateId}
    />
  );
}

