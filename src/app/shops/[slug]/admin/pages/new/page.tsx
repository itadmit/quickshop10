import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { pageTemplates } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageForm } from '../page-form';
import { getDefaultPageTemplates, getDefaultPageTemplateById } from '@/lib/default-page-templates';

// ============================================
// New Page - Server Component
// Loads templates from DB + default system templates
// Zero client JS for template selection - maximum speed! ⚡
// ============================================

// ISR - Revalidate every 60 seconds
export const revalidate = 60;

// Template icons mapping
const templateIcons: Record<string, React.ReactNode> = {
  message: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  info: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  question: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  policy: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  truck: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  return: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
  ),
};

export default async function NewPagePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ template?: string }>;
}) {
  const { slug } = await params;
  const { template: templateId } = await searchParams;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Parallel fetch: custom templates from DB + default templates
  let customTemplates: (typeof pageTemplates.$inferSelect)[] = [];
  
  try {
    customTemplates = await db
      .select()
      .from(pageTemplates)
      .where(eq(pageTemplates.storeId, store.id))
      .orderBy(asc(pageTemplates.sortOrder));
  } catch {
    // Table might not exist yet in some environments
    customTemplates = [];
  }
  
  const defaultTemplates = getDefaultPageTemplates();

  // Determine selected template type
  const isSystemTemplate = templateId?.startsWith('system:');
  const templateIdClean = isSystemTemplate ? templateId!.replace('system:', '') : templateId;
  
  // Find selected template
  const selectedSystemTemplate = isSystemTemplate ? getDefaultPageTemplateById(templateIdClean || '') : null;
  const selectedCustomTemplate = !isSystemTemplate && templateId 
    ? customTemplates.find(t => t.id === templateId)
    : null;
  const selectedTemplate = selectedSystemTemplate || selectedCustomTemplate;
  const selectedTemplateName = selectedSystemTemplate?.name || selectedCustomTemplate?.name;
  const selectedTemplateSections = selectedSystemTemplate?.sections || 
    (selectedCustomTemplate?.sections as unknown[]) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">עמוד חדש</h1>
          <p className="text-gray-500 text-sm mt-1">
            {selectedTemplate ? `תבנית: ${selectedTemplateName}` : 'יצירת עמוד תוכן חדש'}
          </p>
        </div>
        <Link
          href={`/shops/${slug}/admin/pages`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← חזרה לעמודים
        </Link>
      </div>

      {/* Template Selection - Show when no template selected */}
      {!selectedTemplate && (
        <div className="space-y-4">
          {/* System Templates */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-600">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </span>
              <h2 className="font-medium text-gray-900">תבניות מערכת</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {defaultTemplates.map((template) => (
                <Link
                  key={template.id}
                  href={`/shops/${slug}/admin/pages/new?template=system:${template.id}`}
                  className="group p-4 border border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-colors text-center"
                >
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100">
                    {templateIcons[template.icon] || templateIcons.info}
                  </div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-black block">
                    {template.name}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {template.sections.length} סקשנים
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Custom Templates */}
          {customTemplates.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-gray-600">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </span>
                <h2 className="font-medium text-gray-900">תבניות שלי</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {customTemplates.map((template) => (
                  <Link
                    key={template.id}
                    href={`/shops/${slug}/admin/pages/new?template=${template.id}`}
                    className="group p-4 border border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-colors text-center"
                  >
                    <div className="w-full h-20 bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                      {template.thumbnailUrl ? (
                        <img 
                          src={template.thumbnailUrl} 
                          alt={template.name}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900 group-hover:text-black">
                      {template.name}
                    </span>
                    {template.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Skip Template Option */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              או המשיכו ללא תבנית ליצירת עמוד ריק ↓
            </p>
          </div>
        </div>
      )}

      {/* Selected Template Info */}
      {selectedTemplate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              {isSystemTemplate && selectedSystemTemplate 
                ? (templateIcons[selectedSystemTemplate.icon] || templateIcons.info)
                : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                )
              }
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">תבנית: {selectedTemplateName}</p>
              <p className="text-xs text-blue-700">
                {selectedTemplateSections.length} סקשנים יועתקו לעמוד החדש
              </p>
            </div>
          </div>
          <Link
            href={`/shops/${slug}/admin/pages/new`}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            בחר תבנית אחרת
          </Link>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <PageForm 
          storeId={store.id} 
          slug={slug}
          templateId={templateId}
        />
      </div>

      {/* Help - Create templates */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">טיפ: יצירת תבניות מותאמות</h3>
            <p className="text-sm text-gray-600 mt-1">
              עצבו עמוד בעורך הויזואלי ולחצו על "שמור כתבנית" כדי לשמור אותו לשימוש חוזר.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
