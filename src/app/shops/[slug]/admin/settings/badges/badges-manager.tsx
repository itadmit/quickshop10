'use client';

import { useState, useTransition } from 'react';
import { Plus, Pencil, Trash2, Tag, Eye, EyeOff } from 'lucide-react';
import { createBadge, updateBadge, deleteBadge, toggleBadgeStatus, type BadgeFormData } from './actions';
import type { ProductBadge } from '@/lib/db/schema';

interface Category {
  id: string;
  name: string;
}

interface BadgesManagerProps {
  initialBadges: ProductBadge[];
  categories: Category[];
  storeId: string;
  storeSlug: string;
}

const positionLabels = {
  'top-right': 'ימין למעלה',
  'top-left': 'שמאל למעלה',
  'bottom-right': 'ימין למטה',
  'bottom-left': 'שמאל למטה',
};

const appliesToLabels = {
  manual: 'ידני',
  category: 'לפי קטגוריה',
  new: 'מוצרים חדשים',
  featured: 'מוצרים מומלצים',
  sale: 'מוצרים במבצע',
};

export function BadgesManager({ initialBadges, categories, storeId, storeSlug }: BadgesManagerProps) {
  const [badges, setBadges] = useState<ProductBadge[]>(initialBadges);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<ProductBadge | null>(null);
  const [isPending, startTransition] = useTransition();
  
  const handleCreate = () => {
    setEditingBadge(null);
    setIsModalOpen(true);
  };
  
  const handleEdit = (badge: ProductBadge) => {
    setEditingBadge(badge);
    setIsModalOpen(true);
  };
  
  const handleDelete = async (badgeId: string) => {
    if (!confirm('למחוק את המדבקה?')) return;
    
    startTransition(async () => {
      const result = await deleteBadge(badgeId, storeSlug);
      if (result.success) {
        setBadges(badges.filter(b => b.id !== badgeId));
      }
    });
  };
  
  const handleToggleStatus = async (badgeId: string, currentStatus: boolean) => {
    startTransition(async () => {
      const result = await toggleBadgeStatus(badgeId, storeSlug, !currentStatus);
      if (result.success) {
        setBadges(badges.map(b => 
          b.id === badgeId ? { ...b, isActive: !currentStatus } : b
        ));
      }
    });
  };
  
  const handleSave = async (data: BadgeFormData) => {
    startTransition(async () => {
      if (editingBadge) {
        const result = await updateBadge(editingBadge.id, storeSlug, data);
        if (result.success && result.badge) {
          setBadges(badges.map(b => b.id === editingBadge.id ? result.badge! : b));
        }
      } else {
        const result = await createBadge(storeId, storeSlug, data);
        if (result.success && result.badge) {
          setBadges([...badges, result.badge]);
        }
      }
      setIsModalOpen(false);
    });
  };
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏷️ מדבקות</h1>
          <p className="text-gray-500 mt-1">הוסף מדבקות כמו "חדש", "מבצע", "מומלץ" למוצרים</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
        >
          <Plus size={18} />
          מדבקה חדשה
        </button>
      </div>
      
      {/* Badges List */}
      {badges.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300">
          <Tag size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">אין מדבקות עדיין</p>
          <p className="text-gray-400 text-sm">צור מדבקות להדגשת מוצרים</p>
        </div>
      ) : (
        <div className="space-y-3">
          {badges.map(badge => (
            <div 
              key={badge.id}
              className={`flex items-center justify-between p-4 bg-white border ${badge.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}
            >
              <div className="flex items-center gap-4">
                {/* Badge Preview */}
                <span 
                  className="px-3 py-1 text-sm font-medium"
                  style={{ 
                    backgroundColor: badge.backgroundColor,
                    color: badge.textColor,
                  }}
                >
                  {badge.text}
                </span>
                
                <div>
                  <p className="font-medium text-gray-900">{badge.name}</p>
                  <p className="text-sm text-gray-500">
                    {positionLabels[badge.position as keyof typeof positionLabels]} • {appliesToLabels[badge.appliesTo as keyof typeof appliesToLabels]}
                    {badge.appliesTo === 'new' && ` (${badge.newProductDays} ימים)`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStatus(badge.id, badge.isActive)}
                  className={`p-2 rounded ${badge.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                  title={badge.isActive ? 'פעיל - לחץ להשבתה' : 'מושבת - לחץ להפעלה'}
                >
                  {badge.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <button
                  onClick={() => handleEdit(badge)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                  title="עריכה"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(badge.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="מחיקה"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal */}
      {isModalOpen && (
        <BadgeModal
          badge={editingBadge}
          categories={categories}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          isPending={isPending}
        />
      )}
    </div>
  );
}

// Badge Form Modal
interface BadgeModalProps {
  badge: ProductBadge | null;
  categories: Category[];
  onClose: () => void;
  onSave: (data: BadgeFormData) => void;
  isPending: boolean;
}

function BadgeModal({ badge, categories, onClose, onSave, isPending }: BadgeModalProps) {
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  const presetColors = [
    { bg: '#000000', text: '#FFFFFF', label: 'שחור' },
    { bg: '#EF4444', text: '#FFFFFF', label: 'אדום' },
    { bg: '#22C55E', text: '#FFFFFF', label: 'ירוק' },
    { bg: '#3B82F6', text: '#FFFFFF', label: 'כחול' },
    { bg: '#F59E0B', text: '#000000', label: 'צהוב' },
    { bg: '#8B5CF6', text: '#FFFFFF', label: 'סגול' },
  ];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">
            {badge ? 'עריכת מדבקה' : 'מדבקה חדשה'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם (לשימוש פנימי)
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 focus:ring-black focus:border-black"
              placeholder="חדש"
              required
            />
          </div>
          
          {/* Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              טקסט המדבקה
            </label>
            <input
              type="text"
              value={formData.text}
              onChange={e => setFormData({ ...formData, text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 focus:ring-black focus:border-black"
              placeholder="חדש באתר!"
              maxLength={30}
              required
            />
          </div>
          
          {/* Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              צבעים
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {presetColors.map(preset => (
                <button
                  key={preset.bg}
                  type="button"
                  onClick={() => setFormData({ 
                    ...formData, 
                    backgroundColor: preset.bg, 
                    textColor: preset.text 
                  })}
                  className={`px-3 py-1 text-xs font-medium border-2 ${
                    formData.backgroundColor === preset.bg 
                      ? 'border-black' 
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: preset.bg, color: preset.text }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">רקע</label>
                <input
                  type="color"
                  value={formData.backgroundColor}
                  onChange={e => setFormData({ ...formData, backgroundColor: e.target.value })}
                  className="w-full h-10 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">טקסט</label>
                <input
                  type="color"
                  value={formData.textColor}
                  onChange={e => setFormData({ ...formData, textColor: e.target.value })}
                  className="w-full h-10 cursor-pointer"
                />
              </div>
            </div>
          </div>
          
          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מיקום
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(positionLabels).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, position: value as BadgeFormData['position'] })}
                  className={`p-3 text-sm border ${
                    formData.position === value 
                      ? 'border-black bg-black text-white' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Applies To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              אופן החלה
            </label>
            <select
              value={formData.appliesTo}
              onChange={e => setFormData({ ...formData, appliesTo: e.target.value as BadgeFormData['appliesTo'] })}
              className="w-full px-3 py-2 border border-gray-300 focus:ring-black focus:border-black"
            >
              <option value="manual">ידני (בחירה בעריכת מוצר)</option>
              <option value="category">אוטומטי לפי קטגוריה</option>
              <option value="new">אוטומטי למוצרים חדשים</option>
              <option value="featured">אוטומטי למוצרים מומלצים</option>
              <option value="sale">אוטומטי למוצרים במבצע</option>
            </select>
          </div>
          
          {/* Category Selection (if applies_to = category) */}
          {formData.appliesTo === 'category' && categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                קטגוריות
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 p-2 space-y-1">
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1">
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
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          {/* New Product Days (if applies_to = new) */}
          {formData.appliesTo === 'new' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                מוצר נחשב "חדש" במשך כמה ימים?
              </label>
              <input
                type="number"
                value={formData.newProductDays}
                onChange={e => setFormData({ ...formData, newProductDays: parseInt(e.target.value) || 14 })}
                min={1}
                max={365}
                className="w-full px-3 py-2 border border-gray-300 focus:ring-black focus:border-black"
              />
            </div>
          )}
          
          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              תצוגה מקדימה
            </label>
            <div className="relative w-48 h-48 bg-gray-100 border">
              <div 
                className={`absolute ${
                  formData.position === 'top-right' ? 'top-2 right-2' :
                  formData.position === 'top-left' ? 'top-2 left-2' :
                  formData.position === 'bottom-right' ? 'bottom-2 right-2' :
                  'bottom-2 left-2'
                }`}
              >
                <span 
                  className="px-2 py-1 text-xs font-medium"
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
          
          {/* Active Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">מדבקה פעילה</span>
          </label>
          
          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isPending || !formData.name || !formData.text}
              className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'שומר...' : badge ? 'שמור שינויים' : 'צור מדבקה'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

