'use client';

/**
 * Loyalty Settings Form
 * 
 * Client Component - רק לצורך טפסים אינטראקטיביים
 * Optimistic UI - עדכון מיידי של הממשק
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateLoyaltyProgram } from '@/lib/actions/loyalty';
import type { LoyaltyProgram } from '@/lib/db/schema-loyalty';

interface Props {
  program: LoyaltyProgram;
  storeSlug: string;
}

export function LoyaltySettingsForm({ program, storeSlug }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticEnabled, setOptimisticEnabled] = useState(program.isEnabled);
  
  // Form state
  const [formData, setFormData] = useState({
    name: program.name,
    isEnabled: program.isEnabled,
    pointsEnabled: program.pointsEnabled,
    pointsPerIls: program.pointsPerIls,
    pointsRedemptionRate: program.pointsRedemptionRate,
    minPointsToRedeem: program.minPointsToRedeem,
    pointsExpireDays: program.pointsExpireDays,
    progressionType: program.progressionType,
    showProgressBar: program.showProgressBar,
    showPointsInHeader: program.showPointsInHeader,
    welcomeBonus: program.welcomeBonus,
    birthdayBonus: program.birthdayBonus,
  });
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleToggleEnabled = () => {
    const newValue = !optimisticEnabled;
    setOptimisticEnabled(newValue);
    setFormData(prev => ({ ...prev, isEnabled: newValue }));
    
    // Save immediately
    startTransition(async () => {
      const result = await updateLoyaltyProgram(program.id, storeSlug, { isEnabled: newValue });
      if (!result.success) {
        setOptimisticEnabled(!newValue);
        setFormData(prev => ({ ...prev, isEnabled: !newValue }));
      }
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    startTransition(async () => {
      const result = await updateLoyaltyProgram(program.id, storeSlug, {
        ...formData,
        pointsExpireDays: formData.pointsExpireDays || null,
      });
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('שגיאה בשמירת ההגדרות');
      }
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-medium text-gray-900">הפעל מועדון לקוחות</h3>
          <p className="text-sm text-gray-500">חברי המועדון יוכלו לצבור נקודות ולקבל הטבות</p>
        </div>
        <button
          type="button"
          onClick={handleToggleEnabled}
          disabled={isPending}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
            optimisticEnabled ? 'bg-green-500' : 'bg-gray-300'
          }`}
          role="switch"
          aria-checked={optimisticEnabled}
        >
          <span
            className={`pointer-events-none absolute h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
              optimisticEnabled ? 'right-1' : 'left-1'
            }`}
          />
        </button>
      </div>
      
      {/* Program Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          שם המועדון
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>
      
      {/* Progression Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          מדד התקדמות ברמות
        </label>
        <select
          value={formData.progressionType}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            progressionType: e.target.value as 'total_spent' | 'total_orders' | 'points_earned'
          }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        >
          <option value="total_spent">סכום רכישות (₪)</option>
          <option value="total_orders">מספר הזמנות</option>
          <option value="points_earned">נקודות שנצברו</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          לפי מה לקבוע עלייה ברמות
        </p>
      </div>
      
      {/* Points Settings */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">הגדרות נקודות</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              נקודות לכל ₪1
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.pointsPerIls}
              onChange={(e) => setFormData(prev => ({ ...prev, pointsPerIls: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ערך נקודה בפדיון (₪)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.pointsRedemptionRate}
              onChange={(e) => setFormData(prev => ({ ...prev, pointsRedemptionRate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              למשל: 0.1 = 10 אג' לנקודה
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              מינימום נקודות לפדיון
            </label>
            <input
              type="number"
              min="0"
              value={formData.minPointsToRedeem}
              onChange={(e) => setFormData(prev => ({ ...prev, minPointsToRedeem: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תוקף נקודות (ימים)
            </label>
            <input
              type="number"
              min="0"
              value={formData.pointsExpireDays || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                pointsExpireDays: e.target.value ? Number(e.target.value) : null 
              }))}
              placeholder="ללא תוקף"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              השאר ריק לנקודות ללא תפוגה
            </p>
          </div>
        </div>
      </div>
      
      {/* Bonus Settings */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">בונוסים</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              בונוס הרשמה (נקודות)
            </label>
            <input
              type="number"
              min="0"
              value={formData.welcomeBonus}
              onChange={(e) => setFormData(prev => ({ ...prev, welcomeBonus: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              נקודות שניתנות בהצטרפות למועדון
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              בונוס יום הולדת (נקודות)
            </label>
            <input
              type="number"
              min="0"
              value={formData.birthdayBonus}
              onChange={(e) => setFormData(prev => ({ ...prev, birthdayBonus: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      
      {/* Display Settings */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">תצוגה</h3>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showProgressBar}
              onChange={(e) => setFormData(prev => ({ ...prev, showProgressBar: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span className="text-sm text-gray-700">הצג סרגל התקדמות באיזור האישי</span>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showPointsInHeader}
              onChange={(e) => setFormData(prev => ({ ...prev, showPointsInHeader: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span className="text-sm text-gray-700">הצג נקודות בהדר (ליד העגלה)</span>
          </label>
        </div>
      </div>
      
      {/* Error/Success Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
          ההגדרות נשמרו בהצלחה
        </div>
      )}
      
      {/* Submit */}
      <div className="flex justify-end pt-4 border-t">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'שומר...' : 'שמור שינויים'}
        </button>
      </div>
    </form>
  );
}

