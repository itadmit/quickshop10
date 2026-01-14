'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCategory, updateCategory } from '../actions';
import { HelpGuideCategory } from '@/lib/db/schema';

const ICONS = ['🚀', '📦', '🏷️', '📣', '🎨', '⚙️', '🧩', '📚', '💡', '🔧', '📱', '💳'];

interface Props {
  category?: HelpGuideCategory;
}

export function CategoryForm({ category }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formData, setFormData] = useState({
    slug: category?.slug || '',
    title: category?.title || '',
    description: category?.description || '',
    icon: category?.icon || '📁',
    sortOrder: category?.sortOrder || 0,
    isActive: category?.isActive ?? true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

    try {
      if (category) {
        await updateCategory(category.id, formData);
      } else {
        await createCategory(formData);
      }
      router.push('/admin/guides');
    } catch (error) {
      console.error(error);
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      {/* Icon */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">אייקון</label>
        <div className="flex gap-2 flex-wrap">
          {ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setFormData({ ...formData, icon })}
              className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors ${
                formData.icon === icon
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">כותרת</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="לדוגמה: התחלה מהירה"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Slug (לכתובת URL)</label>
        <input
          type="text"
          required
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
          placeholder="getting-started"
          dir="ltr"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">תיאור קצר</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="הצעדים הראשונים לפתיחת החנות שלכם"
        />
      </div>

      {/* Sort Order */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">סדר תצוגה</label>
        <input
          type="number"
          value={formData.sortOrder}
          onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
          className="w-24 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Active */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        <label htmlFor="isActive" className="text-sm text-gray-700">
          פעיל (מוצג בעמוד המדריכים)
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {pending ? 'שומר...' : category ? 'עדכון' : 'יצירה'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}

