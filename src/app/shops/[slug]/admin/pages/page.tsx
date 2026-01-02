import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { pages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageButtons } from './page-buttons';

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
        <Link
          href={`/shops/${slug}/admin/pages/new`}
          className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-900 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          עמוד חדש
        </Link>
      </div>

      {/* Quick Templates */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {[
          { title: 'אודות', slug: 'about', icon: 'info' },
          { title: 'צור קשר', slug: 'contact', icon: 'mail' },
          { title: 'משלוחים', slug: 'shipping', icon: 'truck' },
          { title: 'מדיניות פרטיות', slug: 'privacy', icon: 'shield' },
        ].map((template) => {
          const exists = storePages.some(p => p.slug === template.slug);
          return (
            <Link
              key={template.slug}
              href={exists 
                ? `/shops/${slug}/admin/pages/${storePages.find(p => p.slug === template.slug)?.id}` 
                : `/shops/${slug}/admin/pages/new?template=${template.slug}`
              }
              className={`p-3 sm:p-4 rounded-xl border text-center transition-colors ${
                exists 
                  ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="text-xs sm:text-sm font-medium text-gray-900">{template.title}</div>
              <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
                {exists ? 'קיים ✓' : 'צור עמוד'}
              </div>
            </Link>
          );
        })}
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
            <p className="text-xs sm:text-sm mt-1">צור עמודי תוכן כמו אודות, צור קשר ומדיניות פרטיות</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {storePages.map((page) => (
              <div key={page.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link 
                      href={`/shops/${slug}/admin/pages/${page.id}`}
                      className="font-medium text-sm sm:text-base text-gray-900 hover:text-black truncate"
                    >
                      {page.title}
                    </Link>
                    <span className={`px-2 py-0.5 text-[10px] sm:text-xs rounded-full ${
                      page.isPublished 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {page.isPublished ? 'פורסם' : 'טיוטה'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                    /{page.slug} • 
                    עודכן {new Date(page.updatedAt).toLocaleDateString('he-IL')}
                  </p>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-auto">
                  <Link
                    href={`/shops/${slug}/${page.slug}`}
                    target="_blank"
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="צפה בעמוד"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 8.67v4A1.33 1.33 0 0110.67 14H3.33A1.33 1.33 0 012 12.67V5.33A1.33 1.33 0 013.33 4h4M10 2h4v4M6.67 9.33L14 2" />
                    </svg>
                  </Link>
                  <Link
                    href={`/shops/${slug}/admin/pages/${page.id}`}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="ערוך"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M11.33 2a1.88 1.88 0 012.67 2.67L5 13.67 2 14.67l1-3L11.33 2z" />
                    </svg>
                  </Link>
                  <PageButtons pageId={page.id} slug={slug} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

