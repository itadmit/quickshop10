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
import { Coins, Gift, LayoutGrid, Settings2, Sparkles } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Enable Toggle */}
      <div className={`flex items-center justify-between p-5 rounded-xl transition-all ${
        optimisticEnabled 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 ring-1 ring-green-200' 
          : 'bg-gray-50'
      }`}>
        <div>
          <h3 className="font-semibold text-gray-900">הפעל מועדון לקוחות</h3>
          <p className="text-sm text-gray-500 mt-0.5">חברי המועדון יוכלו לצבור נקודות ולקבל הטבות</p>
        </div>
        <button
          type="button"
          onClick={handleToggleEnabled}
          disabled={isPending}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer shadow-inner ${
            optimisticEnabled ? 'bg-green-500' : 'bg-gray-300'
          }`}
          role="switch"
          aria-checked={optimisticEnabled}
        >
          <span
            className={`pointer-events-none absolute h-5 w-5 rounded-full bg-white shadow-md transition-all duration-200 ${
              optimisticEnabled ? 'right-1' : 'left-1'
            }`}
          />
        </button>
      </div>
      
      {/* Program Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          שם המועדון
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all placeholder:text-gray-400"
        />
      </div>
      
      {/* Progression Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          מדד התקדמות ברמות
        </label>
        <select
          value={formData.progressionType}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            progressionType: e.target.value as 'total_spent' | 'total_orders' | 'points_earned'
          }))}
          className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all appearance-none cursor-pointer"
        >
          <option value="total_spent">סכום רכישות (₪)</option>
          <option value="total_orders">מספר הזמנות</option>
          <option value="points_earned">נקודות שנצברו</option>
        </select>
        <p className="text-xs text-gray-400 mt-1.5">
          לפי מה לקבוע עלייה ברמות
        </p>
      </div>
      
      {/* Points Settings Section */}
      <div className={`rounded-2xl p-6 transition-all ${
        formData.pointsEnabled 
          ? 'bg-gradient-to-br from-amber-50/80 to-orange-50/50' 
          : 'bg-gray-50'
      }`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              formData.pointsEnabled ? 'bg-amber-100' : 'bg-gray-200'
            }`}>
              <Coins className={`w-4 h-4 transition-colors ${
                formData.pointsEnabled ? 'text-amber-600' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">מערכת נקודות</h3>
              <p className="text-xs text-gray-500">צבירה ופדיון נקודות</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, pointsEnabled: !prev.pointsEnabled }))}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
              formData.pointsEnabled ? 'bg-amber-500' : 'bg-gray-300'
            }`}
            role="switch"
            aria-checked={formData.pointsEnabled}
          >
            <span
              className={`pointer-events-none absolute h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
                formData.pointsEnabled ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>
        
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 transition-opacity ${
          formData.pointsEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'
        }`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              נקודות לכל ₪1
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.pointsPerIls}
              onChange={(e) => setFormData(prev => ({ ...prev, pointsPerIls: e.target.value }))}
              className="w-full px-4 py-2.5 bg-white border-0 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all shadow-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ערך נקודה בפדיון (₪)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.pointsRedemptionRate}
              onChange={(e) => setFormData(prev => ({ ...prev, pointsRedemptionRate: e.target.value }))}
              className="w-full px-4 py-2.5 bg-white border-0 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all shadow-sm"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              למשל: 0.1 = 10 אג' לנקודה
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מינימום נקודות לפדיון
            </label>
            <input
              type="number"
              min="0"
              value={formData.minPointsToRedeem}
              onChange={(e) => setFormData(prev => ({ ...prev, minPointsToRedeem: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 bg-white border-0 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all shadow-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-4 py-2.5 bg-white border-0 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all shadow-sm placeholder:text-gray-300"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              השאר ריק לנקודות ללא תפוגה
            </p>
          </div>
        </div>
      </div>
      
      {/* Bonus Settings Section - Only visible when points enabled */}
      {formData.pointsEnabled && (
      <div className="bg-gradient-to-br from-violet-50/80 to-purple-50/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
            <Gift className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">בונוסי נקודות</h3>
            <p className="text-xs text-gray-500">נקודות אוטומטיות באירועים מיוחדים</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              בונוס הרשמה (נקודות)
            </label>
            <input
              type="number"
              min="0"
              value={formData.welcomeBonus}
              onChange={(e) => setFormData(prev => ({ ...prev, welcomeBonus: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 bg-white border-0 rounded-xl focus:ring-2 focus:ring-violet-500 transition-all shadow-sm"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              נקודות שניתנות בהצטרפות למועדון
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              בונוס יום הולדת (נקודות)
            </label>
            <input
              type="number"
              min="0"
              value={formData.birthdayBonus}
              onChange={(e) => setFormData(prev => ({ ...prev, birthdayBonus: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 bg-white border-0 rounded-xl focus:ring-2 focus:ring-violet-500 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>
      )}
      
      {/* Display Settings Section */}
      <div className="bg-gradient-to-br from-blue-50/80 to-sky-50/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900">תצוגה</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.showProgressBar}
                onChange={(e) => setFormData(prev => ({ ...prev, showProgressBar: e.target.checked }))}
                className="w-5 h-5 rounded-md border-2 border-gray-300 bg-white checked:bg-blue-500 checked:border-blue-500 transition-all cursor-pointer accent-blue-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">הצג סרגל התקדמות לרמה הבאה באיזור האישי</span>
            </label>
            <p className="text-xs text-gray-400 mr-8 mt-1">יוצג רק אם יש יותר מרמה אחת</p>
          </div>
          
          {/* Show points in header - only relevant when points are enabled */}
          {formData.pointsEnabled && (
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.showPointsInHeader}
                onChange={(e) => setFormData(prev => ({ ...prev, showPointsInHeader: e.target.checked }))}
                className="w-5 h-5 rounded-md border-2 border-gray-300 bg-white checked:bg-blue-500 checked:border-blue-500 transition-all cursor-pointer accent-blue-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">הצג נקודות בהדר (ליד העגלה)</span>
            </label>
          )}
        </div>
      </div>
      
      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 rounded-xl text-sm text-red-600 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">✕</span>
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-50 rounded-xl text-sm text-green-600 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">✓</span>
          ההגדרות נשמרו בהצלחה
        </div>
      )}
      
      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-8 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/30"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              שומר...
            </span>
          ) : 'שמור שינויים'}
        </button>
      </div>
    </form>
  );
}
