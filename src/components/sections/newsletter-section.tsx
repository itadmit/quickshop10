/**
 * NewsletterSection - VIP Newsletter Subscription
 * Server Component wrapper with Client-side form
 * 
 * PERFORMANCE: Main section is Server Component (no JS)
 * Only the form itself is a small client component
 * 
 * 🔧 Uses shared section-system constants
 */

import { NewsletterForm } from '@/components/storefront/newsletter-form';
import { TITLE_SIZES, FONT_WEIGHTS } from '@/lib/section-system';
import type { TitleSize, FontWeight } from '@/lib/section-system';

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
    // Typography - Title (supports both string keys and numeric px values)
    titleColor?: string;
    titleSize?: TitleSize | number;
    titleSizeMobile?: number;
    titleWeight?: FontWeight;
    // Typography - Subtitle
    subtitleColor?: string;
    subtitleSize?: number;
    subtitleSizeMobile?: number;
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
    // Visibility
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
  };
  sectionId?: string;
  storeSlug?: string; // Required for form submission
}

export function NewsletterSection({ 
  title, 
  subtitle, 
  content, 
  settings,
  sectionId,
  storeSlug,
}: NewsletterSectionProps) {
  const bgColor = settings?.backgroundColor || '#f9fafb';
  
  // Check if numeric font sizes
  const titleSizeValue = settings.titleSize;
  const isNumericTitleSize = typeof titleSizeValue === 'number';
  const titleSize = isNumericTitleSize ? 'md' : (titleSizeValue || 'md');
  const titleWeight = settings.titleWeight || 'light';
  
  const subtitleSizeValue = settings.subtitleSize;
  const isNumericSubtitleSize = typeof subtitleSizeValue === 'number';

  const hasCustomSizes = isNumericTitleSize || isNumericSubtitleSize;
  
  // Visibility classes
  const hideOnMobileClass = settings.hideOnMobile ? 'max-md:hidden' : '';
  const hideOnDesktopClass = settings.hideOnDesktop ? 'md:hidden' : '';

  return (
    <section 
      className={`py-24 px-6 ${hideOnMobileClass} ${hideOnDesktopClass} ${settings.customClass || ''}`.trim()}
      style={{ 
        backgroundColor: bgColor,
        marginTop: settings.marginTop ? `${settings.marginTop}px` : undefined,
        marginBottom: settings.marginBottom ? `${settings.marginBottom}px` : undefined,
      }}
      id={settings.customId || undefined}
      data-section-id={sectionId}
      data-section-type="newsletter"
      data-section-name="הצטרפו למועדון"
      {...(settings.hideOnMobile && { 'data-hide-on-mobile': 'true' })}
      {...(settings.hideOnDesktop && { 'data-hide-on-desktop': 'true' })}
    >
      {settings.customCss && <style>{settings.customCss}</style>}
      
      {/* Scoped responsive styles for numeric font sizes */}
      {hasCustomSizes && (
        <style dangerouslySetInnerHTML={{ __html: `
          ${isNumericTitleSize ? `
            [data-section-id="${sectionId}"] [data-section-title] {
              font-size: ${settings.titleSizeMobile || (titleSizeValue as number) * 0.7}px !important;
            }
            @media (min-width: 768px) {
              [data-section-id="${sectionId}"] [data-section-title] {
                font-size: ${titleSizeValue}px !important;
              }
            }
          ` : ''}
          ${isNumericSubtitleSize ? `
            [data-section-id="${sectionId}"] [data-section-subtitle] {
              font-size: ${settings.subtitleSizeMobile || (subtitleSizeValue as number) * 0.8}px !important;
            }
            @media (min-width: 768px) {
              [data-section-id="${sectionId}"] [data-section-subtitle] {
                font-size: ${subtitleSizeValue}px !important;
              }
            }
          ` : ''}
        `}} />
      )}
      
      <div className="max-w-xl mx-auto text-center">
        <h2 
          className={`${!isNumericTitleSize ? TITLE_SIZES[titleSize as TitleSize] : ''} ${FONT_WEIGHTS[titleWeight]} tracking-[0.15em] uppercase mb-4 ${!title ? 'hidden' : ''}`}
          style={{ color: settings.titleColor || 'inherit' }}
          data-section-title
        >
          {title || ''}
        </h2>
        
        <p 
          className={`${!isNumericSubtitleSize ? 'text-sm' : ''} mb-10 opacity-70 ${!subtitle ? 'hidden' : ''}`}
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
