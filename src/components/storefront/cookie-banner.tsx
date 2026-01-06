'use client';

import { useState, useEffect, useCallback } from 'react';
import { Cookie, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

// ============================================
// Cookie Banner Component - Client Component
// Follows REQUIREMENTS.md: Minimal JS, optimistic UI
// ============================================

export interface GDPRSettings {
  enabled: boolean;
  useCustomText: boolean;
  customPolicyText: string;
  acceptButtonText: string;
  declineButtonText: string;
  bannerPosition: 'bottom' | 'top';
  bannerStyle: 'full-width' | 'box-right' | 'box-left';
  showDeclineButton: boolean;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  policyPageUrl: string;
}

interface CookieBannerProps {
  settings: GDPRSettings;
  storeSlug: string;
}

const COOKIE_CONSENT_KEY = 'cookie_consent';
const COOKIE_CONSENT_EXPIRY = 365 * 24 * 60 * 60 * 1000; // 1 year

export function CookieBanner({ settings, storeSlug }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  // Check consent on mount (client-side only)
  useEffect(() => {
    // Don't show if not enabled
    if (!settings.enabled) return;

    // Check if consent was already given
    try {
      const consent = localStorage.getItem(`${COOKIE_CONSENT_KEY}_${storeSlug}`);
      if (consent) {
        const parsedConsent = JSON.parse(consent);
        if (parsedConsent.expiry > Date.now()) {
          return; // Already has valid consent
        }
      }
    } catch {
      // Invalid consent, show banner
    }

    // Show banner after a small delay to not block initial render
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, [settings.enabled, storeSlug]);

  const handleAccept = useCallback(() => {
    localStorage.setItem(
      `${COOKIE_CONSENT_KEY}_${storeSlug}`,
      JSON.stringify({
        accepted: true,
        timestamp: Date.now(),
        expiry: Date.now() + COOKIE_CONSENT_EXPIRY,
      })
    );
    setIsVisible(false);
  }, [storeSlug]);

  const handleDecline = useCallback(() => {
    localStorage.setItem(
      `${COOKIE_CONSENT_KEY}_${storeSlug}`,
      JSON.stringify({
        accepted: false,
        timestamp: Date.now(),
        expiry: Date.now() + COOKIE_CONSENT_EXPIRY,
      })
    );
    setIsVisible(false);
  }, [storeSlug]);

  // Don't render anything if not visible
  if (!isVisible) return null;

  const acceptText = settings.acceptButtonText || 'אני מסכים';
  const declineText = settings.declineButtonText || 'לא מסכים';

  // Position classes
  const positionClasses = settings.bannerPosition === 'top' ? 'top-0' : 'bottom-0';
  
  // Style classes
  const styleClasses = 
    settings.bannerStyle === 'full-width'
      ? 'left-0 right-0'
      : settings.bannerStyle === 'box-right'
      ? `right-4 left-auto max-w-md ${settings.bannerPosition === 'top' ? 'top-4' : 'bottom-4'} rounded-xl`
      : `left-4 right-auto max-w-md ${settings.bannerPosition === 'top' ? 'top-4' : 'bottom-4'} rounded-xl`;

  const isBoxStyle = settings.bannerStyle !== 'full-width';

  // Default text if no custom text
  const defaultText = 'אנו משתמשים בעוגיות כדי לשפר את חווית הגלישה שלך באתר. על ידי המשך הגלישה, אתה מסכים לשימוש שלנו בעוגיות.';
  const displayText = settings.useCustomText && settings.customPolicyText 
    ? settings.customPolicyText 
    : defaultText;

  return (
    <div
      className={`fixed z-[100] ${positionClasses} ${styleClasses} shadow-2xl transition-all duration-300 ease-out`}
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
        animation: settings.bannerPosition === 'bottom' 
          ? 'slideInFromBottom 0.3s ease-out' 
          : 'slideInFromTop 0.3s ease-out',
      }}
      dir="rtl"
    >
      <style jsx>{`
        @keyframes slideInFromBottom {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideInFromTop {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      
      <div className={`p-4 ${isBoxStyle ? '' : 'container mx-auto'}`}>
        <div className={`flex ${isBoxStyle ? 'flex-col gap-4' : 'flex-col md:flex-row items-start md:items-center gap-4'}`}>
          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Cookie className="w-5 h-5" />
              <span className="font-semibold">הודעת עוגיות</span>
            </div>
            
            <div className="text-sm opacity-90">
              {showFullText ? (
                <div className="whitespace-pre-wrap">{displayText}</div>
              ) : (
                <p>{displayText.slice(0, 150)}{displayText.length > 150 ? '...' : ''}</p>
              )}
              
              {displayText.length > 150 && (
                <button
                  onClick={() => setShowFullText(!showFullText)}
                  className="flex items-center gap-1 mt-2 text-sm underline opacity-80 hover:opacity-100 cursor-pointer"
                >
                  {showFullText ? (
                    <>
                      הסתר
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      קרא עוד
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
              
              {settings.policyPageUrl && (
                <a
                  href={settings.policyPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-sm underline opacity-80 hover:opacity-100"
                >
                  מדיניות פרטיות מלאה
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className={`flex gap-2 ${isBoxStyle ? 'w-full' : 'shrink-0'}`}>
            <button
              onClick={handleAccept}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                isBoxStyle ? 'flex-1' : ''
              }`}
              style={{
                backgroundColor: settings.buttonColor,
                color: settings.buttonTextColor,
              }}
            >
              {acceptText}
            </button>
            
            {settings.showDeclineButton && (
              <button
                onClick={handleDecline}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium border transition-all hover:opacity-80 cursor-pointer ${
                  isBoxStyle ? 'flex-1' : ''
                }`}
                style={{
                  borderColor: settings.textColor,
                  color: settings.textColor,
                  backgroundColor: 'transparent',
                }}
              >
                {declineText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

