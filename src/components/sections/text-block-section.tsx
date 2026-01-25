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

  const maxWidthClass = MAX_WIDTHS[maxWidth] || MAX_WIDTHS.lg;

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

  // Check if we need custom font sizes
  const hasCustomSizes = isNumericTitleSize || isNumericSubtitleSize || isNumericTextSize;

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
      data-section-type="text_block"
      data-section-name="בלוק טקסט"
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
      
      <div className={`${maxWidthClass} mx-auto text-center`}>
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
