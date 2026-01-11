'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateCategory, deleteCategory } from '../actions';

// Server upload for WebP conversion
async function uploadToServer(
  file: File,
  options: { folder?: string; tags?: string[]; storeId?: string } = {}
): Promise<{ secure_url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (options.folder) formData.append('folder', options.folder);
  if (options.tags) formData.append('tags', options.tags.join(','));
  if (options.storeId) formData.append('storeId', options.storeId);

  const response = await fetch('/api/upload', {
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
  hideOutOfStock: boolean;
  moveOutOfStockToBottom: boolean;
}

interface ParentCategory {
  id: string;
  name: string;
  parentId: string | null;
}

interface CategoryEditFormProps {
  category: Category;
  allCategories: ParentCategory[];
  storeId: string;
  storeSlug: string;
}

export function CategoryEditForm({ category, allCategories, storeId, storeSlug }: CategoryEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: category.name,
    slug: category.slug,
    description: category.description || '',
    imageUrl: category.imageUrl || '',
    isActive: category.isActive,
    sortOrder: category.sortOrder ?? 0,
    parentId: category.parentId || '',
    hideOutOfStock: category.hideOutOfStock ?? false,
    moveOutOfStockToBottom: category.moveOutOfStockToBottom ?? true,
  });

  // Filter available parents
  const availableParents = allCategories.filter(c => {
    if (c.id === category.id) return false;
    if (c.parentId === category.id) return false;
    return c.parentId === null;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const data = {
          ...formData,
          parentId: formData.parentId || null,
        };
        
        const result = await updateCategory(category.id, data);
        if (result.error) {
          setError(result.error);
          return;
        }
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } catch {
        setError('אירעה שגיאה. נסה שוב.');
      }
    });
  };

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק קטגוריה זו? פעולה זו בלתי הפיכה.')) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteCategory(category.id);
        if (result.error) {
          setError(result.error);
          return;
        }
        router.push(`/shops/${storeSlug}/admin/categories`);
      } catch {
        setError('אירעה שגיאה במחיקה');
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('נא להעלות קובץ תמונה בלבד');
      return;
    }

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
        storeId,
      });

      setFormData(prev => ({ ...prev, imageUrl: result.secure_url }));
    } catch (err) {
      console.error('Upload failed:', err);
      setError('העלאת התמונה נכשלה. נסה שוב.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">פרטי קטגוריה</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
            השינויים נשמרו בהצלחה
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
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                className="absolute top-2 left-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
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
                  <svg className="w-6 h-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-xs text-gray-500 mt-1">מעלה...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-gray-500 mt-1">לחץ להעלאה</span>
                </div>
              )}
            </label>
          )}
        </div>

        {/* Parent Category */}
        {availableParents.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריית אב</label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none bg-white"
            >
              <option value="">ללא (קטגוריה ראשית)</option>
              {availableParents.map(parent => (
                <option key={parent.id} value={parent.id}>{parent.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם הקטגוריה *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">סלאג (URL)</label>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">/category/</span>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                slug: e.target.value.replace(/\s+/g, '-').replace(/-+/g, '-')
              }))}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none"
              dir="auto"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none resize-none"
          />
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">סדר תצוגה</label>
          <input
            type="number"
            value={formData.sortOrder}
            onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
            className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none"
            min="0"
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              formData.isActive ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                formData.isActive ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
          <span className="text-sm text-gray-700">
            {formData.isActive ? 'קטגוריה פעילה' : 'קטגוריה מוסתרת'}
          </span>
        </div>

        {/* Out of Stock Settings */}
        <div className="pt-4 border-t border-gray-200 space-y-3">
          <h3 className="text-sm font-medium text-gray-900">הגדרות מוצרים שאזלו מהמלאי</h3>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.moveOutOfStockToBottom}
              onChange={(e) => setFormData(prev => ({ ...prev, moveOutOfStockToBottom: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span className="text-sm text-gray-700">הזז מוצרים שאזלו לסוף הרשימה</span>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hideOutOfStock}
              onChange={(e) => setFormData(prev => ({ ...prev, hideOutOfStock: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span className="text-sm text-gray-700">הסתר מוצרים שאזלו מעמוד הקטגוריה</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isPending || isUploading}
            className="flex-1 py-2 px-4 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium"
          >
            {isPending ? 'שומר...' : 'שמור שינויים'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="py-2 px-4 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            מחק
          </button>
        </div>
      </form>
    </div>
  );
}

