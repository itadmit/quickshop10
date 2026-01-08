'use client';

/**
 * Loyalty Tiers List & Management
 * 
 * Client Component - לניהול רמות עם דיאלוגים
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createLoyaltyTier, updateLoyaltyTier, deleteLoyaltyTier } from '@/lib/actions/loyalty';
import type { LoyaltyTier } from '@/lib/db/schema-loyalty';
import { Plus, Pencil, Trash2, Star, Gift, Truck, X, User, Award, Crown, Gem, Flame, Sparkles, Medal, Trophy, Zap, Heart } from 'lucide-react';

interface Props {
  tiers: LoyaltyTier[];
  programId: string;
  storeSlug: string;
  progressionType: 'total_spent' | 'total_orders' | 'points_earned';
}

// Icon options for tiers - using Lucide icon names
const TIER_ICON_OPTIONS = [
  { id: 'user', icon: User, label: 'משתמש' },
  { id: 'medal', icon: Medal, label: 'מדליה' },
  { id: 'award', icon: Award, label: 'פרס' },
  { id: 'trophy', icon: Trophy, label: 'גביע' },
  { id: 'gem', icon: Gem, label: 'יהלום' },
  { id: 'crown', icon: Crown, label: 'כתר' },
  { id: 'star', icon: Star, label: 'כוכב' },
  { id: 'sparkles', icon: Sparkles, label: 'נצנוצים' },
  { id: 'zap', icon: Zap, label: 'ברק' },
  { id: 'flame', icon: Flame, label: 'אש' },
];
const TIER_COLORS = ['#6B7280', '#CD7F32', '#C0C0C0', '#FFD700', '#E5E4E2', '#B9F2FF', '#9966CC', '#FF69B4'];

// Helper to render tier icon
function TierIcon({ iconId, className = "w-4 h-4" }: { iconId: string | null; className?: string }) {
  const iconOption = TIER_ICON_OPTIONS.find(opt => opt.id === iconId);
  if (iconOption) {
    const IconComponent = iconOption.icon;
    return <IconComponent className={className} />;
  }
  // Default to User icon
  return <User className={className} />;
}

export function LoyaltyTiersList({ tiers, programId, storeSlug, progressionType }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const progressionLabel = {
    total_spent: '₪',
    total_orders: 'הזמנות',
    points_earned: 'נקודות',
  }[progressionType];
  
  const handleDelete = async (tier: LoyaltyTier) => {
    if (tier.isDefault) {
      setError('לא ניתן למחוק רמת ברירת מחדל');
      return;
    }
    
    if (!confirm(`למחוק את רמת "${tier.name}"?`)) return;
    
    startTransition(async () => {
      const result = await deleteLoyaltyTier(tier.id, storeSlug);
      if (!result.success) {
        setError(result.error || 'שגיאה במחיקה');
      }
      router.refresh();
    });
  };
  
  return (
    <div>
      {error && (
        <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
          <button onClick={() => setError(null)} className="float-left">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Tiers Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">רמה</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">מינימום {progressionLabel}</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">הנחה</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">מכפיל נקודות</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">משלוח חינם</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tiers.map((tier) => (
              <tr key={tier.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: tier.color }}
                    >
                      <TierIcon iconId={tier.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{tier.name}</p>
                      {tier.isDefault && (
                        <span className="text-xs text-gray-500">ברירת מחדל</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {Number(tier.minValue).toLocaleString('he-IL')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {Number(tier.discountPercentage) > 0 ? `${tier.discountPercentage}%` : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  ×{tier.pointsMultiplier}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {tier.freeShippingThreshold 
                    ? `מעל ₪${Number(tier.freeShippingThreshold).toLocaleString('he-IL')}`
                    : '-'
                  }
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingTier(tier)}
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {!tier.isDefault && (
                      <button
                        onClick={() => handleDelete(tier)}
                        disabled={isPending}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Add Tier Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          הוסף רמה
        </button>
      </div>
      
      {/* Edit/Create Modal */}
      {(editingTier || isCreating) && (
        <TierModal
          tier={editingTier}
          programId={programId}
          storeSlug={storeSlug}
          progressionType={progressionType}
          nextLevel={tiers.length + 1}
          onClose={() => {
            setEditingTier(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}

// ============ Tier Modal ============

interface TierModalProps {
  tier: LoyaltyTier | null;
  programId: string;
  storeSlug: string;
  progressionType: 'total_spent' | 'total_orders' | 'points_earned';
  nextLevel: number;
  onClose: () => void;
}

function TierModal({ tier, programId, storeSlug, progressionType, nextLevel, onClose }: TierModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: tier?.name || '',
    slug: tier?.slug || '',
    level: tier?.level || nextLevel,
    color: tier?.color || TIER_COLORS[nextLevel % TIER_COLORS.length],
    icon: tier?.icon || TIER_ICON_OPTIONS[nextLevel % TIER_ICON_OPTIONS.length].id,
    minValue: tier?.minValue || '0',
    pointsMultiplier: tier?.pointsMultiplier || '1.0',
    discountPercentage: tier?.discountPercentage || '0',
    freeShippingThreshold: tier?.freeShippingThreshold || '',
    description: tier?.description || '',
    benefitsList: (tier?.benefitsList as string[]) || [],
  });
  
  const [newBenefit, setNewBenefit] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.name.trim()) {
      setError('שם הרמה הוא שדה חובה');
      return;
    }
    
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');
    
    startTransition(async () => {
      if (tier) {
        // Update - slug is not updatable
        const result = await updateLoyaltyTier(tier.id, storeSlug, {
          name: formData.name,
          color: formData.color,
          icon: formData.icon,
          minValue: formData.minValue,
          pointsMultiplier: formData.pointsMultiplier,
          discountPercentage: formData.discountPercentage,
          description: formData.description,
          benefitsList: formData.benefitsList,
          freeShippingThreshold: formData.freeShippingThreshold || null,
        });
        if (!result.success) {
          setError('שגיאה בעדכון הרמה');
          return;
        }
      } else {
        // Create
        const result = await createLoyaltyTier(programId, storeSlug, {
          ...formData,
          slug,
          freeShippingThreshold: formData.freeShippingThreshold || undefined,
        });
        if (!result.success) {
          setError('שגיאה ביצירת הרמה');
          return;
        }
      }
      
      router.refresh();
      onClose();
    });
  };
  
  const addBenefit = () => {
    if (newBenefit.trim()) {
      setFormData(prev => ({
        ...prev,
        benefitsList: [...prev.benefitsList, newBenefit.trim()],
      }));
      setNewBenefit('');
    }
  };
  
  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefitsList: prev.benefitsList.filter((_, i) => i !== index),
    }));
  };
  
  const progressionLabel = {
    total_spent: 'סכום מינימלי (₪)',
    total_orders: 'מספר הזמנות מינימלי',
    points_earned: 'נקודות מינימליות',
  }[progressionType];
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {tier ? 'עריכת רמה' : 'רמה חדשה'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name & Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם הרמה *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="זהב"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">רמה</label>
              <input
                type="number"
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ ...prev, level: Number(e.target.value) }))}
                disabled={!!tier}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>
          
          {/* Color & Icon */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">צבע</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <div className="flex gap-1 flex-wrap">
                  {TIER_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-6 h-6 rounded-full border-2 ${formData.color === color ? 'border-gray-900' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">אייקון</label>
              <div className="flex gap-1 flex-wrap">
                {TIER_ICON_OPTIONS.map(({ id, icon: IconComponent }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon: id }))}
                    className={`w-8 h-8 rounded flex items-center justify-center ${
                      formData.icon === id ? 'bg-gray-200 ring-2 ring-gray-900' : 'hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Min Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{progressionLabel}</label>
            <input
              type="number"
              value={formData.minValue}
              onChange={(e) => setFormData(prev => ({ ...prev, minValue: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          
          {/* Benefits */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">הנחה קבועה (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.discountPercentage}
                onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מכפיל נקודות</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.pointsMultiplier}
                onChange={(e) => setFormData(prev => ({ ...prev, pointsMultiplier: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">משלוח חינם מעל</label>
              <input
                type="number"
                value={formData.freeShippingThreshold}
                onChange={(e) => setFormData(prev => ({ ...prev, freeShippingThreshold: e.target.value }))}
                placeholder="ללא"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Benefits List */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">רשימת הטבות (לתצוגה)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                placeholder="הוסף הטבה..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addBenefit}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.benefitsList.map((benefit, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
                >
                  {benefit}
                  <button
                    type="button"
                    onClick={() => removeBenefit(index)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'שומר...' : tier ? 'שמור שינויים' : 'צור רמה'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

