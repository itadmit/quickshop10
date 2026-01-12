/**
 * NewsletterSection - VIP Newsletter Subscription
 * Server Component wrapper with Client-side form
 * 
 * PERFORMANCE: Main section is Server Component (no JS)
 * Only the form itself is a small client component
 */

import { NewsletterForm } from '@/components/storefront/newsletter-form';

interface NewsletterSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    placeholder?: string;
    buttonText?: string;
  };
  settings: {
    maxWidth?: string;
    backgroundColor?: string;
    // Typography - Title
    titleColor?: string;
    titleSize?: 'sm' | 'md' | 'lg' | 'xl';
    titleWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
    // Typography - Subtitle
    subtitleColor?: string;
    // Button
    buttonTextColor?: string;
    buttonBackgroundColor?: string;
    // Input
    inputBorderColor?: string;
    // Spacing
    marginTop?: number;
    marginBottom?: number;
    // Custom
    customClass?: string;
    customId?: string;
    customCss?: string;
  };
  sectionId?: string;
  storeSlug?: string; // Required for form submission
}

const TITLE_SIZES = {
  sm: 'text-xl md:text-2xl',
  md: 'text-2xl md:text-3xl',
  lg: 'text-3xl md:text-4xl',
  xl: 'text-4xl md:text-5xl',
};

const FONT_WEIGHTS = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export function NewsletterSection({ 
  title, 
  subtitle, 
  content, 
  settings,
  sectionId,
  storeSlug,
}: NewsletterSectionProps) {
  const bgColor = settings?.backgroundColor || '#f9fafb';
  const titleSize = settings.titleSize || 'md';
  const titleWeight = settings.titleWeight || 'light';

  return (
    <section 
      className={`py-24 px-6 ${settings.customClass || ''}`}
      style={{ 
        backgroundColor: bgColor,
        marginTop: settings.marginTop ? `${settings.marginTop}px` : undefined,
        marginBottom: settings.marginBottom ? `${settings.marginBottom}px` : undefined,
      }}
      id={settings.customId || undefined}
      data-section-id={sectionId}
      data-section-name="הצטרפו למועדון"
    >
      {settings.customCss && <style>{settings.customCss}</style>}
      <div className="max-w-xl mx-auto text-center">
        <h2 
          className={`${TITLE_SIZES[titleSize]} ${FONT_WEIGHTS[titleWeight]} tracking-[0.15em] uppercase mb-4 ${!title ? 'hidden' : ''}`}
          style={{ color: settings.titleColor || 'inherit' }}
          data-section-title
        >
          {title || ''}
        </h2>
        
        <p 
          className={`text-sm mb-10 opacity-70 ${!subtitle ? 'hidden' : ''}`}
          style={{ color: settings.subtitleColor || 'inherit' }}
          data-section-subtitle
        >
          {subtitle || ''}
        </p>
        
        {/* Newsletter Form - Client Component for interactivity */}
        {storeSlug ? (
          <div className="max-w-md mx-auto">
            <NewsletterFormStyled
              storeSlug={storeSlug}
              placeholder={content.placeholder}
              buttonText={content.buttonText}
              buttonBackgroundColor={settings.buttonBackgroundColor}
              buttonTextColor={settings.buttonTextColor}
              inputBorderColor={settings.inputBorderColor}
            />
          </div>
        ) : (
          // Fallback for editor preview (no storeSlug)
          <div className="flex max-w-md mx-auto">
            <input 
              type="email" 
              placeholder={content.placeholder || 'כתובת אימייל'}
              className="flex-1 px-6 py-4 text-sm focus:outline-none transition-colors bg-white"
              style={{ borderColor: settings.inputBorderColor || '#e5e7eb', borderWidth: '1px', borderStyle: 'solid' }}
              data-content-placeholder
              readOnly
            />
            <button 
              className="px-8 py-4 text-[11px] tracking-[0.15em] uppercase hover:opacity-90 transition-colors cursor-pointer"
              style={{ 
                backgroundColor: settings.buttonBackgroundColor || '#000000',
                color: settings.buttonTextColor || '#ffffff',
              }}
              data-section-button
              type="button"
            >
              {content.buttonText || 'הרשמה'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// Styled wrapper for NewsletterForm with section-specific styles
function NewsletterFormStyled({
  storeSlug,
  placeholder,
  buttonText,
  buttonBackgroundColor,
  buttonTextColor,
  inputBorderColor,
}: {
  storeSlug: string;
  placeholder?: string;
  buttonText?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  inputBorderColor?: string;
}) {
  return (
    <NewsletterForm
      storeSlug={storeSlug}
      placeholder={placeholder || 'כתובת אימייל'}
      buttonText={buttonText || 'הרשמה'}
      buttonBackgroundColor={buttonBackgroundColor || '#000000'}
      buttonTextColor={buttonTextColor || '#ffffff'}
      inputBorderColor={inputBorderColor || '#e5e7eb'}
    />
  );
}
