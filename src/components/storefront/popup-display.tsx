'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface PopupContent {
  imageUrl?: string;
  imageAlt?: string;
  linkUrl?: string;
  linkText?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  buttonText?: string;
  buttonUrl?: string;
  fields?: Array<{
    name: string;
    type: 'text' | 'email' | 'phone' | 'textarea';
    placeholder?: string;
    required?: boolean;
  }>;
  successMessage?: string;
}

interface PopupStyle {
  bgColor?: string;
  textColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  overlayOpacity?: number;
  borderRadius?: number;
  width?: 'small' | 'medium' | 'large' | 'full';
}

interface PopupData {
  id: string;
  name: string;
  type: 'image' | 'text' | 'form' | 'combined';
  trigger: 'on_load' | 'exit_intent' | 'scroll' | 'time_delay';
  triggerValue: number;
  position: 'center' | 'bottom_right' | 'bottom_left' | 'full_screen';
  frequency: 'once' | 'once_per_session' | 'always' | 'every_x_days';
  frequencyDays: number;
  targetPages: 'all' | 'homepage' | 'products' | 'categories' | 'custom';
  customTargetUrls: string[];
  showOnDesktop: boolean;
  showOnMobile: boolean;
  content: PopupContent;
  style: PopupStyle;
}

interface PopupDisplayProps {
  popups: PopupData[];
  storeSlug: string;
}

const widthClasses: Record<string, string> = {
  small: 'max-w-sm',
  medium: 'max-w-md',
  large: 'max-w-lg',
  full: 'max-w-full mx-4',
};

const positionClasses: Record<string, string> = {
  center: 'items-center justify-center',
  bottom_right: 'items-end justify-start pb-6 pl-6',
  bottom_left: 'items-end justify-end pb-6 pr-6',
  full_screen: 'items-stretch justify-stretch',
};

export function PopupDisplay({ popups, storeSlug }: PopupDisplayProps) {
  const [activePopup, setActivePopup] = useState<PopupData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const pathname = usePathname();

  // Check if popup should show based on frequency
  const shouldShowPopup = useCallback((popup: PopupData): boolean => {
    const storageKey = `popup_${popup.id}`;
    const sessionKey = `popup_session_${popup.id}`;

    // Check device type
    const isMobile = window.innerWidth < 768;
    if (isMobile && !popup.showOnMobile) return false;
    if (!isMobile && !popup.showOnDesktop) return false;

    // Check target pages
    const path = pathname || '/';
    // Never show popups on checkout pages
    if (path.includes('/checkout')) return false;
    if (popup.targetPages === 'homepage' && !path.match(/\/shops\/[^/]+\/?$/)) return false;
    if (popup.targetPages === 'products' && !path.includes('/product/')) return false;
    if (popup.targetPages === 'categories' && !path.includes('/category/')) return false;

    // Check frequency
    switch (popup.frequency) {
      case 'once':
        if (localStorage.getItem(storageKey)) return false;
        break;
      case 'once_per_session':
        if (sessionStorage.getItem(sessionKey)) return false;
        break;
      case 'every_x_days':
        const lastShown = localStorage.getItem(storageKey);
        if (lastShown) {
          const daysSince = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
          if (daysSince < popup.frequencyDays) return false;
        }
        break;
      // 'always' - no check needed
    }

    return true;
  }, [pathname]);

  // Mark popup as shown
  const markAsShown = useCallback((popup: PopupData) => {
    const storageKey = `popup_${popup.id}`;
    const sessionKey = `popup_session_${popup.id}`;

    switch (popup.frequency) {
      case 'once':
      case 'every_x_days':
        localStorage.setItem(storageKey, Date.now().toString());
        break;
      case 'once_per_session':
        sessionStorage.setItem(sessionKey, 'true');
        break;
    }

    // Track impression
    fetch(`/api/popup/${popup.id}/impression`, { method: 'POST', keepalive: true }).catch(() => {});
  }, []);

  // Find and show the first eligible popup
  useEffect(() => {
    if (popups.length === 0) return;

    const eligiblePopup = popups.find(shouldShowPopup);
    if (!eligiblePopup) return;

    const showPopup = () => {
      setActivePopup(eligiblePopup);
      setIsVisible(true);
      markAsShown(eligiblePopup);
    };

    // Handle different triggers
    switch (eligiblePopup.trigger) {
      case 'on_load':
        showPopup();
        break;

      case 'time_delay':
        const timeout = setTimeout(showPopup, eligiblePopup.triggerValue * 1000);
        return () => clearTimeout(timeout);

      case 'scroll':
        const handleScroll = () => {
          const scrollPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
          if (scrollPercentage >= eligiblePopup.triggerValue) {
            showPopup();
            window.removeEventListener('scroll', handleScroll);
          }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);

      case 'exit_intent':
        const handleMouseLeave = (e: MouseEvent) => {
          if (e.clientY <= 0) {
            showPopup();
            document.removeEventListener('mouseleave', handleMouseLeave);
          }
        };
        document.addEventListener('mouseleave', handleMouseLeave);
        return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }
  }, [popups, shouldShowPopup, markAsShown]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setActivePopup(null);
      setFormData({});
      setIsSubmitted(false);
    }, 300);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePopup || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await fetch(`/api/popup/${activePopup.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData }),
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit popup form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleButtonClick = () => {
    if (activePopup) {
      fetch(`/api/popup/${activePopup.id}/click`, { method: 'POST', keepalive: true }).catch(() => {});
    }
  };

  if (!activePopup) return null;

  const { content, style, type, position } = activePopup;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex transition-opacity duration-300 ${positionClasses[position]} ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      dir="rtl"
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 transition-opacity"
        style={{ backgroundColor: `rgba(0,0,0,${(style.overlayOpacity || 50) / 100})` }}
        onClick={handleClose}
      />

      {/* Popup Content */}
      <div 
        className={`relative w-full ${widthClasses[style.width || 'medium']} transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        } ${position === 'full_screen' ? 'm-4 h-[calc(100%-2rem)]' : ''}`}
        style={{
          backgroundColor: style.bgColor || '#ffffff',
          borderRadius: `${style.borderRadius || 0}px`,
          color: style.textColor || '#1a1a1a',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors z-10"
          style={{ color: style.textColor || '#1a1a1a' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image Type */}
        {type === 'image' && content.imageUrl && (
          <div className="relative">
            {content.linkUrl ? (
              <Link href={content.linkUrl} onClick={handleButtonClick}>
                <img
                  src={content.imageUrl}
                  alt={content.imageAlt || ''}
                  className="w-full h-auto"
                  style={{ borderRadius: `${style.borderRadius || 0}px` }}
                />
              </Link>
            ) : (
              <img
                src={content.imageUrl}
                alt={content.imageAlt || ''}
                className="w-full h-auto"
                style={{ borderRadius: `${style.borderRadius || 0}px` }}
              />
            )}
          </div>
        )}

        {/* Text Type */}
        {type === 'text' && (
          <div className="p-8 text-center">
            {content.title && (
              <h2 
                className="text-2xl font-light mb-2 tracking-wide"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {content.title}
              </h2>
            )}
            {content.subtitle && (
              <p className="text-sm opacity-70 mb-4 uppercase tracking-widest">
                {content.subtitle}
              </p>
            )}
            {content.body && (
              <p className="mb-6 leading-relaxed">
                {content.body}
              </p>
            )}
            {content.buttonText && (
              <Link
                href={content.buttonUrl || '#'}
                onClick={handleButtonClick}
                className="inline-block px-8 py-3 text-xs font-medium uppercase tracking-widest transition-all hover:opacity-80"
                style={{
                  backgroundColor: style.buttonBgColor || '#000000',
                  color: style.buttonTextColor || '#ffffff',
                  borderRadius: `${Math.min(style.borderRadius || 0, 8)}px`,
                }}
              >
                {content.buttonText}
              </Link>
            )}
          </div>
        )}

        {/* Form Type */}
        {type === 'form' && (
          <div className="p-8">
            {isSubmitted ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg">
                  {content.successMessage || 'תודה! נרשמת בהצלחה'}
                </p>
              </div>
            ) : (
              <>
                {content.title && (
                  <h2 
                    className="text-2xl font-light mb-2 tracking-wide text-center"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {content.title}
                  </h2>
                )}
                {content.subtitle && (
                  <p className="text-sm opacity-70 mb-6 text-center">
                    {content.subtitle}
                  </p>
                )}
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {(content.fields || [{ name: 'email', type: 'email', placeholder: 'אימייל', required: true }]).map((field) => (
                    <div key={field.name}>
                      {field.type === 'textarea' ? (
                        <textarea
                          name={field.name}
                          placeholder={field.placeholder || field.name}
                          required={field.required}
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-200 focus:border-gray-900 focus:outline-none transition-colors"
                          style={{ 
                            borderRadius: `${Math.min(style.borderRadius || 0, 8)}px`,
                            backgroundColor: 'transparent',
                          }}
                        />
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          placeholder={field.placeholder || field.name}
                          required={field.required}
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 focus:border-gray-900 focus:outline-none transition-colors"
                          style={{ 
                            borderRadius: `${Math.min(style.borderRadius || 0, 8)}px`,
                            backgroundColor: 'transparent',
                          }}
                        />
                      )}
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 text-xs font-medium uppercase tracking-widest transition-all hover:opacity-80 disabled:opacity-50"
                    style={{
                      backgroundColor: style.buttonBgColor || '#000000',
                      color: style.buttonTextColor || '#ffffff',
                      borderRadius: `${Math.min(style.borderRadius || 0, 8)}px`,
                    }}
                  >
                    {isSubmitting ? '...' : content.buttonText || 'הירשמו'}
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



