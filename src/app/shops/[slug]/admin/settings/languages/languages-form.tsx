'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Globe, 
  Plus, 
  Trash2, 
  Check, 
  Star, 
  Languages as LanguagesIcon,
  Edit3,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  addStoreLanguage,
  removeStoreLanguage,
  setDefaultLanguage,
  toggleCustomTranslations,
} from './actions';
import type { SupportedLocale } from '@/lib/translations/types';
import { SUPPORTED_LOCALES, LOCALE_NAMES, LOCALE_DIRECTIONS } from '@/lib/translations/types';

interface LanguagesFormProps {
  storeId: string;
  storeSlug: string;
  defaultLocale: SupportedLocale;
  supportedLocales: SupportedLocale[];
  hasCustomTranslations: boolean;
}

// Language metadata with flags
const LOCALE_INFO: Record<SupportedLocale, { name: string; nativeName: string; flag: string; direction: 'ltr' | 'rtl' }> = {
  he: { name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', direction: 'rtl' },
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸', direction: 'ltr' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', direction: 'rtl' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', direction: 'ltr' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷', direction: 'ltr' },
};

export function LanguagesForm({
  storeId,
  storeSlug,
  defaultLocale,
  supportedLocales,
  hasCustomTranslations,
}: LanguagesFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);
  const [customTranslationsEnabled, setCustomTranslationsEnabled] = useState(hasCustomTranslations);
  const router = useRouter();

  // Available locales that can be added
  const availableLocales = SUPPORTED_LOCALES.filter(
    locale => !supportedLocales.includes(locale)
  );

  const handleAddLanguage = async (locale: SupportedLocale) => {
    setError(null);
    setSuccess(null);
    
    startTransition(async () => {
      const result = await addStoreLanguage(storeId, locale);
      if (result.success) {
        setSuccess(`שפה "${LOCALE_INFO[locale].nativeName}" נוספה בהצלחה`);
        setIsAddingLanguage(false);
        router.refresh();
      } else {
        setError(result.error || 'שגיאה בהוספת שפה');
      }
    });
  };

  const handleRemoveLanguage = async (locale: SupportedLocale) => {
    if (locale === defaultLocale) {
      setError('לא ניתן להסיר את שפת ברירת המחדל');
      return;
    }

    if (!confirm(`האם למחוק את השפה "${LOCALE_INFO[locale].nativeName}"? פעולה זו תמחק את כל התרגומים המותאמים.`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await removeStoreLanguage(storeId, locale);
      if (result.success) {
        setSuccess(`שפה "${LOCALE_INFO[locale].nativeName}" הוסרה`);
        router.refresh();
      } else {
        setError(result.error || 'שגיאה בהסרת שפה');
      }
    });
  };

  const handleSetDefault = async (locale: SupportedLocale) => {
    if (locale === defaultLocale) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await setDefaultLanguage(storeId, locale);
      if (result.success) {
        setSuccess(`שפת ברירת המחדל שונתה ל-"${LOCALE_INFO[locale].nativeName}"`);
        router.refresh();
      } else {
        setError(result.error || 'שגיאה בשינוי שפת ברירת מחדל');
      }
    });
  };

  const handleToggleCustomTranslations = async () => {
    setError(null);
    setSuccess(null);
    
    const newValue = !customTranslationsEnabled;
    setCustomTranslationsEnabled(newValue);

    startTransition(async () => {
      const result = await toggleCustomTranslations(storeId, newValue);
      if (result.success) {
        setSuccess(newValue ? 'תרגומים מותאמים הופעלו' : 'תרגומים מותאמים כובו');
        router.refresh();
      } else {
        setCustomTranslationsEnabled(!newValue); // Revert
        setError(result.error || 'שגיאה בעדכון הגדרות');
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Performance Notice */}
      {supportedLocales.length === 1 && !customTranslationsEnabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">מצב מהירות מלאה ⚡</p>
            <p className="text-sm text-blue-700 mt-1">
              כאשר יש רק שפה אחת ותרגומים מותאמים כבויים, החנות עובדת במהירות מקסימלית ללא טעינת תרגומים נוספים.
            </p>
          </div>
        </div>
      )}

      {/* Custom Translations Toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Edit3 className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">הפעל תרגומים מותאמים</h4>
              <p className="text-sm text-gray-500 mt-1">
                כשמופעל, טקסטים שתערוך בעמוד התרגומים יחליפו את ברירת המחדל בחנות.
                <br />
                <span className="text-xs text-gray-400">
                  לדוגמה: לשנות "הוסף לסל" ל"קנה עכשיו", או "בחר אפשרויות" ל"בחר מידה"
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleCustomTranslations}
            disabled={isPending}
            className={`
              relative w-14 h-7 rounded-full transition-colors duration-200 ease-in-out
              ${customTranslationsEnabled ? 'bg-purple-600' : 'bg-gray-300'}
              ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span
              className={`
                absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out
                ${customTranslationsEnabled ? 'right-0.5' : 'right-7'}
              `}
            />
          </button>
        </div>
        
        {customTranslationsEnabled && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" />
              תרגומים מותאמים פעילים - שינויים שתעשה בעורך יופיעו בחנות
            </p>
          </div>
        )}
      </div>

      {/* Active Languages */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LanguagesIcon className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">שפות פעילות</h3>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
              {supportedLocales.length}
            </span>
          </div>
          
          {availableLocales.length > 0 && (
            <button
              onClick={() => setIsAddingLanguage(true)}
              className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              הוסף שפה
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {supportedLocales.map((locale) => {
            const info = LOCALE_INFO[locale];
            const isDefault = locale === defaultLocale;
            
            return (
              <div
                key={locale}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{info.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{info.nativeName}</span>
                      <span className="text-sm text-gray-500">({info.name})</span>
                      {isDefault && (
                        <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          ברירת מחדל
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      כיוון: {info.direction === 'rtl' ? 'ימין לשמאל' : 'שמאל לימין'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Edit Translations */}
                  <Link
                    href={`/shops/${storeSlug}/admin/settings/languages/${locale}`}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="ערוך תרגומים"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>

                  {/* Set as Default */}
                  {!isDefault && (
                    <button
                      onClick={() => handleSetDefault(locale)}
                      disabled={isPending}
                      className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="הגדר כברירת מחדל"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}

                  {/* Remove */}
                  {!isDefault && (
                    <button
                      onClick={() => handleRemoveLanguage(locale)}
                      disabled={isPending}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="הסר שפה"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Language Modal */}
      {isAddingLanguage && availableLocales.length > 0 && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">הוסף שפה</h3>
              <button
                onClick={() => setIsAddingLanguage(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">
                בחר שפה להוספה לחנות. תוכל לערוך תרגומים לאחר ההוספה.
              </p>
              
              <div className="space-y-2">
                {availableLocales.map((locale) => {
                  const info = LOCALE_INFO[locale];
                  
                  return (
                    <button
                      key={locale}
                      onClick={() => handleAddLanguage(locale)}
                      disabled={isPending}
                      className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-right"
                    >
                      <span className="text-2xl">{info.flag}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{info.nativeName}</p>
                        <p className="text-sm text-gray-500">{info.name}</p>
                      </div>
                      <Plus className="w-5 h-5 text-gray-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Geo-detection Info */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-3">
          <Globe className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-gray-900">זיהוי שפה אוטומטי</h4>
            <p className="text-sm text-gray-500 mt-1">
              המערכת מזהה אוטומטית את המיקום של הלקוח ומציגה את השפה המתאימה.
              <br />
              <span className="text-xs text-gray-400">
                סדר עדיפויות: העדפת לקוח → מיקום גיאוגרפי → הגדרת דפדפן → ברירת מחדל
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

