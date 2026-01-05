import { notFound, redirect } from 'next/navigation';
import { getStoreBySlug, getPageSections } from '@/lib/db/queries';
import { auth } from '@/lib/auth';
import { ThemeEditor } from './theme-editor';

// ============================================
// Theme Editor Page - Full Screen (No Admin Layout)
// Preview uses iframe, so no need to fetch categories/products here
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

  // Fetch sections for the editor sidebar
  const rawSections = await getPageSections(store.id, 'home');

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
      templateId={currentTemplateId}
    />
  );
}
