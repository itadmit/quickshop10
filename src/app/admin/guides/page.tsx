import { db } from '@/lib/db';
import { helpGuideCategories, helpGuides } from '@/lib/db/schema';
import { desc, eq, asc } from 'drizzle-orm';
import Link from 'next/link';
import { Plus, Pencil, Trash2, GripVertical, BookOpen, FolderOpen } from 'lucide-react';
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
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">מדריכים ועזרה</h1>
          <p className="text-gray-500 mt-1">ניהול מדריכים שמופיעים בעמוד העזרה הציבורי</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/guides/categories/new"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            קטגוריה חדשה
          </Link>
          <Link
            href="/admin/guides/new"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            מדריך חדש
          </Link>
        </div>
      </div>

      {/* Categories and Guides */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">אין עדיין מדריכים</h3>
          <p className="text-gray-500 mb-6">התחילו ביצירת קטגוריה ואז הוסיפו מדריכים</p>
          <Link
            href="/admin/guides/categories/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            יצירת קטגוריה
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Category Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon || '📁'}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.title}</h3>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                  {!category.isActive && (
                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">מוסתר</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
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
                    <div key={guide.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-gray-300" />
                        <div>
                          <h4 className="font-medium text-gray-900">{guide.title}</h4>
                          <p className="text-sm text-gray-500">{guide.description}</p>
                        </div>
                        {!guide.isActive && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">טיוטה</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
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
                  <div className="px-6 py-8 text-center text-gray-500">
                    אין מדריכים בקטגוריה זו
                    <Link
                      href={`/admin/guides/new?category=${category.id}`}
                      className="text-emerald-600 hover:underline mr-2"
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
      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">צפה בעמוד המדריכים הציבורי</p>
            <Link href="/help" target="_blank" className="text-sm text-blue-600 hover:underline">
              /help ←
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

