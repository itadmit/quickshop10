/**
 * TextBlockSection - Server Component
 * בלוק טקסט עשיר - אפס JS, מהיר כמו PHP!
 */

import Link from 'next/link';

interface TextBlockSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    text?: string;
    buttonText?: string;
    buttonLink?: string;
  };
  settings: {
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    backgroundColor?: string;
    // Typography - Title
    titleColor?: string;
    titleSize?: 'sm' | 'md' | 'lg' | 'xl';
    titleWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
    // Typography - Subtitle
    subtitleColor?: string;
    subtitleSize?: 'sm' | 'md' | 'lg';
    subtitleWeight?: 'light' | 'normal' | 'medium' | 'semibold';
    // Typography - Content
    textColor?: string;
    textSize?: 'sm' | 'md' | 'lg';
    // Button
    buttonTextColor?: string;
    buttonBackgroundColor?: string;
    buttonBorderColor?: string;
    // Spacing
    paddingY?: 'small' | 'medium' | 'large';
    marginTop?: number;
    marginBottom?: number;
    // Custom
    customClass?: string;
    customId?: string;
    customCss?: string;
  };
  basePath?: string;
  sectionId?: string;
}

const TITLE_SIZES = {
  sm: 'text-xl md:text-2xl',
  md: 'text-2xl md:text-3xl',
  lg: 'text-3xl md:text-4xl',
  xl: 'text-4xl md:text-5xl',
};

const SUBTITLE_SIZES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const TEXT_SIZES = {
  sm: 'prose-sm',
  md: 'prose',
  lg: 'prose-lg',
};

const FONT_WEIGHTS = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export function TextBlockSection({ 
  title, 
  subtitle, 
  content, 
  settings,
  basePath = '',
  sectionId 
}: TextBlockSectionProps) {
  const maxWidth = settings.maxWidth || 'lg';
  const paddingY = settings.paddingY || 'medium';

  // Typography settings with defaults
  const titleSize = settings.titleSize || 'lg';
  const titleWeight = settings.titleWeight || 'light';
  const subtitleSize = settings.subtitleSize || 'lg';
  const subtitleWeight = settings.subtitleWeight || 'normal';
  const textSize = settings.textSize || 'md';

  const maxWidthClass = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-2xl',
    'xl': 'max-w-4xl',
    'full': 'max-w-7xl',
  }[maxWidth];

  const paddingClass = {
    'small': 'py-8',
    'medium': 'py-16',
    'large': 'py-24',
  }[paddingY];

  // Button styles
  const buttonStyle = {
    color: settings.buttonTextColor || 'inherit',
    backgroundColor: settings.buttonBackgroundColor || 'transparent',
    borderColor: settings.buttonBorderColor || 'currentColor',
  };

  return (
    <section 
      className={`${paddingClass} px-4 ${settings.customClass || ''}`}
      style={{ 
        backgroundColor: settings.backgroundColor || 'transparent',
        marginTop: settings.marginTop ? `${settings.marginTop}px` : undefined,
        marginBottom: settings.marginBottom ? `${settings.marginBottom}px` : undefined,
      }}
      id={settings.customId || undefined}
      data-section-id={sectionId}
      data-section-name="בלוק טקסט"
    >
      {settings.customCss && <style>{settings.customCss}</style>}
      <div className={`${maxWidthClass} mx-auto text-center`}>
        {/* Title */}
        <h2 
          className={`${TITLE_SIZES[titleSize]} ${FONT_WEIGHTS[titleWeight]} tracking-wide mb-4 ${!title ? 'hidden' : ''}`}
          data-section-title
          style={{ color: settings.titleColor || 'inherit' }}
        >
          {title || ''}
        </h2>

        {/* Subtitle */}
        <p 
          className={`${SUBTITLE_SIZES[subtitleSize]} ${FONT_WEIGHTS[subtitleWeight]} opacity-80 mb-6 ${!subtitle ? 'hidden' : ''}`}
          data-section-subtitle
          style={{ color: settings.subtitleColor || 'inherit' }}
        >
          {subtitle || ''}
        </p>

        {/* Rich Text Content */}
        <div 
          className={`prose ${TEXT_SIZES[textSize]} mx-auto mb-8 ${!content.text ? 'hidden' : ''}`}
          data-content-text
          style={{ color: settings.textColor || 'inherit' }}
          dangerouslySetInnerHTML={{ __html: content.text || '' }}
        />

        {/* Button - hidden if no text */}
        <Link 
          href={content.buttonLink?.startsWith('/') ? `${basePath}${content.buttonLink}` : (content.buttonLink || '#')}
          className="inline-block px-8 py-3 border transition-colors text-sm tracking-wider uppercase"
          style={{
            ...buttonStyle,
            display: content.buttonText?.trim() ? '' : 'none',
          }}
          data-section-button
        >
          {content.buttonText || ''}
        </Link>
      </div>
    </section>
  );
}
