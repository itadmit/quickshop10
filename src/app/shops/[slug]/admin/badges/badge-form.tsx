'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBadge, updateBadge, type BadgeFormData } from './actions';
import type { ProductBadge } from '@/lib/db/schema';

interface Category {
  id: string;
  name: string;
}

interface BadgeFormProps {
  storeId: string;
  storeSlug: string;
  categories: Category[];
  badge?: ProductBadge;
}

const positionOptions = [
  { value: 'top-right', label: 'ימין למעלה' },
  { value: 'top-left', label: 'שמאל למעלה' },
  { value: 'bottom-right', label: 'ימין למטה' },
  { value: 'bottom-left', label: 'שמאל למטה' },
];

const appliesToOptions = [
  { value: 'manual', label: 'ידני', description: 'בחירה בעריכת מוצר' },
  { value: 'category', label: 'לפי קטגוריה', description: 'כל מוצרי קטגוריה נבחרת' },
  { value: 'new', label: 'מוצרים חדשים', description: 'אוטומטי למוצרים חדשים' },
  { value: 'featured', label: 'מוצרים מומלצים', description: 'אוטומטי למוצרים מומלצים' },
  { value: 'sale', label: 'מוצרים במבצע', description: 'אוטומטי למוצרים עם מחיר לפני הנחה' },
];

const presetColors = [
  { bg: '#000000', text: '#FFFFFF', label: 'שחור' },
  { bg: '#EF4444', text: '#FFFFFF', label: 'אדום' },
  { bg: '#22C55E', text: '#FFFFFF', label: 'ירוק' },
  { bg: '#3B82F6', text: '#FFFFFF', label: 'כחול' },
  { bg: '#F59E0B', text: '#000000', label: 'צהוב' },
  { bg: '#8B5CF6', text: '#FFFFFF', label: 'סגול' },
  { bg: '#EC4899', text: '#FFFFFF', label: 'ורוד' },
  { bg: '#FFFFFF', text: '#000000', label: 'לבן' },
];

export function BadgeForm({ storeId, storeSlug, categories, badge }: BadgeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [formData, setFormData] = useState<BadgeFormData>({
    name: badge?.name || '',
    text: badge?.text || '',
    backgroundColor: badge?.backgroundColor || '#000000',
    textColor: badge?.textColor || '#FFFFFF',
    position: (badge?.position as BadgeFormData['position']) || 'top-right',
    appliesTo: (badge?.appliesTo as BadgeFormData['appliesTo']) || 'manual',
    categoryIds: (badge?.categoryIds as string[]) || [],
    newProductDays: badge?.newProductDays || 14,
    isActive: badge?.isActive ?? true,
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      let result;
      if (badge) {
        result = await updateBadge(badge.id, storeSlug, formData);
      } else {
        result = await createBadge(storeId, storeSlug, formData);
      }
      
      if (result.success) {
        router.push(`/shops/${storeSlug}/admin/badges`);
      }
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-900">פרטי המדבקה</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  שם (לשימוש פנימי)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="לדוגמה: מדבקת חדש"
                  required
                />
              </div>
              
              {/* Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  טקסט המדבקה
                </label>
                <input
                  type="text"
                  value={formData.text}
                  onChange={e => setFormData({ ...formData, text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="חדש באתר!"
                  maxLength={30}
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Colors Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-900">צבעים</h2>
            
            {/* Preset Colors */}
            <div className="flex flex-wrap gap-2">
              {presetColors.map(preset => (
                <button
                  key={preset.bg}
                  type="button"
                  onClick={() => setFormData({ 
                    ...formData, 
                    backgroundColor: preset.bg, 
                    textColor: preset.text 
                  })}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border-2 transition-all ${
                    formData.backgroundColor === preset.bg 
                      ? 'border-black ring-2 ring-black ring-offset-2' 
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: preset.bg, color: preset.text }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            
            {/* Custom Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">צבע רקע</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.backgroundColor}
                    onChange={e => setFormData({ ...formData, backgroundColor: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={formData.backgroundColor}
                    onChange={e => setFormData({ ...formData, backgroundColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">צבע טקסט</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.textColor}
                    onChange={e => setFormData({ ...formData, textColor: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={formData.textColor}
                    onChange={e => setFormData({ ...formData, textColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Position Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-900">מיקום</h2>
            
            <div className="grid grid-cols-4 gap-2">
              {positionOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, position: option.value as BadgeFormData['position'] })}
                  className={`p-3 text-sm rounded-lg border-2 transition-all ${
                    formData.position === option.value 
                      ? 'border-black bg-black text-white' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Applies To Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-900">אופן החלה</h2>
            
            <div className="grid grid-cols-2 gap-2">
              {appliesToOptions.map(option => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.appliesTo === option.value 
                      ? 'border-black bg-gray-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="appliesTo"
                    value={option.value}
                    checked={formData.appliesTo === option.value}
                    onChange={() => setFormData({ ...formData, appliesTo: option.value as BadgeFormData['appliesTo'] })}
                    className="mt-0.5 w-4 h-4 text-black focus:ring-black"
                  />
                  <div>
                    <span className="font-medium text-gray-900 text-sm">{option.label}</span>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
            
            {/* Category Selection */}
            {formData.appliesTo === 'category' && categories.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">בחר קטגוריות</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.categoryIds.includes(cat.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setFormData({ ...formData, categoryIds: [...formData.categoryIds, cat.id] });
                          } else {
                            setFormData({ ...formData, categoryIds: formData.categoryIds.filter(id => id !== cat.id) });
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                      />
                      <span className="text-sm text-gray-700">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {/* New Product Days */}
            {formData.appliesTo === 'new' && (
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  מוצר נחשב "חדש" במשך כמה ימים?
                </label>
                <input
                  type="number"
                  value={formData.newProductDays}
                  onChange={e => setFormData({ ...formData, newProductDays: parseInt(e.target.value) || 14 })}
                  min={1}
                  max={365}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Preview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">תצוגה מקדימה</h2>
            <div className="relative w-full aspect-square bg-gray-100 rounded-lg border border-gray-200">
              <div 
                className={`absolute ${
                  formData.position === 'top-right' ? 'top-4 right-4' :
                  formData.position === 'top-left' ? 'top-4 left-4' :
                  formData.position === 'bottom-right' ? 'bottom-4 right-4' :
                  'bottom-4 left-4'
                }`}
              >
                <span 
                  className="text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 font-medium"
                  style={{ 
                    backgroundColor: formData.backgroundColor,
                    color: formData.textColor,
                  }}
                >
                  {formData.text || 'טקסט'}
                </span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                תמונת מוצר
              </div>
            </div>
          </div>
          
          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-medium text-gray-900">מדבקה פעילה</span>
                <p className="text-sm text-gray-500">תוצג על מוצרים</p>
              </div>
          <div
            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
            className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${
              formData.isActive ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
                formData.isActive ? 'right-1' : 'left-1'
              }`}
            />
          </div>
            </label>
          </div>
          
          {/* Actions */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isPending || !formData.name || !formData.text}
              className="w-full px-4 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'שומר...' : badge ? 'שמור שינויים' : 'צור מדבקה'}
            </button>
            <Link
              href={`/shops/${storeSlug}/admin/badges`}
              className="block w-full px-4 py-2.5 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ביטול
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
