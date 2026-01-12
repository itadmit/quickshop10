import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { pages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageButtons } from './page-buttons';

// ============================================
// Pages Management - Server Component
// Lists all internal pages with "Edit in Builder" links
// ============================================

export default async function PagesManagementPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const storePages = await db
    .select()
    .from(pages)
    .where(eq(pages.storeId, store.id))
    .orderBy(desc(pages.createdAt));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">עמודים</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">ניהול עמודי תוכן סטטיים</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/shops/${slug}/admin/pages/new`}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            עמוד חדש
          </Link>
          <Link
            href={`/shops/${slug}/editor?page=home`}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-900 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            פתח בעורך
          </Link>
        </div>
      </div>

      {/* Pages List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-3 sm:p-4 border-b border-gray-100">
          <h2 className="font-semibold text-sm sm:text-base">כל העמודים ({storePages.length})</h2>
        </div>
        
        {storePages.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-gray-500">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
            <p className="text-sm">אין עמודים עדיין</p>
            <p className="text-xs sm:text-sm mt-1">צרו עמוד חדש או אפסו את החנות ליצירת עמודי ברירת מחדל</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <Link
                href={`/shops/${slug}/admin/pages/new`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                צור עמוד חדש
              </Link>
              <Link
                href={`/shops/${slug}/admin/settings/advanced`}
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                איפוס החנות
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {storePages.map((page) => (
              <div key={page.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm sm:text-base text-gray-900 truncate">
                      {page.title}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] sm:text-xs rounded-full ${
                      page.isPublished 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {page.isPublished ? 'פורסם' : 'טיוטה'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                    /pages/{page.slug} • 
                    עודכן {new Date(page.updatedAt).toLocaleDateString('he-IL')}
                  </p>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-auto">
                  {/* View Page */}
                  <Link
                    href={`/shops/${slug}/pages/${page.slug}`}
                    target="_blank"
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="צפה בעמוד"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 8.67v4A1.33 1.33 0 0110.67 14H3.33A1.33 1.33 0 012 12.67V5.33A1.33 1.33 0 013.33 4h4M10 2h4v4M6.67 9.33L14 2" />
                    </svg>
                  </Link>
                  
                  {/* Edit in Builder - Primary Action */}
                  <Link
                    href={`/shops/${slug}/editor?page=pages/${page.slug}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    title="ערוך בבילדר"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    ערוך
                  </Link>
                  
                  {/* Delete Button */}
                  <PageButtons pageId={page.id} slug={slug} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="text-blue-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-900">איך לערוך עמודים?</h3>
            <p className="text-sm text-blue-700 mt-1">
              לחצו על כפתור "ערוך" כדי לפתוח את העמוד בעורך הויזואלי. 
              שם תוכלו להוסיף סקשנים, לערוך תוכן ולצפות בתצוגה מקדימה בזמן אמת.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
