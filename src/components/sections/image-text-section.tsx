/**
 * ImageTextSection - Server Component
 * תמונה + טקסט (ימין/שמאל) - אפס JS, מהיר כמו PHP!
 */

import Link from 'next/link';

interface ImageTextSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    imageUrl?: string;
    text?: string;
    buttonText?: string;
    buttonLink?: string;
  };
  settings: {
    imagePosition?: 'right' | 'left';
    imageWidth?: '40%' | '50%' | '60%';
    height?: string;
    backgroundColor?: string;
    overlay?: number;
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

export function ImageTextSection({ 
  title, 
  subtitle, 
  content, 
  settings,
  basePath = '',
  sectionId 
}: ImageTextSectionProps) {
  const imagePosition = settings.imagePosition || 'right';
  const imageWidth = settings.imageWidth || '50%';
  const height = settings.height || 'auto';

  // Typography settings with defaults
  const titleSize = settings.titleSize || 'lg';
  const titleWeight = settings.titleWeight || 'light';
  const subtitleSize = settings.subtitleSize || 'lg';
  const subtitleWeight = settings.subtitleWeight || 'normal';
  const textSize = settings.textSize || 'sm';

  // Determine flex direction based on image position (RTL aware)
  const flexDirection = imagePosition === 'right' ? 'flex-row' : 'flex-row-reverse';

  // Button styles
  const buttonStyle = {
    color: settings.buttonTextColor || 'black',
    backgroundColor: settings.buttonBackgroundColor || 'transparent',
    borderColor: settings.buttonBorderColor || 'black',
  };

  return (
    <section 
      className={`py-12 md:py-0 ${settings.customClass || ''}`}
      style={{ 
        backgroundColor: settings.backgroundColor || 'transparent',
        marginTop: settings.marginTop ? `${settings.marginTop}px` : undefined,
        marginBottom: settings.marginBottom ? `${settings.marginBottom}px` : undefined,
      }}
      id={settings.customId || undefined}
      data-section-id={sectionId}
      data-section-name="תמונה + טקסט"
    >
      {settings.customCss && <style>{settings.customCss}</style>}
      <div 
        className={`flex flex-col md:${flexDirection} min-h-[400px]`} 
        style={{ 
          minHeight: height !== 'auto' ? height : undefined,
          flexDirection: imagePosition === 'right' ? 'row' : 'row-reverse',
        }}
        data-image-text-container
      >
        {/* Image Side */}
        <div 
          className="w-full md:w-1/2 relative overflow-hidden"
          style={{ 
            flexBasis: imageWidth,
            width: imageWidth,
            minHeight: '300px'
          }}
          data-image-container
        >
          <img 
            src={content.imageUrl || ''} 
            alt={title || ''} 
            className={`w-full h-full object-cover absolute inset-0 ${!content.imageUrl ? 'hidden' : ''}`}
            data-content-image
          />
          {settings.overlay && settings.overlay > 0 && (
            <div 
              className="absolute inset-0" 
              style={{ backgroundColor: `rgba(0,0,0,${settings.overlay})` }}
              data-overlay
            />
          )}
          <div className={`w-full h-full bg-gray-100 flex items-center justify-center ${content.imageUrl ? 'hidden' : ''}`} data-image-placeholder>
            <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Text Side */}
        <div 
          className="w-full md:w-1/2 flex items-center p-8 md:p-12 lg:p-16"
          style={{ 
            flexBasis: `calc(100% - ${imageWidth})`,
            width: `calc(100% - ${imageWidth})`,
          }}
          data-text-container
        >
          <div className="max-w-lg mx-auto">
            <h2 
              className={`${TITLE_SIZES[titleSize]} ${FONT_WEIGHTS[titleWeight]} tracking-wide mb-4 ${!title ? 'hidden' : ''}`}
              style={{ color: settings.titleColor || 'inherit' }}
              data-section-title
            >
              {title || ''}
            </h2>
            <p 
              className={`${SUBTITLE_SIZES[subtitleSize]} ${FONT_WEIGHTS[subtitleWeight]} mb-4 ${!subtitle ? 'hidden' : ''}`}
              style={{ color: settings.subtitleColor || '#4b5563' }}
              data-section-subtitle
            >
              {subtitle || ''}
            </p>
            <div 
              className={`leading-relaxed mb-6 prose ${TEXT_SIZES[textSize]} ${!content.text ? 'hidden' : ''}`}
              style={{ color: settings.textColor || '#4b5563' }}
              data-content-text
              dangerouslySetInnerHTML={{ __html: content.text || '' }}
            />
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
        </div>
      </div>
    </section>
  );
}

