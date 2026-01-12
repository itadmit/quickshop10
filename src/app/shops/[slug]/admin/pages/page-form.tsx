'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPage, updatePage } from './actions';

interface PageFormProps {
  storeId: string;
  slug: string;
  pageId?: string;
  initialData?: {
    title: string;
    slug: string;
    content: string;
    isPublished: boolean;
    seoTitle?: string;
    seoDescription?: string;
  };
}

export function PageForm({ storeId, slug, pageId, initialData }: PageFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showSeo, setShowSeo] = useState(false);

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    content: initialData?.content || '', // Content will be edited in visual editor
    isPublished: initialData?.isPublished || false,
    seoTitle: initialData?.seoTitle || '',
    seoDescription: initialData?.seoDescription || '',
  });

  // For new pages, go directly to editor after creation
  const isNewPage = !pageId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('יש להזין כותרת');
      return;
    }

    if (!formData.slug.trim()) {
      setError('יש להזין כתובת URL');
      return;
    }

    startTransition(async () => {
      const result = pageId
        ? await updatePage(pageId, slug, formData)
        : await createPage(storeId, slug, formData);

      if (result.success) {
        if (!pageId && 'pageSlug' in result && result.pageSlug) {
          // New page created - go to visual editor
          router.push(`/shops/${slug}/editor?page=pages/${result.pageSlug}`);
        } else {
          router.refresh();
        }
      } else {
        setError(result.error || 'שגיאה בשמירת העמוד');
      }
    });
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      // Auto-generate slug from title if slug is empty or matches previous auto-generated slug
      slug: prev.slug === '' || prev.slug === slugify(prev.title) ? slugify(title) : prev.slug,
    }));
  };

  const slugify = (text: string) => {
    return text
      .trim()
      // Replace spaces and common punctuation with dash
      .replace(/[\s\u200B-\u200D\uFEFF\u00A0\u2000-\u200A\u2028\u2029]+/g, '-') // All types of spaces
      .replace(/[.,;:!?()[\]{}'"`~@#$%^&*+=|\\<>\/]+/g, '-') // Punctuation marks
      // Remove control characters and other problematic characters, but keep Hebrew and other Unicode letters
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Control characters
      // Clean up multiple dashes
      .replace(/-+/g, '-')
      // Remove leading/trailing dashes
      .replace(/^-+|-+$/g, '');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            כותרת *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
            placeholder="אודותינו"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            כתובת URL *
          </label>
          <div className="flex">
            <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-200 rounded-r-lg text-gray-500 text-sm">
              /
            </span>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-black/5"
              placeholder="about"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* Content - Only show for existing pages */}
      {pageId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            תוכן
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={15}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm"
            placeholder="<h2>כותרת</h2>&#10;<p>תוכן העמוד...</p>"
            dir="ltr"
          />
          <p className="text-xs text-gray-500 mt-1">
            ניתן להשתמש ב-HTML לעיצוב התוכן
          </p>
        </div>
      )}

      {/* Info for new pages */}
      {!pageId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="text-blue-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-blue-700">
              לאחר יצירת העמוד, תועברו לעורך הויזואלי להוספת תוכן וסקשנים.
            </p>
          </div>
        </div>
      )}

      {/* SEO Settings */}
      <div>
        <button
          type="button"
          onClick={() => setShowSeo(!showSeo)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {showSeo ? '- הסתר הגדרות SEO' : '+ הגדרות SEO'}
        </button>
        
        {showSeo && (
          <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                כותרת SEO
              </label>
              <input
                type="text"
                value={formData.seoTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                placeholder="כותרת שתוצג בתוצאות החיפוש"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                תיאור SEO
              </label>
              <textarea
                value={formData.seoDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                placeholder="תיאור קצר שיופיע בתוצאות החיפוש"
              />
            </div>
          </div>
        )}
      </div>

      {/* Publish Toggle */}
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isPublished}
            onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
        </label>
        <span className="text-sm text-gray-700">
          {formData.isPublished ? 'פורסם - העמוד נגיש לציבור' : 'טיוטה - העמוד לא מפורסם'}
        </span>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium"
        >
          {isPending ? 'שומר...' : pageId ? 'שמור שינויים' : 'צור עמוד'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/shops/${slug}/admin/pages`)}
          className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}

