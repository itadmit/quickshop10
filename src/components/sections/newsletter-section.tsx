/**
 * NewsletterSection - VIP Newsletter Subscription
 * Clean email subscription form with customizable styling
 */

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
  sectionId 
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
        
        <div className="flex max-w-md mx-auto">
          <input 
            type="email" 
            placeholder={content.placeholder || 'כתובת אימייל'}
            className="flex-1 px-6 py-4 text-sm focus:outline-none transition-colors bg-white"
            style={{ borderColor: settings.inputBorderColor || '#e5e7eb', borderWidth: '1px', borderStyle: 'solid' }}
            data-content-placeholder
          />
          <button 
            className="px-8 py-4 text-[11px] tracking-[0.15em] uppercase hover:opacity-90 transition-colors cursor-pointer"
            style={{ 
              backgroundColor: settings.buttonBackgroundColor || '#000000',
              color: settings.buttonTextColor || '#ffffff',
            }}
            data-section-button
          >
            {content.buttonText || 'הרשמה'}
          </button>
        </div>
      </div>
    </section>
  );
}
