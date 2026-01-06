'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { WheelOfFortune } from './wheel-of-fortune';
import { ScratchCard } from './scratch-card';

interface Prize {
  id: string;
  name: string;
  type: string;
  color: string;
  icon?: string | null;
}

interface GamificationCampaign {
  id: string;
  type: 'wheel' | 'scratch';
  title: string;
  subtitle: string | null;
  buttonText: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  collectName: boolean;
  collectEmail: boolean;
  collectPhone: boolean;
  collectBirthday: boolean;
  requireMarketingConsent: boolean;
  requirePrivacyConsent: boolean;
  privacyPolicyUrl: string | null;
  termsUrl: string | null;
  trigger: string;
  triggerValue: number;
  frequency: string;
  frequencyDays: number;
  targetPages: string;
  showOnDesktop: boolean;
  showOnMobile: boolean;
  prizes: Prize[];
}

interface GamificationPopupProps {
  campaigns: GamificationCampaign[];
  storeSlug: string;
  storeName?: string;
}

export function GamificationPopup({ campaigns, storeSlug, storeName }: GamificationPopupProps) {
  const [activeCampaign, setActiveCampaign] = useState<GamificationCampaign | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState<'form' | 'game' | 'result'>('form');
  const [entryId, setEntryId] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<{
    prize: Prize;
    prizeIndex: number;
    couponCode?: string;
  } | null>(null);
  const pathname = usePathname();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '',
    marketingConsent: false,
    privacyConsent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Check if should show campaign based on frequency
  const shouldShowCampaign = useCallback((campaign: GamificationCampaign) => {
    // Check device
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile && !campaign.showOnMobile) return false;
    if (!isMobile && !campaign.showOnDesktop) return false;

    // Check target pages
    if (campaign.targetPages === 'homepage' && pathname !== `/shops/${storeSlug}`) return false;
    if (campaign.targetPages === 'products' && !pathname.includes('/product/')) return false;
    if (campaign.targetPages === 'categories' && !pathname.includes('/category/')) return false;

    // Check frequency in localStorage
    const storageKey = `gamification_${campaign.id}`;
    const lastShown = localStorage.getItem(storageKey);

    if (lastShown) {
      const lastDate = new Date(lastShown);
      const now = new Date();

      switch (campaign.frequency) {
        case 'once':
          return false;
        case 'once_per_session':
          // Check sessionStorage
          if (sessionStorage.getItem(storageKey)) return false;
          break;
        case 'every_x_days':
          const daysDiff = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysDiff < campaign.frequencyDays) return false;
          break;
        // 'always' - always show
      }
    }

    return true;
  }, [pathname, storeSlug]);

  // Mark campaign as shown
  const markAsShown = useCallback((campaign: GamificationCampaign) => {
    const storageKey = `gamification_${campaign.id}`;
    localStorage.setItem(storageKey, new Date().toISOString());
    sessionStorage.setItem(storageKey, 'true');
  }, []);

  // Find and show eligible campaign
  useEffect(() => {
    if (campaigns.length === 0) return;

    const eligibleCampaign = campaigns.find(shouldShowCampaign);
    if (!eligibleCampaign) return;

    const showCampaign = () => {
      setActiveCampaign(eligibleCampaign);
      setIsVisible(true);
      markAsShown(eligibleCampaign);
      
      // Track impression
      fetch(`/api/shops/${storeSlug}/gamification/${eligibleCampaign.id}/impression`, {
        method: 'POST',
      }).catch(() => {});
    };

    switch (eligibleCampaign.trigger) {
      case 'on_load':
        showCampaign();
        break;
      case 'time_delay':
        const timeout = setTimeout(showCampaign, eligibleCampaign.triggerValue * 1000);
        return () => clearTimeout(timeout);
      case 'scroll':
        const handleScroll = () => {
          const scrollPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
          if (scrollPercentage >= eligibleCampaign.triggerValue) {
            showCampaign();
            window.removeEventListener('scroll', handleScroll);
          }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
      case 'exit_intent':
        const handleMouseLeave = (e: MouseEvent) => {
          if (e.clientY <= 0) {
            showCampaign();
            document.removeEventListener('mouseleave', handleMouseLeave);
          }
        };
        document.addEventListener('mouseleave', handleMouseLeave);
        return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }
  }, [campaigns, shouldShowCampaign, markAsShown, storeSlug]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setActiveCampaign(null);
      setStep('form');
      setEntryId(null);
      setGameResult(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        birthday: '',
        marketingConsent: false,
        privacyConsent: false,
      });
    }, 300);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/shops/${storeSlug}/gamification/${activeCampaign.id}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'אירעה שגיאה');
      }

      setEntryId(data.entryId);
      setStep('game');

      // For scratch cards, immediately fetch the result so the card is ready
      if (activeCampaign.type === 'scratch' && data.entryId) {
        const spinResponse = await fetch(`/api/shops/${storeSlug}/gamification/${activeCampaign.id}/spin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entryId: data.entryId }),
        });

        if (spinResponse.ok) {
          const spinData = await spinResponse.json();
          setGameResult(spinData);
        }
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'אירעה שגיאה');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSpin = async () => {
    if (!activeCampaign || !entryId) {
      throw new Error('Missing campaign or entry');
    }

    const response = await fetch(`/api/shops/${storeSlug}/gamification/${activeCampaign.id}/spin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'אירעה שגיאה');
    }

    setGameResult({
      prize: data.win.prize,
      prizeIndex: data.win.prizeIndex,
      couponCode: data.win.couponCode,
    });

    // If extra spin, allow to play again
    if (data.win.prize.type === 'extra_spin') {
      setEntryId(null);
      // Re-register to play again
      const reEnterResponse = await fetch(`/api/shops/${storeSlug}/gamification/${activeCampaign.id}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const reEnterData = await reEnterResponse.json();
      if (reEnterResponse.ok) {
        setEntryId(reEnterData.entryId);
      }
    }

    return {
      prizeIndex: data.win.prizeIndex,
      prize: data.win.prize,
      couponCode: data.win.couponCode,
    };
  };

  const handleScratchReveal = () => {
    // Mark as claimed
    if (gameResult?.couponCode) {
      fetch(`/api/shops/${storeSlug}/gamification/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: gameResult.couponCode }),
      }).catch(() => {});
    }
  };

  if (!activeCampaign || !isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-transform duration-300"
        style={{ 
          backgroundColor: activeCampaign.backgroundColor,
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 left-3 z-10 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6" dir="rtl">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 
              className="text-2xl font-bold"
              style={{ color: activeCampaign.textColor }}
            >
              {activeCampaign.title}
            </h2>
            {activeCampaign.subtitle && step === 'form' && (
              <p 
                className="text-sm mt-1 opacity-80"
                style={{ color: activeCampaign.textColor }}
              >
                {activeCampaign.subtitle}
              </p>
            )}
          </div>

          {/* Step: Form */}
          {step === 'form' && (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {activeCampaign.collectName && (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="שם מלא"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': activeCampaign.primaryColor } as React.CSSProperties}
                />
              )}
              {activeCampaign.collectEmail && (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="אימייל"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': activeCampaign.primaryColor } as React.CSSProperties}
                />
              )}
              {activeCampaign.collectPhone && (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="טלפון"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': activeCampaign.primaryColor } as React.CSSProperties}
                />
              )}
              {activeCampaign.collectBirthday && (
                <input
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': activeCampaign.primaryColor } as React.CSSProperties}
                />
              )}

              {/* Consents */}
              <div className="space-y-2 text-sm">
                {activeCampaign.requireMarketingConsent && (
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.marketingConsent}
                      onChange={(e) => setFormData(prev => ({ ...prev, marketingConsent: e.target.checked }))}
                      required
                      className="mt-1 rounded"
                    />
                    <span style={{ color: activeCampaign.textColor }}>
                      אני מאשר/ת קבלת עדכונים ומבצעים
                    </span>
                  </label>
                )}
                {activeCampaign.requirePrivacyConsent && (
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.privacyConsent}
                      onChange={(e) => setFormData(prev => ({ ...prev, privacyConsent: e.target.checked }))}
                      required
                      className="mt-1 rounded"
                    />
                    <span style={{ color: activeCampaign.textColor }}>
                      קראתי ואני מסכים/ה ל
                      {activeCampaign.privacyPolicyUrl ? (
                        <a 
                          href={activeCampaign.privacyPolicyUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline mr-1"
                          style={{ color: activeCampaign.primaryColor }}
                        >
                          מדיניות הפרטיות
                        </a>
                      ) : (
                        <span> מדיניות הפרטיות</span>
                      )}
                      {activeCampaign.termsUrl && (
                        <>
                          {' ו'}
                          <a 
                            href={activeCampaign.termsUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline"
                            style={{ color: activeCampaign.primaryColor }}
                          >
                            תקנון
                          </a>
                        </>
                      )}
                    </span>
                  </label>
                )}
              </div>

              {formError && (
                <p className="text-red-600 text-sm text-center">{formError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 text-white font-bold rounded-lg transition-all disabled:opacity-50 hover:opacity-90 hover:shadow-lg active:scale-[0.98] active:shadow-sm"
                style={{ 
                  background: `linear-gradient(135deg, ${activeCampaign.primaryColor}, ${activeCampaign.secondaryColor})` 
                }}
              >
                {isSubmitting ? 'טוען...' : activeCampaign.buttonText}
              </button>
            </form>
          )}

          {/* Step: Game */}
          {step === 'game' && (
            <div className="flex justify-center">
              {activeCampaign.type === 'wheel' ? (
                <WheelOfFortune
                  prizes={activeCampaign.prizes}
                  primaryColor={activeCampaign.primaryColor}
                  secondaryColor={activeCampaign.secondaryColor}
                  onSpin={handleSpin}
                />
              ) : (
                <>
                  {gameResult ? (
                    <ScratchCard
                      prize={gameResult.prize}
                      couponCode={gameResult.couponCode}
                      primaryColor={activeCampaign.primaryColor}
                      secondaryColor={activeCampaign.secondaryColor}
                      storeName={storeName}
                      onReveal={handleScratchReveal}
                      prizeType={gameResult.prize.type}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div 
                        className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
                        style={{ borderColor: `${activeCampaign.primaryColor} transparent ${activeCampaign.primaryColor} ${activeCampaign.primaryColor}` }}
                      />
                      <p className="mt-4 text-gray-500">מכין את הכרטיס...</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

