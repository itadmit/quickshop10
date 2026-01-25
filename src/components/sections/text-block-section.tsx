/**
 * TextBlockSection - Server Component
 * בלוק טקסט עשיר - אפס JS, מהיר כמו PHP!
 * 
 * 🔧 Uses shared section-system constants
 */

import Link from 'next/link';
import { 
  TITLE_SIZES, 
  SUBTITLE_SIZES, 
  TEXT_SIZES, 
  FONT_WEIGHTS,
  MAX_WIDTHS,
} from '@/lib/section-system';
import type { 
  TitleSize, 
  SubtitleSize, 
  TextSize, 
  FontWeight 
} from '@/lib/section-system';

interface TextBlockSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    text?: string;
    buttonText?: string;
    buttonLink?: string;
  };
  settings: {
    // Section Width (Elementor style)
    sectionWidth?: 'boxed' | 'full';
    contentWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    // Legacy maxWidth support
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    backgroundColor?: string;
    // Typography - Title (supports both string keys and numeric px values)
    titleColor?: string;
    titleSize?: TitleSize | number;
    titleSizeMobile?: number;
    titleWeight?: FontWeight;
    // Typography - Subtitle
    subtitleColor?: string;
    subtitleSize?: SubtitleSize | number;
    subtitleSizeMobile?: number;
    subtitleWeight?: FontWeight;
    // Typography - Content
    textColor?: string;
    textSize?: TextSize | number;
    textSizeMobile?: number;
    // Button
    buttonTextColor?: string;
    buttonBackgroundColor?: string;
    buttonBorderColor?: string;
    // Spacing - explicit pixel values
    paddingY?: 'small' | 'medium' | 'large'; // Legacy support
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    // Custom
    customClass?: string;
    customId?: string;
    customCss?: string;
    // Advanced
    zIndex?: number | string;
    minHeight?: number;
    minHeightUnit?: 'px' | 'vh';
    verticalAlign?: 'start' | 'center' | 'end';
    // Animation
    animation?: 'none' | 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight';
    animationDuration?: number;
    // Visibility
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
  };
  basePath?: string;
  sectionId?: string;
}

export function TextBlockSection({ 
  title, 
  subtitle, 
  content, 
  settings,
  basePath = '',
  sectionId 
}: TextBlockSectionProps) {
  // Section width - full or boxed (container)
  const sectionWidth = settings.sectionWidth || 'boxed';
  const contentWidth = settings.contentWidth || settings.maxWidth || 'lg';
  const paddingY = settings.paddingY || 'medium';

  // Typography settings with defaults - check if numeric or string
  const titleSizeValue = settings.titleSize;
  const isNumericTitleSize = typeof titleSizeValue === 'number';
  const titleSize = isNumericTitleSize ? 'lg' : (titleSizeValue || 'lg');
  const titleWeight = settings.titleWeight || 'light';
  
  const subtitleSizeValue = settings.subtitleSize;
  const isNumericSubtitleSize = typeof subtitleSizeValue === 'number';
  const subtitleSize = isNumericSubtitleSize ? 'lg' : (subtitleSizeValue || 'lg');
  const subtitleWeight = settings.subtitleWeight || 'normal';
  
  const textSizeValue = settings.textSize;
  const isNumericTextSize = typeof textSizeValue === 'number';
  const textSize = isNumericTextSize ? 'md' : (textSizeValue || 'md');

  // Content max-width class (only if boxed)
  const contentMaxWidth = sectionWidth === 'full' ? 'full' : contentWidth;
  const maxWidthClass = MAX_WIDTHS[contentMaxWidth as keyof typeof MAX_WIDTHS] || MAX_WIDTHS.lg;

  // Legacy paddingY support - convert to pixels
  const paddingYMap = {
    'small': 32,  // py-8
    'medium': 64, // py-16
    'large': 96,  // py-24
  };

  // Use explicit paddingTop/Bottom if set, otherwise use paddingY setting
  const paddingTopValue = settings.paddingTop ?? settings.paddingBottom ?? paddingYMap[paddingY];
  const paddingBottomValue = settings.paddingBottom ?? settings.paddingTop ?? paddingYMap[paddingY];
  const paddingLeftValue = settings.paddingLeft ?? settings.paddingRight ?? 16; // px-4 = 16px
  const paddingRightValue = settings.paddingRight ?? settings.paddingLeft ?? 16;

  // Button styles
  const buttonStyle = {
    color: settings.buttonTextColor || 'inherit',
    backgroundColor: settings.buttonBackgroundColor || 'transparent',
    borderColor: settings.buttonBorderColor || 'currentColor',
  };

  // Check if we need custom font sizes
  const hasCustomSizes = isNumericTitleSize || isNumericSubtitleSize || isNumericTextSize;

  // Visibility classes for responsive hiding (production only)
  const hideOnMobileClass = settings.hideOnMobile ? 'max-md:hidden' : '';
  const hideOnDesktopClass = settings.hideOnDesktop ? 'md:hidden' : '';

  // Animation settings
  const animation = settings.animation || 'none';
  const animationDuration = settings.animationDuration || 0.6;
  const animationClass = animation !== 'none' ? `animate-${animation}` : '';

  // Vertical alignment (requires flex when minHeight is set)
  const hasMinHeight = settings.minHeight && settings.minHeight > 0;
  const verticalAlign = settings.verticalAlign || 'center';
  const verticalAlignMap: Record<string, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
  };

  return (
    <section 
      className={`${hideOnMobileClass} ${hideOnDesktopClass} ${animationClass} ${settings.customClass || ''}`.trim()}
      style={{ 
        backgroundColor: settings.backgroundColor || 'transparent',
        // Use explicit pixel values for spacing (no Tailwind)
        paddingTop: `${paddingTopValue}px`,
        paddingBottom: `${paddingBottomValue}px`,
        paddingLeft: `${paddingLeftValue}px`,
        paddingRight: `${paddingRightValue}px`,
        marginTop: settings.marginTop ? `${settings.marginTop}px` : undefined,
        marginBottom: settings.marginBottom ? `${settings.marginBottom}px` : undefined,
        marginLeft: settings.marginLeft ? `${settings.marginLeft}px` : undefined,
        marginRight: settings.marginRight ? `${settings.marginRight}px` : undefined,
        zIndex: settings.zIndex ? Number(settings.zIndex) : undefined,
        // Min height with flex for vertical alignment
        minHeight: hasMinHeight ? `${settings.minHeight}${settings.minHeightUnit || 'px'}` : undefined,
        display: hasMinHeight ? 'flex' : undefined,
        flexDirection: hasMinHeight ? 'column' : undefined,
        justifyContent: hasMinHeight ? verticalAlignMap[verticalAlign] : undefined,
        // Animation duration as CSS variable
        ['--animation-duration' as string]: `${animationDuration}s`,
      }}
      id={settings.customId || undefined}
      data-section-id={sectionId}
      data-section-type="text_block"
      data-section-name="בלוק טקסט"
      data-animation={animation}
      data-animation-duration={animationDuration}
      data-min-height={settings.minHeight || undefined}
      data-min-height-unit={settings.minHeightUnit || 'px'}
      data-vertical-align={verticalAlign}
      data-hide-on-mobile={settings.hideOnMobile ? 'true' : undefined}
      data-hide-on-desktop={settings.hideOnDesktop ? 'true' : undefined}
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
          ${isNumericTextSize ? `
            [data-section-id="${sectionId}"] [data-content-text] {
              font-size: ${settings.textSizeMobile || (textSizeValue as number) * 0.9}px !important;
            }
            @media (min-width: 768px) {
              [data-section-id="${sectionId}"] [data-content-text] {
                font-size: ${textSizeValue}px !important;
              }
            }
          ` : ''}
        `}} />
      )}
      
      <div 
        className={`${maxWidthClass} mx-auto text-center`}
        data-content-wrapper
      >
        {/* Title */}
        <h2 
          className={`${!isNumericTitleSize ? TITLE_SIZES[titleSize as TitleSize] : ''} ${FONT_WEIGHTS[titleWeight]} tracking-wide mb-4 ${!title ? 'hidden' : ''}`}
          data-section-title
          style={{ color: settings.titleColor || 'inherit' }}
        >
          {title || ''}
        </h2>

        {/* Subtitle */}
        <p 
          className={`${!isNumericSubtitleSize ? SUBTITLE_SIZES[subtitleSize as SubtitleSize] : ''} ${FONT_WEIGHTS[subtitleWeight]} opacity-80 mb-6 ${!subtitle ? 'hidden' : ''}`}
          data-section-subtitle
          style={{ color: settings.subtitleColor || 'inherit' }}
        >
          {subtitle || ''}
        </p>

        {/* Rich Text Content */}
        <div 
          className={`prose ${!isNumericTextSize ? TEXT_SIZES[textSize as TextSize] : ''} mx-auto mb-8 ${!content.text ? 'hidden' : ''}`}
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
