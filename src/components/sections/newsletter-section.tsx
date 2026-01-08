/**
 * NewsletterSection - VIP Newsletter Subscription
 * Clean email subscription form with customizable styling
 * 
 * Features:
 * - Customizable background color
 * - Title and subtitle
 * - Placeholder text
 * - Button text
 * - Live editor support with data-* attributes
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
    textColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
  };
  sectionId?: string;
}

export function NewsletterSection({ 
  title, 
  subtitle, 
  content, 
  settings,
  sectionId 
}: NewsletterSectionProps) {
  const bgColor = settings?.backgroundColor || '#f9fafb';
  const textColor = settings?.textColor || 'inherit';
  const buttonColor = settings?.buttonColor || '#000000';
  const buttonTextColor = settings?.buttonTextColor || '#ffffff';

  return (
    <section 
      className="py-24 px-6"
      style={{ backgroundColor: bgColor }}
      data-section-id={sectionId}
      data-section-name="הצטרפו למועדון"
    >
      <div className="max-w-xl mx-auto text-center">
        {/* Title - always rendered for live editor, hidden when empty */}
        <h2 
          className="font-display text-2xl md:text-3xl font-light tracking-[0.15em] uppercase mb-4"
          style={{ color: textColor, display: title ? '' : 'none' }}
          data-section-title
        >
          {title || ''}
        </h2>
        
        {/* Subtitle - always rendered for live editor, hidden when empty */}
        <p 
          className="text-sm mb-10"
          style={{ color: textColor, opacity: 0.7, display: subtitle ? '' : 'none' }}
          data-section-subtitle
        >
          {subtitle || ''}
        </p>
        
        <div className="flex max-w-md mx-auto">
          <input 
            type="email" 
            placeholder={content.placeholder || 'כתובת אימייל'}
            className="flex-1 px-6 py-4 border border-gray-200 text-sm focus:border-black transition-colors bg-white"
            data-content-placeholder
          />
          <button 
            className="px-8 py-4 text-[11px] tracking-[0.15em] uppercase hover:opacity-90 transition-colors cursor-pointer"
            style={{ 
              backgroundColor: buttonColor,
              color: buttonTextColor,
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
