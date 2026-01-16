import { db } from '@/lib/db';
import { helpGuideCategories, helpGuides } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import Link from 'next/link';
import { Plus, Pencil, GripVertical, BookOpen, FolderOpen } from 'lucide-react';
import { DeleteCategoryButton, DeleteGuideButton } from './delete-buttons';

export const dynamic = 'force-dynamic';

export default async function GuidesPage() {
  const categories = await db
    .select()
    .from(helpGuideCategories)
    .orderBy(asc(helpGuideCategories.sortOrder));

  const guides = await db
    .select()
    .from(helpGuides)
    .orderBy(asc(helpGuides.sortOrder));

  // Group guides by category
  const guidesByCategory = guides.reduce((acc, guide) => {
    const catId = guide.categoryId || 'uncategorized';
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(guide);
    return acc;
  }, {} as Record<string, typeof guides>);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">מדריכים ועזרה</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">ניהול מדריכים שמופיעים בעמוד העזרה הציבורי</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Link
            href="/admin/guides/categories/new"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline">קטגוריה חדשה</span>
            <span className="sm:hidden">קטגוריה</span>
          </Link>
          <Link
            href="/admin/guides/new"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">מדריך חדש</span>
            <span className="sm:hidden">מדריך</span>
          </Link>
        </div>
      </div>

      {/* Categories and Guides */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 text-center">
          <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">אין עדיין מדריכים</h3>
          <p className="text-sm text-gray-500 mb-6">התחילו ביצירת קטגוריה ואז הוסיפו מדריכים</p>
          <Link
            href="/admin/guides/categories/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            יצירת קטגוריה
          </Link>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Category Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl sm:text-2xl">{category.icon || '📁'}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{category.title}</h3>
                      {!category.isActive && (
                        <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-yellow-100 text-yellow-700 rounded flex-shrink-0">מוסתר</span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Link
                    href={`/admin/guides/categories/${category.id}`}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <DeleteCategoryButton categoryId={category.id} />
                </div>
              </div>

              {/* Guides List */}
              <div className="divide-y divide-gray-100">
                {guidesByCategory[category.id]?.length ? (
                  guidesByCategory[category.id].map((guide) => (
                    <div key={guide.id} className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-gray-50">
                      <div className="flex items-center gap-3 min-w-0">
                        <GripVertical className="w-4 h-4 text-gray-300 hidden sm:block flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 truncate">{guide.title}</h4>
                            {!guide.isActive && (
                              <span className="px-2 py-0.5 text-[10px] bg-yellow-100 text-yellow-700 rounded flex-shrink-0">טיוטה</span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{guide.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 mr-2">
                        <Link
                          href={`/admin/guides/${guide.id}`}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <DeleteGuideButton guideId={guide.id} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 sm:px-6 py-6 sm:py-8 text-center text-gray-500">
                    <span className="text-sm">אין מדריכים בקטגוריה זו</span>
                    <Link
                      href={`/admin/guides/new?category=${category.id}`}
                      className="text-emerald-600 hover:underline mr-2 text-sm"
                    >
                      הוסף מדריך
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Link */}
      <div className="mt-6 sm:mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-blue-900 text-sm sm:text-base">צפה בעמוד המדריכים הציבורי</p>
            <Link href="/help" target="_blank" className="text-sm text-blue-600 hover:underline">
              /help ←
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
