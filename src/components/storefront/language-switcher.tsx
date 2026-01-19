'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { SupportedLocale } from '@/lib/translations/types';

interface LanguageSwitcherProps {
  currentLocale: SupportedLocale;
  supportedLocales: SupportedLocale[];
  onLocaleChange?: (locale: SupportedLocale) => void;
  className?: string;
  variant?: 'minimal' | 'full'; // minimal = just flag, full = flag + name
}

// Locale display info
const LOCALE_INFO: Record<SupportedLocale, { name: string; nativeName: string; flag: string; currency: string }> = {
  he: { name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', currency: '₪' },
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸', currency: '$' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', currency: '﷼' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', currency: '₽' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷', currency: '€' },
};

/**
 * Language Switcher - Zara/Alo Yoga Style
 * 
 * Elegant, minimal design with a modal overlay
 * Features:
 * - Clean minimal trigger (flag or globe icon)
 * - Full-screen overlay on mobile, modal on desktop
 * - Country, Language, and Currency selection
 * - Geo-detection support
 */
export function LanguageSwitcher({ 
  currentLocale, 
  supportedLocales, 
  onLocaleChange,
  className = '',
  variant = 'minimal'
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState(currentLocale);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle locale selection
  const handleSelect = (locale: SupportedLocale) => {
    setSelectedLocale(locale);
    onLocaleChange?.(locale);
    setIsOpen(false);
    
    // Store preference in cookie for server-side detection
    document.cookie = `preferred_locale=${locale};path=/;max-age=31536000`; // 1 year
  };

  // Don't render if only one locale
  if (supportedLocales.length <= 1) {
    return null;
  }

  const currentInfo = LOCALE_INFO[currentLocale];

  return (
    <>
      {/* Trigger Button - Minimal Style */}
      <button
        onClick={() => setIsOpen(true)}
        className={`items-center gap-1.5 text-[11px] tracking-[0.1em] uppercase text-gray-600 hover:text-black transition-colors ${className || 'flex'}`}
        aria-label="בחר שפה"
      >
        <span className="text-base">{currentInfo.flag}</span>
        {variant === 'full' && (
          <span className="hidden sm:inline">{currentInfo.nativeName}</span>
        )}
        <svg 
          width="8" 
          height="8" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className="opacity-50"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Modal Overlay - Rendered via Portal to escape header stacking context */}
      {mounted && isOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Container */}
          <div 
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-300"
            style={{ maxHeight: '85vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-[11px] tracking-[0.2em] uppercase text-black font-medium">
                  מיקום ושפה
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Location & Language
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 200px)' }}>
              {/* Country Section */}
              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-3">
                  מיקום למשלוח
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-white border border-gray-200 px-4 py-3 pr-10 text-sm
                               focus:border-black focus:outline-none transition-colors cursor-pointer"
                    defaultValue="IL"
                  >
                    <option value="IL">🇮🇱 ישראל</option>
                  </select>
                  <svg 
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>

              {/* Language Section */}
              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-3">
                  שפה
                </label>
                <div className="relative">
                  <select
                    value={selectedLocale}
                    onChange={(e) => setSelectedLocale(e.target.value as SupportedLocale)}
                    className="w-full appearance-none bg-white border border-gray-200 px-4 py-3 pr-10 text-sm
                               focus:border-black focus:outline-none transition-colors cursor-pointer"
                  >
                    {supportedLocales.map((locale) => {
                      const info = LOCALE_INFO[locale];
                      return (
                        <option key={locale} value={locale}>
                          {info.flag} {info.nativeName}
                        </option>
                      );
                    })}
                  </select>
                  <svg 
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>

              {/* Currency Section */}
              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-3">
                  מטבע
                </label>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200">
                  <span className="text-lg">🇮🇱</span>
                  <span className="text-sm text-gray-900">שקל ישראלי חדש</span>
                  <svg 
                    className="mr-auto text-gray-400" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 space-y-3">
              <button
                onClick={() => handleSelect(selectedLocale)}
                className="w-full bg-black text-white py-3 text-[11px] tracking-[0.15em] uppercase font-medium
                           hover:bg-gray-900 transition-colors"
              >
                שמירה
              </button>
              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                העלות הכוללת מוצגת במטבע המקומי – ללא עמלות נוספות.
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-[11px] tracking-[0.1em] text-gray-500 hover:text-black underline underline-offset-4 transition-colors py-2"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default LanguageSwitcher;

