'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCategory, updateCategory } from './actions';

// Server upload for WebP conversion + signed upload + save to media library
async function uploadToServer(
  file: File,
  options: { folder?: string; tags?: string[]; storeId?: string } = {}
): Promise<{ secure_url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (options.folder) formData.append('folder', options.folder);
  if (options.tags) formData.append('tags', options.tags.join(','));
  if (options.storeId) formData.append('storeId', options.storeId);

  const response = await fetch('/api/upload-blob', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number | null;
  parentId: string | null;
}

interface ParentCategory {
  id: string;
  name: string;
  parentId: string | null;
}

interface CategoryFormProps {
  storeId: string;
  storeSlug: string;
  mode: 'create' | 'edit';
  category?: Category;
  allCategories?: ParentCategory[];
}

export function CategoryForm({ storeId, storeSlug, mode, category, allCategories = [] }: CategoryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    imageUrl: category?.imageUrl || '',
    isActive: category?.isActive ?? true,
    sortOrder: category?.sortOrder ?? 0,
    parentId: category?.parentId || '',
  });

  // Filter out the current category and its children from parent options
  const availableParents = allCategories.filter(c => {
    if (mode === 'edit' && category) {
      // Can't select self or children as parent
      if (c.id === category.id) return false;
      // Check if this category has current category as parent (it's a child)
      if (c.parentId === category.id) return false;
    }
    // Only show top-level categories as potential parents
    return c.parentId === null;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const data = {
          ...formData,
          parentId: formData.parentId || null,
        };
        
        if (mode === 'create') {
          const result = await createCategory(storeId, data);
          if (result.error) {
            setError(result.error);
            return;
          }
        } else if (category) {
          const result = await updateCategory(category.id, data);
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
      .replace(/[\s\u200B-\u200D\uFEFF\u00A0\u2000-\u200A\u2028\u2029]+/g, '-')
      .replace(/[.,;:!?()[\]{}'"`~@#$%^&*+=|\\<>\/]+/g, '-')
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: mode === 'create' ? generateSlug(name) : prev.slug,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('נא להעלות קובץ תמונה בלבד');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('גודל הקובץ המקסימלי הוא 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadToServer(file, {
        folder: `quickshop/stores/${storeSlug}`,
        tags: ['quickshop', 'category', storeSlug],
        storeId, // Save to media library
      });

      setFormData(prev => ({ ...prev, imageUrl: result.secure_url }));
    } catch (err) {
      console.error('Upload failed:', err);
      setError('העלאת התמונה נכשלה. נסה שוב.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
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
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 text-right modal-scroll max-h-[90vh] overflow-y-auto">
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

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תמונת קטגוריה
                  </label>
                  {formData.imageUrl ? (
                    <div className="relative">
                      <img
                        src={formData.imageUrl}
                        alt="תצוגה מקדימה"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 left-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      isUploading ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                      {isUploading ? (
                        <div className="flex flex-col items-center">
                          <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span className="text-sm text-gray-500 mt-2">מעלה תמונה...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-500 mt-2">לחץ להעלאת תמונה</span>
                          <span className="text-xs text-gray-400 mt-1">JPG, PNG עד 5MB</span>
                        </div>
                      )}
                    </label>
                  )}
                </div>

                {/* Parent Category */}
                {availableParents.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      קטגוריית אב
                    </label>
                    <select
                      value={formData.parentId}
                      onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors bg-white"
                    >
                      <option value="">ללא (קטגוריה ראשית)</option>
                      {availableParents.map(parent => (
                        <option key={parent.id} value={parent.id}>
                          {parent.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">בחר קטגוריית אב כדי ליצור תת-קטגוריה</p>
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
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        slug: e.target.value.replace(/\s+/g, '-').replace(/-+/g, '-')
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                      placeholder="נשים"
                      dir="auto"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">ניתן להשתמש בעברית. רווחים יוחלפו ב-</p>
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
                    disabled={isPending || isUploading}
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
