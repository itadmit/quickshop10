/**
 * BannerSmallSection - Server Component
 * באנר קטן/הודעה - אפס JS, מהיר כמו PHP!
 * 
 * 🔧 Uses shared section-system constants
 */

import Link from 'next/link';
import { SUBTITLE_SIZES as TITLE_SIZES, FONT_WEIGHTS } from '@/lib/section-system';
import type { SubtitleSize, FontWeight } from '@/lib/section-system';

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
    // Typography - Title (supports both string keys and numeric px values)
    titleColor?: string;
    titleSize?: SubtitleSize | number;
    titleSizeMobile?: number;
    titleWeight?: FontWeight;
    // Typography - Subtitle
    subtitleColor?: string;
    subtitleSize?: number;
    subtitleSizeMobile?: number;
    subtitleWeight?: FontWeight;
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
    // Visibility
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
  };
  basePath?: string;
  sectionId?: string;
}

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
  
  // Check for numeric font sizes
  const titleSizeValue = settings.titleSize;
  const isNumericTitleSize = typeof titleSizeValue === 'number';
  const titleSize = isNumericTitleSize ? 'md' : (titleSizeValue || 'md');
  const titleWeight = settings.titleWeight || 'medium';
  
  const subtitleSizeValue = settings.subtitleSize;
  const isNumericSubtitleSize = typeof subtitleSizeValue === 'number';
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

  const hasCustomSizes = isNumericTitleSize || isNumericSubtitleSize;
  
  // Visibility classes
  const hideOnMobileClass = settings.hideOnMobile ? 'max-md:hidden' : '';
  const hideOnDesktopClass = settings.hideOnDesktop ? 'md:hidden' : '';

  return (
    <section 
      className={`${paddingY} px-4 ${hideOnMobileClass} ${hideOnDesktopClass} ${settings.customClass || ''}`.trim()}
      style={{ 
        backgroundColor,
        marginTop: settings.marginTop ? `${settings.marginTop}px` : undefined,
        marginBottom: settings.marginBottom ? `${settings.marginBottom}px` : undefined,
      }}
      id={settings.customId || undefined}
      data-section-id={sectionId}
      data-section-type="banner_small"
      data-section-name="באנר קטן"
      {...(settings.hideOnMobile && { 'data-hide-on-mobile': 'true' })}
      {...(settings.hideOnDesktop && { 'data-hide-on-desktop': 'true' })}
    >
      {settings.customCss && <style>{settings.customCss}</style>}
      
      {/* Scoped responsive styles for numeric font sizes */}
      {hasCustomSizes && (
        <style dangerouslySetInnerHTML={{ __html: `
          ${isNumericTitleSize ? `
            [data-section-id="${sectionId}"] [data-section-title] {
              font-size: ${settings.titleSizeMobile || (titleSizeValue as number) * 0.8}px !important;
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
      
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-right">
        {/* Icon */}
        {content.icon && (
          <span className="text-2xl">{content.icon}</span>
        )}

        {/* Text */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <span 
            className={`${!isNumericTitleSize ? TITLE_SIZES[titleSize as SubtitleSize] : ''} ${FONT_WEIGHTS[titleWeight]} ${!title ? 'hidden' : ''}`}
            style={{ color: settings.titleColor || '#ffffff' }}
            data-section-title
          >
            {title || ''}
          </span>
          <span 
            className={`${!isNumericSubtitleSize ? TITLE_SIZES[titleSize as SubtitleSize] : ''} ${FONT_WEIGHTS[subtitleWeight]} opacity-80 ${!subtitle ? 'hidden' : ''}`}
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
