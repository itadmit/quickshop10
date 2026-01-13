/**
 * BannerSmallSection - Server Component
 * באנר קטן/הודעה - אפס JS, מהיר כמו PHP!
 */

import Link from 'next/link';

interface BannerSmallSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    buttonText?: string;
    buttonLink?: string;
    icon?: string;
  };
  settings: {
    backgroundColor?: string;
    size?: 'small' | 'medium' | 'large';
    // Typography - Title
    titleColor?: string;
    titleSize?: 'sm' | 'md' | 'lg';
    titleWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
    // Typography - Subtitle
    subtitleColor?: string;
    subtitleWeight?: 'light' | 'normal' | 'medium' | 'semibold';
    // Button
    buttonTextColor?: string;
    buttonBackgroundColor?: string;
    buttonBorderColor?: string;
    buttonStyle?: 'outline' | 'filled' | 'none';
    // Spacing
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
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const FONT_WEIGHTS = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export function BannerSmallSection({ 
  title, 
  subtitle, 
  content, 
  settings,
  basePath = '',
  sectionId 
}: BannerSmallSectionProps) {
  const backgroundColor = settings.backgroundColor || '#000000';
  const buttonStyle = settings.buttonStyle || 'outline';
  const size = settings.size || 'medium';
  const titleSize = settings.titleSize || 'md';
  const titleWeight = settings.titleWeight || 'medium';
  const subtitleWeight = settings.subtitleWeight || 'normal';

  const paddingY = {
    small: 'py-3',
    medium: 'py-5',
    large: 'py-8',
  }[size];

  // Button styles
  const buttonStyle_obj = {
    color: settings.buttonTextColor || (buttonStyle === 'filled' ? backgroundColor : '#ffffff'),
    backgroundColor: buttonStyle === 'filled' ? (settings.buttonBackgroundColor || '#ffffff') : 'transparent',
    borderColor: settings.buttonBorderColor || '#ffffff',
  };

  return (
    <section 
      className={`${paddingY} px-4 ${settings.customClass || ''}`}
      style={{ 
        backgroundColor,
        marginTop: settings.marginTop ? `${settings.marginTop}px` : undefined,
        marginBottom: settings.marginBottom ? `${settings.marginBottom}px` : undefined,
      }}
      id={settings.customId || undefined}
      data-section-id={sectionId}
      data-section-name="באנר קטן"
    >
      {settings.customCss && <style>{settings.customCss}</style>}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-right">
        {/* Icon */}
        {content.icon && (
          <span className="text-2xl">{content.icon}</span>
        )}

        {/* Text */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <span 
            className={`${TITLE_SIZES[titleSize]} ${FONT_WEIGHTS[titleWeight]} ${!title ? 'hidden' : ''}`}
            style={{ color: settings.titleColor || '#ffffff' }}
            data-section-title
          >
            {title || ''}
          </span>
          <span 
            className={`${TITLE_SIZES[titleSize]} ${FONT_WEIGHTS[subtitleWeight]} opacity-80 ${!subtitle ? 'hidden' : ''}`}
            style={{ color: settings.subtitleColor || '#ffffff' }}
            data-section-subtitle
          >
            {subtitle || ''}
          </span>
        </div>

        {/* Button */}
        <Link 
          href={content.buttonLink?.startsWith('/') ? `${basePath}${content.buttonLink}` : (content.buttonLink || '#')}
          className="px-4 py-1.5 text-sm font-medium transition-colors border"
          style={{
            ...buttonStyle_obj,
            display: (buttonStyle === 'none' || !content.buttonText?.trim()) ? 'none' : '',
          }}
          data-section-button
        >
          {content.buttonText || ''}
        </Link>
      </div>
    </section>
  );
}
