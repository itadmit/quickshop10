import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { CustomCodeEditor } from './custom-code-editor';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="bg-[#252526] border-b border-[#3c3c3c] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href={`/shops/${slug}/admin/design`}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="text-sm">חזרה לעיצוב</span>
          </Link>
          <div className="w-px h-5 bg-[#3c3c3c]" />
          <h1 className="text-white font-medium">קוד מותאם</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>הקוד מתווסף לכל דפי החנות</span>
        </div>
      </div>

      {/* Editor */}
      <CustomCodeEditor 
        storeId={store.id}
        storeSlug={slug}
        initialCode={customCode}
      />
    </div>
  );
}

