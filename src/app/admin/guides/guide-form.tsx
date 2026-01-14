'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGuide, updateGuide } from './actions';
import { HelpGuide, HelpGuideCategory } from '@/lib/db/schema';
import { Eye } from 'lucide-react';

interface Props {
  guide?: HelpGuide;
  categories: HelpGuideCategory[];
  defaultCategoryId?: string;
}

export function GuideForm({ guide, categories, defaultCategoryId }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: guide?.categoryId || defaultCategoryId || categories[0]?.id || '',
    slug: guide?.slug || '',
    title: guide?.title || '',
    description: guide?.description || '',
    content: guide?.content || `## כותרת ראשית

### שלב 1: הוראות
הסבר מפורט על השלב הראשון...

### שלב 2: המשך
- נקודה ראשונה
- נקודה שנייה
- נקודה שלישית

### טיפים
מידע נוסף שיעזור ללקוחות...`,
    sortOrder: guide?.sortOrder || 0,
    isActive: guide?.isActive ?? true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

    try {
      if (guide) {
        await updateGuide(guide.id, formData);
      } else {
        await createGuide(formData);
      }
      router.push('/admin/guides');
    } catch (error) {
      console.error(error);
      setPending(false);
    }
  }

  // Simple markdown preview
  const previewHtml = formData.content
    .split('\n')
    .map((line) => {
      if (line.startsWith('## ')) {
        return `<h2 class="text-2xl font-bold text-gray-900 mt-6 mb-3">${line.slice(3)}</h2>`;
      }
      if (line.startsWith('### ')) {
        return `<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2">${line.slice(4)}</h3>`;
      }
      if (line.startsWith('- **')) {
        const match = line.match(/- \*\*(.+?)\*\* - (.+)/);
        if (match) {
          return `<li class="mb-1"><strong>${match[1]}</strong> - ${match[2]}</li>`;
        }
      }
      if (line.startsWith('- ')) {
        return `<li class="mb-1">${line.slice(2)}</li>`;
      }
      if (line.match(/^\d+\. /)) {
        return `<li class="mb-1">${line.replace(/^\d+\. /, '')}</li>`;
      }
      if (line.trim() === '') return '';
      return `<p class="mb-3 text-gray-700">${line}</p>`;
    })
    .join('');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">קטגוריה</label>
          <select
            required
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.title}
              </option>
            ))}
          </select>
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
            placeholder="לדוגמה: הצעדים הראשונים"
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
            placeholder="first-steps"
            dir="ltr"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">תיאור קצר (מוצג ברשימה)</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="איך להקים חנות ולהתחיל למכור"
          />
        </div>
      </div>

      {/* Content Editor */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <span className="font-medium text-gray-900">תוכן המדריך (Markdown)</span>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'עריכה' : 'תצוגה מקדימה'}
          </button>
        </div>
        
        {showPreview ? (
          <div 
            className="p-6 prose prose-gray max-w-none min-h-[400px]"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        ) : (
          <textarea
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full h-[400px] p-4 border-0 focus:ring-0 font-mono text-sm resize-none"
            placeholder="## כותרת&#10;&#10;תוכן..."
            dir="rtl"
          />
        )}
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Sort Order */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">סדר תצוגה:</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>

            {/* Active */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">פרסם (מוצג בעמוד המדריכים)</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {pending ? 'שומר...' : guide ? 'עדכון' : 'יצירה'}
            </button>
          </div>
        </div>
      </div>

      {/* Markdown Help */}
      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-700 mb-2">פורמט Markdown:</p>
        <div className="grid grid-cols-2 gap-4 font-mono text-xs">
          <div>## כותרת ראשית</div>
          <div>### כותרת משנית</div>
          <div>- נקודה ברשימה</div>
          <div>1. רשימה ממוספרת</div>
          <div>- **מודגש** - הסבר</div>
          <div>שורת פסקה רגילה</div>
        </div>
      </div>
    </form>
  );
}

