'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createStoreForUser } from './actions';
import { Loader2 } from 'lucide-react';

interface CreateStoreFormProps {
  userId: string;
  userEmail: string;
}

export function CreateStoreForm({ userId, userEmail }: CreateStoreFormProps) {
  const router = useRouter();
  const [storeName, setStoreName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!storeName.trim()) {
      setError('אנא הזן שם לחנות');
      return;
    }

    // Validate store name - only English letters, numbers, spaces, hyphens, and underscores
    const storeNameRegex = /^[a-zA-Z0-9\s_-]+$/;
    if (!storeNameRegex.test(storeName)) {
      setError('שם החנות יכול להכיל רק אותיות אנגליות, מספרים, רווחים, מקפים ותווים תחתונים');
      return;
    }

    setIsSubmitting(true);

    const result = await createStoreForUser({
      userId,
      userEmail,
      storeName: storeName.trim(),
    });

    if (result.success && result.storeSlug) {
      // Redirect to the new store's admin
      router.push(`/shops/${result.storeSlug}/admin?welcome=true`);
      router.refresh();
    } else {
      setError(result.error || 'שגיאה ביצירת החנות');
      setIsSubmitting(false);
    }
  };

  // Generate slug preview
  const slugPreview = storeName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">
          שם החנות (אנגלית בלבד)
        </label>
        <input
          id="storeName"
          type="text"
          value={storeName}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '' || /^[a-zA-Z0-9\s_-]*$/.test(value)) {
              setStoreName(value);
            }
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-colors"
          placeholder="my-store"
          required
          disabled={isSubmitting}
          autoFocus
        />
        {slugPreview && (
          <p className="mt-1.5 text-xs text-gray-500">
            כתובת החנות: <span className="font-mono text-emerald-600" dir="ltr">/shops/{slugPreview}</span>
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          רק אותיות אנגליות, מספרים, רווחים, מקפים (-) ותווים תחתונים (_)
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !storeName.trim()}
        className="w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            יוצר חנות...
          </>
        ) : (
          'צור חנות'
        )}
      </button>

      {isSubmitting && (
        <p className="text-center text-sm text-gray-500">
          יוצר חנות עם 4 קטגוריות ו-4 מוצרים לדוגמא...
        </p>
      )}
    </form>
  );
}

