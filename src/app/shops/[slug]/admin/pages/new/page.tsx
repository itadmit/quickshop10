import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { pageTemplates } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageForm } from '../page-form';

// ============================================
// New Page - Server Component
// Loads templates from DB + default system templates
// Zero client JS for template selection - maximum speed! ⚡
// ============================================

// ISR - Revalidate every 60 seconds
export const revalidate = 60;


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

  // Fetch custom templates from DB
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

  // Find selected template
  const selectedTemplate = templateId 
    ? customTemplates.find(t => t.id === templateId)
    : null;
  const selectedTemplateName = selectedTemplate?.name;
  const selectedTemplateSections = (selectedTemplate?.sections as unknown[]) || [];

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
          → חזרה לעמודים
        </Link>
      </div>

      {/* Template Selection - Show when no template selected */}
      {!selectedTemplate && (
        <div className="space-y-4">
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
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
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
