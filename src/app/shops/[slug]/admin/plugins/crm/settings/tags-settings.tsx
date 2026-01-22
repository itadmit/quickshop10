'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';

// ============================================
// Tags Settings - Client Component
// Manage CRM tags for the store
// ============================================

interface CrmTag {
  id: string;
  label: string;
  color: string;
  isDefault?: boolean;
}

interface TagsSettingsProps {
  storeId: string;
  storeSlug: string;
  initialTags: CrmTag[];
}

const DEFAULT_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#6B7280', // gray
];

export function TagsSettings({ storeId, storeSlug, initialTags }: TagsSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tags, setTags] = useState<CrmTag[]>(initialTags);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    if (!newLabel.trim()) return;
    
    // Check for duplicate
    if (tags.some(t => t.label.toLowerCase() === newLabel.trim().toLowerCase())) {
      setError('תגית עם שם זה כבר קיימת');
      return;
    }

    const newTag: CrmTag = {
      id: nanoid(10),
      label: newLabel.trim(),
      color: newColor,
      isDefault: false,
    };

    setTags([...tags, newTag]);
    setNewLabel('');
    setNewColor(DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)]);
    setError(null);
  };

  const handleRemoveTag = (id: string) => {
    setTags(tags.filter(t => t.id !== id));
  };

  const handleUpdateTag = (id: string, field: keyof CrmTag, value: string) => {
    setTags(tags.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleSave = async () => {
    setError(null);
    setSaved(false);

    startTransition(async () => {
      try {
        const response = await fetch('/api/crm/tags', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeId, tags }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'שגיאה בשמירת התגיות');
        }

        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה בשמירה');
      }
    });
  };

  const handleInitDefaults = () => {
    const defaults: CrmTag[] = [
      { id: 'vip', label: 'VIP', color: '#FFD700', isDefault: true },
      { id: 'new', label: 'חדש', color: '#3B82F6', isDefault: true },
      { id: 'returning', label: 'חוזר', color: '#22C55E', isDefault: true },
      { id: 'problematic', label: 'בעייתי', color: '#EF4444', isDefault: true },
      { id: 'b2b', label: 'B2B', color: '#8B5CF6', isDefault: true },
    ];

    // Only add defaults that don't already exist
    const existingIds = new Set(tags.map(t => t.id));
    const newDefaults = defaults.filter(d => !existingIds.has(d.id));
    
    if (newDefaults.length > 0) {
      setTags([...tags, ...newDefaults]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tags List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">תגיות CRM</h2>
            <p className="text-sm text-slate-500 mt-1">
              הגדר תגיות מותאמות אישית לסיווג לקוחות
            </p>
          </div>
          {tags.length === 0 && (
            <button
              type="button"
              onClick={handleInitDefaults}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              הוסף תגיות ברירת מחדל
            </button>
          )}
        </div>

        <div className="p-6 space-y-4">
          {/* Existing Tags */}
          {tags.length > 0 ? (
            <div className="space-y-3">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center gap-3">
                  {editingId === tag.id ? (
                    <>
                      <input
                        type="text"
                        value={tag.label}
                        onChange={(e) => handleUpdateTag(tag.id, 'label', e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <input
                        type="color"
                        value={tag.color}
                        onChange={(e) => handleUpdateTag(tag.id, 'color', e.target.value)}
                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-xl"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="font-medium text-slate-900">{tag.label}</span>
                        {tag.isDefault && (
                          <span className="text-xs text-slate-400">(ברירת מחדל)</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingId(tag.id)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">
              עדיין לא הוגדרו תגיות
            </p>
          )}

          {/* Add New Tag */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="שם התגית החדשה"
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              הוסף
            </button>
          </div>

          {/* Quick Color Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">צבעים מהירים:</span>
            {DEFAULT_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setNewColor(color)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  newColor === color ? 'border-slate-900 scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
        >
          {isPending ? 'שומר...' : 'שמור שינויים'}
        </button>
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            נשמר בהצלחה
          </span>
        )}
      </div>
    </div>
  );
}

