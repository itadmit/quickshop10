import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { CustomCodeEditor } from './custom-code-editor';

// ============================================
// Custom Code Page - Server Component
// Editor is client-side only (minimal JS for code editing)
// ============================================

interface CustomCodePageProps {
  params: Promise<{ slug: string }>;
}

export default async function CustomCodePage({ params }: CustomCodePageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get current custom code from store settings
  const storeSettings = (store.settings || {}) as Record<string, unknown>;
  const customCode = {
    headCode: (storeSettings.customHeadCode as string) || '',
    bodyStartCode: (storeSettings.customBodyStartCode as string) || '',
    bodyEndCode: (storeSettings.customBodyEndCode as string) || '',
    customCss: (storeSettings.customCss as string) || '',
  };

  return (
    // Negative margins to override admin layout padding for full-width experience
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-4 sm:-my-6 lg:-my-8 h-[calc(100vh-56px)] flex flex-col">
      <CustomCodeEditor 
        storeId={store.id}
        storeSlug={slug}
        initialCode={customCode}
      />
    </div>
  );
}
