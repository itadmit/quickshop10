/**
 * VideoBannerSection - Server Component
 * באנר וידאו - אפס JS, מהיר כמו PHP!
 * 
 * 🔧 Uses shared section-system constants
 */

import Link from 'next/link';
import { 
  TITLE_SIZES_LARGE as TITLE_SIZES, 
  SUBTITLE_SIZES_HERO as SUBTITLE_SIZES, 
  FONT_WEIGHTS_HERO as FONT_WEIGHTS 
} from '@/lib/section-system';
import type { TitleSize, SubtitleSize, FontWeight } from '@/lib/section-system';

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
    minHeight?: number;
    minHeightUnit?: 'vh' | 'px';
    overlay?: number;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
    backgroundColor?: string;
    sectionWidth?: 'full' | 'container';
    // Text Alignment & Position
    textAlign?: 'right' | 'center' | 'left';
    textPosition?: 'top' | 'center' | 'bottom';
    verticalAlign?: 'top' | 'center' | 'bottom';
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
    // Visibility
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
  };
  basePath: string;
  sectionId?: string;
}

export function VideoBannerSection({ 
  title, 
  subtitle, 
  content, 
  settings, 
  basePath, 
  sectionId 
}: VideoBannerSectionProps) {
  // Height - support both old height prop and new minHeight
  const minHeightValue = settings.minHeight || 90;
  const minHeightUnit = settings.minHeightUnit || 'vh';
  const height = settings.height || `${minHeightValue}${minHeightUnit}`;
  
  const overlay = settings.overlay ?? 0.4;
  const autoplay = settings.autoplay ?? true;
  const loop = settings.loop ?? true;
  const muted = settings.muted ?? true;
  const controls = settings.controls ?? false;

  // Text settings
  const textAlign = settings.textAlign || 'center';
  // Support both textPosition (old) and verticalAlign (new)
  const textPosition = settings.verticalAlign || settings.textPosition || 'center';
  
  // Check for numeric font sizes
  const titleSizeValue = settings.titleSize;
  const isNumericTitleSize = typeof titleSizeValue === 'number';
  const titleSize = isNumericTitleSize ? 'lg' : (titleSizeValue || 'lg');
  const titleWeight = settings.titleWeight || 'light';
  
  const subtitleSizeValue = settings.subtitleSize;
  const isNumericSubtitleSize = typeof subtitleSizeValue === 'number';
  const subtitleSize = isNumericSubtitleSize ? 'sm' : (subtitleSizeValue || 'sm');
  const subtitleWeight = settings.subtitleWeight || 'normal';

  // Determine what to show on mobile vs desktop
  const hasMobileMedia = content.mobileVideoUrl || content.mobileImageUrl;
  const hasDesktopVideo = content.videoUrl;
  const hasDesktopImage = content.imageUrl;
  const hasMobileVideo = content.mobileVideoUrl;
  const hasMobileImage = content.mobileImageUrl;
  const hasAnyMedia = hasDesktopVideo || hasDesktopImage || hasMobileMedia;

  // Text alignment classes - using flex-col so:
  // justify-* = vertical (main axis), items-* = horizontal (cross axis)
  const textAlignClass = textAlign === 'right' ? 'text-right items-start' 
    : textAlign === 'left' ? 'text-left items-end' 
    : 'text-center items-center';
  const verticalAlignClass = textPosition === 'top' ? 'justify-start pt-20' 
    : textPosition === 'bottom' ? 'justify-end pb-20' 
    : 'justify-center';

  // Button styles
  const buttonStyle = {
    color: settings.buttonTextColor || '#ffffff',
    backgroundColor: settings.buttonBackgroundColor || 'transparent',
    borderColor: settings.buttonBorderColor || '#ffffff',
  };

  const hasCustomSizes = isNumericTitleSize || isNumericSubtitleSize;
  
  // Visibility classes
  const hideOnMobileClass = settings.hideOnMobile ? 'max-md:hidden' : '';
  const hideOnDesktopClass = settings.hideOnDesktop ? 'md:hidden' : '';

  return (
    <section 
      className={`relative overflow-hidden ${hideOnMobileClass} ${hideOnDesktopClass} ${settings.customClass || ''}`.trim()}
      style={{ 
        minHeight: height,
        backgroundColor: hasAnyMedia ? 'black' : (settings.backgroundColor || '#000000'),
        marginTop: settings.marginTop ? `${settings.marginTop}px` : undefined,
        marginBottom: settings.marginBottom ? `${settings.marginBottom}px` : undefined,
      }}
      id={settings.customId || undefined}
      data-section-id={sectionId}
      data-section-type="video_banner"
      data-section-name="באנר וידאו"
      data-has-media={hasAnyMedia ? 'true' : 'false'}
      {...(settings.hideOnMobile && { 'data-hide-on-mobile': 'true' })}
      {...(settings.hideOnDesktop && { 'data-hide-on-desktop': 'true' })}
    >
      {settings.customCss && <style>{settings.customCss}</style>}
      
      {/* Scoped responsive styles for numeric font sizes */}
      {hasCustomSizes && (
        <style dangerouslySetInnerHTML={{ __html: `
          ${isNumericTitleSize ? `
            [data-section-id="${sectionId}"] [data-section-title] {
              font-size: ${settings.titleSizeMobile || (titleSizeValue as number) * 0.6}px !important;
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
        className={`absolute inset-0 flex flex-col ${textAlignClass} ${verticalAlignClass}`}
        style={{ backgroundColor: `rgba(0,0,0,${overlay})` }}
        data-overlay
        data-content-container
      >
        <div className={`max-w-2xl px-6 ${textAlignClass}`}>
          <p 
            className={`${!isNumericSubtitleSize ? SUBTITLE_SIZES[subtitleSize as SubtitleSize] : ''} ${FONT_WEIGHTS[subtitleWeight]} tracking-[0.4em] uppercase mb-6 ${!subtitle ? 'hidden' : ''}`}
            style={{ color: settings.subtitleColor || 'rgba(255,255,255,0.8)' }}
            data-section-subtitle
          >
            {subtitle || ''}
          </p>
          <h2 
            className={`${!isNumericTitleSize ? TITLE_SIZES[titleSize as TitleSize] : ''} ${FONT_WEIGHTS[titleWeight]} tracking-[0.2em] uppercase mb-8 ${!title ? 'hidden' : ''}`}
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
