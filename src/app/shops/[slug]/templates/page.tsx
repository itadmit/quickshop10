import { getStoreBySlug } from '@/lib/db/queries';
import { templates, type Template } from '@/lib/templates';
import { notFound } from 'next/navigation';
import { TemplateGrid } from './template-grid';

interface TemplatesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TemplatesPage({ params }: TemplatesPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  // Get current template from store settings
  const storeSettings = (store.settings || {}) as Record<string, unknown>;
  const currentTemplateId = (storeSettings.templateId as string) || 'noir';

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">בחר תבנית</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {store.name} • {templates.length} תבניות זמינות
            </p>
          </div>
          <a
            href={`/shops/${slug}/editor`}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            חזרה לאדיטור
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Current Template Banner */}
        <div className="bg-gradient-to-l from-blue-600 to-blue-700 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-200 text-sm mb-1">תבנית נוכחית</div>
              <div className="text-2xl font-semibold">
                {templates.find(t => t.id === currentTemplateId)?.name || 'Noir'}
              </div>
              <div className="text-blue-100 text-sm mt-1">
                {templates.find(t => t.id === currentTemplateId)?.description}
              </div>
            </div>
            <a
              href={`/shops/${slug}/editor`}
              className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
            >
              עריכת עיצוב
            </a>
          </div>
        </div>

        {/* Templates Grid */}
        <TemplateGrid 
          groupedTemplates={groupedTemplates}
          currentTemplateId={currentTemplateId}
          storeSlug={slug}
        />
      </main>
    </div>
  );
}

