'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCategory, updateCategory } from './actions';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number | null;
}

interface CategoryFormProps {
  storeId: string;
  mode: 'create' | 'edit';
  category?: Category;
}

export function CategoryForm({ storeId, mode, category }: CategoryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    imageUrl: category?.imageUrl || '',
    isActive: category?.isActive ?? true,
    sortOrder: category?.sortOrder ?? 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        if (mode === 'create') {
          const result = await createCategory(storeId, formData);
          if (result.error) {
            setError(result.error);
            return;
          }
        } else if (category) {
          const result = await updateCategory(category.id, formData);
          if (result.error) {
            setError(result.error);
            return;
          }
        }
        setIsOpen(false);
        router.refresh();
      } catch {
        setError('אירעה שגיאה. נסה שוב.');
      }
    });
  };

  const generateSlug = (name: string) => {
    return name
      .trim()
      .replace(/[\s\u200B-\u200D\uFEFF\u00A0\u2000-\u200A\u2028\u2029]+/g, '-') // All types of spaces
      .replace(/[.,;:!?()[\]{}'"`~@#$%^&*+=|\\<>\/]+/g, '-') // Punctuation marks
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Control characters
      .replace(/-+/g, '-') // Clean up multiple dashes
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: mode === 'create' ? generateSlug(name) : prev.slug,
    }));
  };

  return (
    <>
      {/* Trigger Button */}
      {mode === 'create' ? (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          קטגוריה חדשה
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="ערוך"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
          <div className="fixed inset-0 bg-black/50 cursor-pointer" onClick={() => setIsOpen(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 text-right modal-scroll">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {mode === 'create' ? 'קטגוריה חדשה' : 'עריכת קטגוריה'}
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם הקטגוריה *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                    placeholder="לדוגמה: נשים"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    סלאג (URL)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">/category/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                      placeholder="women"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תיאור
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors resize-none"
                    placeholder="תיאור קצר של הקטגוריה"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    כתובת תמונה
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                    placeholder="https://..."
                    dir="ltr"
                  />
                  {formData.imageUrl && (
                    <img
                      src={formData.imageUrl}
                      alt="תצוגה מקדימה"
                      className="mt-2 w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    סדר תצוגה
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">מספר נמוך יותר = מוצג קודם</p>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      formData.isActive ? 'bg-black' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        formData.isActive ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-700">
                    {formData.isActive ? 'קטגוריה פעילה' : 'קטגוריה מוסתרת'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-2.5 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium"
                  >
                    {isPending ? 'שומר...' : mode === 'create' ? 'צור קטגוריה' : 'שמור שינויים'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

