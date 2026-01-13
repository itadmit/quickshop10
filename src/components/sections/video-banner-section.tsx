/**
 * VideoBannerSection - Server Component
 * באנר וידאו - אפס JS, מהיר כמו PHP!
 */

import Link from 'next/link';

interface VideoBannerSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    videoUrl?: string;
    imageUrl?: string;
    mobileVideoUrl?: string;
    mobileImageUrl?: string;
    buttonText?: string;
    buttonLink?: string;
  };
  settings: {
    height?: string;
    overlay?: number;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
    backgroundColor?: string;
    // Text Alignment & Position
    textAlign?: 'right' | 'center' | 'left';
    textPosition?: 'top' | 'center' | 'bottom';
    // Typography - Title
    titleColor?: string;
    titleSize?: 'sm' | 'md' | 'lg' | 'xl';
    titleWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
    // Typography - Subtitle
    subtitleColor?: string;
    subtitleSize?: 'sm' | 'md' | 'lg';
    subtitleWeight?: 'light' | 'normal' | 'medium' | 'semibold';
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
  basePath: string;
  sectionId?: string;
}

const TITLE_SIZES = {
  sm: 'text-2xl md:text-4xl',
  md: 'text-3xl md:text-5xl',
  lg: 'text-4xl md:text-6xl lg:text-7xl',
  xl: 'text-5xl md:text-7xl lg:text-8xl',
};

const SUBTITLE_SIZES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const FONT_WEIGHTS = {
  light: 'font-extralight',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export function VideoBannerSection({ 
  title, 
  subtitle, 
  content, 
  settings, 
  basePath, 
  sectionId 
}: VideoBannerSectionProps) {
  const height = settings.height || '80vh';
  const overlay = settings.overlay ?? 0.2;
  const autoplay = settings.autoplay ?? true;
  const loop = settings.loop ?? true;
  const muted = settings.muted ?? true;
  const controls = settings.controls ?? false;

  // Text settings
  const textAlign = settings.textAlign || 'center';
  const textPosition = settings.textPosition || 'center';
  const titleSize = settings.titleSize || 'lg';
  const titleWeight = settings.titleWeight || 'light';
  const subtitleSize = settings.subtitleSize || 'sm';
  const subtitleWeight = settings.subtitleWeight || 'normal';

  // Determine what to show on mobile vs desktop
  const hasMobileMedia = content.mobileVideoUrl || content.mobileImageUrl;
  const hasDesktopVideo = content.videoUrl;
  const hasDesktopImage = content.imageUrl;
  const hasMobileVideo = content.mobileVideoUrl;
  const hasMobileImage = content.mobileImageUrl;
  const hasAnyMedia = hasDesktopVideo || hasDesktopImage || hasMobileMedia;

  // Text alignment classes
  const textAlignClass = textAlign === 'right' ? 'text-right' : textAlign === 'left' ? 'text-left' : 'text-center';
  const itemsClass = textAlign === 'right' ? 'items-end' : textAlign === 'left' ? 'items-start' : 'items-center';
  const justifyClass = textPosition === 'top' ? 'justify-start pt-20' : textPosition === 'bottom' ? 'justify-end pb-20' : 'justify-center';

  // Button styles
  const buttonStyle = {
    color: settings.buttonTextColor || '#ffffff',
    backgroundColor: settings.buttonBackgroundColor || 'transparent',
    borderColor: settings.buttonBorderColor || '#ffffff',
  };

  return (
    <section 
      className={`relative overflow-hidden ${settings.customClass || ''}`}
      style={{ 
        height,
        backgroundColor: hasAnyMedia ? 'black' : (settings.backgroundColor || '#000000'),
        marginTop: settings.marginTop ? `${settings.marginTop}px` : undefined,
        marginBottom: settings.marginBottom ? `${settings.marginBottom}px` : undefined,
      }}
      id={settings.customId || undefined}
      data-section-id={sectionId}
      data-section-name="באנר וידאו"
      data-has-media={hasAnyMedia ? 'true' : 'false'}
    >
      {settings.customCss && <style>{settings.customCss}</style>}
      
      {/* Mobile Media */}
      {hasMobileMedia && (
        <div className="md:hidden absolute inset-0" data-bg-mobile>
          {hasMobileVideo ? (
            <video 
              src={content.mobileVideoUrl}
              autoPlay={autoplay}
              muted={muted}
              loop={loop}
              playsInline
              controls={controls}
              className="w-full h-full object-cover"
              data-content-video
            />
          ) : hasMobileImage ? (
            <img 
              src={content.mobileImageUrl}
              alt={title || 'Banner'}
              className="w-full h-full object-cover"
              data-content-image
            />
          ) : null}
        </div>
      )}

      {/* Desktop Media (also fallback for mobile if no mobile media) */}
      <div className={hasMobileMedia ? 'hidden md:block absolute inset-0' : 'absolute inset-0'} data-bg-desktop>
        {hasDesktopVideo ? (
          <video 
            src={content.videoUrl}
            autoPlay={autoplay}
            muted={muted}
            loop={loop}
            playsInline
            controls={controls}
            className="w-full h-full object-cover"
            data-content-video
          />
        ) : hasDesktopImage ? (
          <img 
            src={content.imageUrl}
            alt={title || 'Banner'}
            className="w-full h-full object-cover"
            data-content-image
          />
        ) : null}
      </div>
      
      {/* Overlay + Content */}
      <div 
        className={`absolute inset-0 flex ${justifyClass} ${itemsClass}`}
        style={{ backgroundColor: `rgba(0,0,0,${overlay})` }}
        data-overlay
        data-content-container
      >
        <div className={`max-w-2xl px-6 ${textAlignClass}`}>
          <p 
            className={`${SUBTITLE_SIZES[subtitleSize]} ${FONT_WEIGHTS[subtitleWeight]} tracking-[0.4em] uppercase mb-6 ${!subtitle ? 'hidden' : ''}`}
            style={{ color: settings.subtitleColor || 'rgba(255,255,255,0.8)' }}
            data-section-subtitle
          >
            {subtitle || ''}
          </p>
          <h2 
            className={`${TITLE_SIZES[titleSize]} ${FONT_WEIGHTS[titleWeight]} tracking-[0.2em] uppercase mb-8 ${!title ? 'hidden' : ''}`}
            style={{ color: settings.titleColor || '#ffffff' }}
            data-section-title
          >
            {title || ''}
          </h2>
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
    </section>
  );
}
