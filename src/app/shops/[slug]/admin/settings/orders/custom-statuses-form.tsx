'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { Plus, Trash2, GripVertical, Tag } from 'lucide-react';
import { updateCustomOrderStatuses } from './actions';

// ============================================
// Custom Order Statuses Management
// Allows stores to define workflow statuses like:
// - הועבר למתפרה
// - בתפירה  
// - בהכנה
// ============================================

interface CustomStatus {
  id: string;
  name: string;
  color: string;
}

interface CustomStatusesFormProps {
  storeId: string;
  storeSlug: string;
  initialStatuses: CustomStatus[];
}

// Predefined color options
const COLOR_OPTIONS = [
  { value: '#6366f1', name: 'סגול' },
  { value: '#8b5cf6', name: 'סגול בהיר' },
  { value: '#ec4899', name: 'ורוד' },
  { value: '#f43f5e', name: 'אדום' },
  { value: '#f97316', name: 'כתום' },
  { value: '#eab308', name: 'צהוב' },
  { value: '#22c55e', name: 'ירוק' },
  { value: '#14b8a6', name: 'טורקיז' },
  { value: '#0ea5e9', name: 'כחול' },
  { value: '#6b7280', name: 'אפור' },
];

export function CustomStatusesForm({ storeId, storeSlug, initialStatuses }: CustomStatusesFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  
  const [statuses, setStatuses] = useState<CustomStatus[]>(initialStatuses);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState(COLOR_OPTIONS[0].value);

  const handleAddStatus = () => {
    if (!newStatusName.trim()) return;
    
    const newStatus: CustomStatus = {
      id: nanoid(8),
      name: newStatusName.trim(),
      color: newStatusColor,
    };
    
    setStatuses(prev => [...prev, newStatus]);
    setNewStatusName('');
    setNewStatusColor(COLOR_OPTIONS[0].value);
  };

  const handleRemoveStatus = (id: string) => {
    setStatuses(prev => prev.filter(s => s.id !== id));
  };

  const handleUpdateStatus = (id: string, updates: Partial<CustomStatus>) => {
    setStatuses(prev => prev.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);

    startTransition(async () => {
      const result = await updateCustomOrderStatuses(storeId, storeSlug, statuses);
      if (result.success) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Section */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">סטטוסים מותאמים להזמנות</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            הגדר סטטוסים מותאמים אישית לניהול תהליך העבודה שלך (למשל: הועבר למתפרה, בתפירה, בהכנה)
          </p>
        </div>
        
        <div className="p-5">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-blue-800 font-medium">איך זה עובד?</p>
                <p className="text-sm text-blue-700 mt-1">
                  סטטוסים מותאמים מאפשרים לך לעקוב אחרי שלבי תהליך העבודה הייחודיים שלך.
                  הסטטוסים האלה מוצגים בנוסף לסטטוסי ברירת המחדל (שולם, נשלח וכו׳).
                </p>
              </div>
            </div>
          </div>

          {/* Existing Statuses */}
          {statuses.length > 0 && (
            <div className="space-y-3 mb-5">
              <h3 className="text-sm font-medium text-gray-700">סטטוסים קיימים ({statuses.length})</h3>
              <div className="space-y-2">
                {statuses.map((status, index) => (
                  <div 
                    key={status.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 group"
                  >
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                    
                    {/* Color Picker */}
                    <div className="relative">
                      <select
                        value={status.color}
                        onChange={(e) => handleUpdateStatus(status.id, { color: e.target.value })}
                        className="appearance-none w-8 h-8 rounded-full cursor-pointer border-2 border-white shadow-sm"
                        style={{ backgroundColor: status.color }}
                      >
                        {COLOR_OPTIONS.map(color => (
                          <option key={color.value} value={color.value}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Status Name */}
                    <input
                      type="text"
                      value={status.name}
                      onChange={(e) => handleUpdateStatus(status.id, { name: e.target.value })}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm"
                    />
                    
                    {/* Preview Badge */}
                    <span 
                      className="px-2.5 py-1 text-xs font-medium rounded-full text-white"
                      style={{ backgroundColor: status.color }}
                    >
                      {status.name}
                    </span>
                    
                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveStatus(status.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Status */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-medium text-gray-700 mb-3">הוסף סטטוס חדש</h3>
            <div className="flex items-center gap-3">
              {/* Color Selector */}
              <div className="flex gap-1">
                {COLOR_OPTIONS.slice(0, 6).map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setNewStatusColor(color.value)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      newStatusColor === color.value 
                        ? 'border-gray-900 scale-110' 
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              
              {/* Name Input */}
              <input
                type="text"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                placeholder="שם הסטטוס (למשל: בהכנה)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStatus())}
              />
              
              {/* Add Button */}
              <button
                type="button"
                onClick={handleAddStatus}
                disabled={!newStatusName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                הוסף
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Empty State */}
      {statuses.length === 0 && (
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-700 mb-1">עדיין לא הגדרת סטטוסים מותאמים</h3>
          <p className="text-sm text-gray-500 mb-4">
            הוסף סטטוסים כדי לעקוב אחרי שלבי תהליך העבודה שלך
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
            <span>דוגמאות:</span>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">הועבר למתפרה</span>
            <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded">בתפירה</span>
            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">בהכנה</span>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">מוכן לאיסוף</span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium"
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
    </form>
  );
}

