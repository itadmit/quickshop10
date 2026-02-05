/**
 * ContentBlockSection - בלוק תוכן אוניברסלי
 * סקשן אחד - מה שריק פשוט לא מוצג
 * 
 * תוכן אפשרי:
 * - כותרת + תת-כותרת
 * - טקסט
 * - תמונת רקע (מחשב + מובייל)
 * - וידאו רקע (מחשב + מובייל)
 * - כפתור
 */

import Link from 'next/link';
import { ScrollArrow } from './content-block/ScrollArrow';

interface ContentBlockSectionProps {
  sectionId?: string;
  title: string | null;
  subtitle: string | null;
  content: {
    text?: string;
    buttonText?: string;
    buttonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
    // Media
    imageUrl?: string;
    mobileImageUrl?: string;
    videoUrl?: string;
    mobileVideoUrl?: string;
  };
  settings: {
    
    // Layout
    height?: string;
    mobileHeight?: string;
    minHeight?: number;
    minHeightUnit?: 'px' | 'vh';
    sectionWidth?: 'full' | 'boxed';
    contentWidth?: number;
    textAlign?: 'right' | 'center' | 'left';
    verticalAlign?: 'top' | 'center' | 'bottom';
    
    // Background
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundVideo?: string;
    backgroundSize?: string;
    backgroundPosition?: string;
    backgroundMaxWidth?: number; // רוחב מירבי לתמונת רקע עם margin auto
    overlay?: number;
    showGradient?: boolean;
    gradientDirection?: 'top' | 'bottom' | 'left' | 'right';
    
    // Typography - Title
    titleColor?: string;
    titleSize?: number;
    titleSizeMobile?: number;
    titleWeight?: string;
    
    // Typography - Subtitle
    subtitleColor?: string;
    subtitleSize?: number;
    subtitleSizeMobile?: number;
    subtitleWeight?: string;
    
    // Typography - Text
    textColor?: string;
    textSize?: number;
    textSizeMobile?: number;
    
    // Button
    buttonStyle?: 'filled' | 'outline' | 'underline';
    buttonTextColor?: string;
    buttonBackgroundColor?: string;
    buttonBorderColor?: string;
    buttonBorderWidth?: number;
    buttonBorderRadius?: number;
    
    // Spacing
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    marginTop?: number;
    marginBottom?: number;
    
    // Advanced
    zIndex?: number;
    customClass?: string;
    customId?: string;
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
    showScrollArrow?: boolean;
    
    // Animation
    animation?: string;
    animationDuration?: number;
  };
  basePath: string;
}

export function ContentBlockSection({ 
  sectionId,
  title, 
  subtitle, 
  content, 
  settings, 
  basePath 
}: ContentBlockSectionProps) {
  
  // ====================================
  // Auto-detect content type for smart defaults
  // ====================================
  const hasVideo = !!(content.videoUrl || content.mobileVideoUrl);
  const hasImage = !!(content.imageUrl || content.mobileImageUrl);
  const hasMedia = hasVideo || hasImage;
  
  // Smart defaults based on what content exists
  const defaults = {
    // If has media - 90vh, if no media - auto height with 400px min
    minHeight: hasMedia ? 90 : 400,
    minHeightUnit: hasMedia ? 'vh' : 'px',
    backgroundColor: hasMedia ? '#000000' : '#ffffff',
    textAlign: 'center' as const,
    verticalAlign: 'center' as const,
    titleColor: hasMedia ? '#ffffff' : '#000000',
    subtitleColor: hasMedia ? 'rgba(255,255,255,0.9)' : '#6b7280',
    textColor: hasMedia ? '#ffffff' : '#374151',
    buttonStyle: hasMedia ? 'filled' as const : 'outline' as const,
    buttonTextColor: hasMedia ? '#000000' : '#000000',
    buttonBackgroundColor: hasMedia ? '#ffffff' : 'transparent',
    buttonBorderColor: '#000000',
    showGradient: hasVideo, // gradient for video backgrounds
    overlay: hasMedia ? 0.3 : 0,
  };


  // ====================================
  // Settings with Smart Defaults
  // ====================================
  // minHeight: null/undefined/0 means auto (no minHeight)
  const rawMinHeight = settings.minHeight;
  const minHeight = (rawMinHeight !== undefined && rawMinHeight !== null && rawMinHeight !== 0) 
    ? rawMinHeight 
    : null;
  const minHeightUnit = settings.minHeightUnit || defaults.minHeightUnit || 'px';
  const backgroundColor = settings.backgroundColor || defaults.backgroundColor;
  const textAlign = settings.textAlign || defaults.textAlign;
  const verticalAlign = settings.verticalAlign || defaults.verticalAlign;
  const overlay = settings.overlay ?? defaults.overlay;
  const showGradient = settings.showGradient ?? defaults.showGradient;
  const gradientDirection = settings.gradientDirection || 'top';
  
  // Typography - bigger sizes if has media (matching hero section)
  const titleColor = settings.titleColor || defaults.titleColor;
  const titleSize = settings.titleSize || (hasMedia ? 96 : 36);
  const titleSizeMobile = settings.titleSizeMobile || (hasMedia ? 48 : 28);
  // Hero uses extralight font, text-block uses bold
  const titleWeight = settings.titleWeight || (hasMedia ? 'extralight' : 'bold');
  
  const subtitleColor = settings.subtitleColor || defaults.subtitleColor;
  const subtitleSize = settings.subtitleSize || (hasMedia ? 14 : 18);
  const subtitleSizeMobile = settings.subtitleSizeMobile || (hasMedia ? 12 : 16);
  const subtitleWeight = settings.subtitleWeight || 'normal';
  
  const textColor = settings.textColor || defaults.textColor;
  const textSize = settings.textSize || 16;
  const textSizeMobile = settings.textSizeMobile || 14;
  
  // Button
  const buttonStyle = settings.buttonStyle || defaults.buttonStyle;
  const buttonTextColor = settings.buttonTextColor || defaults.buttonTextColor;
  const buttonBgColor = settings.buttonBackgroundColor || defaults.buttonBackgroundColor || 'transparent';
  const buttonBorderColor = settings.buttonBorderColor || defaults.buttonBorderColor || buttonTextColor;
  const buttonBorderWidth = settings.buttonBorderWidth ?? (buttonStyle === 'outline' ? 2 : 0);
  const buttonBorderRadius = settings.buttonBorderRadius ?? 0;
  
  // Content Width
  const sectionWidth = settings.sectionWidth || 'full';
  const contentWidth = settings.contentWidth || 1200;

  // Background Image Settings
  const backgroundSize = settings.backgroundSize || 'cover';
  const backgroundPosition = settings.backgroundPosition || 'center';

  // Spacing - more padding for text-only
  // When contain/width + auto height, no padding (image takes full width)
  const isImageFullWidth = (backgroundSize === 'contain' || backgroundSize === 'width') && minHeight === null;
  const paddingTop = settings.paddingTop ?? (hasMedia ? 0 : 64);
  const paddingBottom = settings.paddingBottom ?? (hasMedia ? 80 : 64);
  const paddingLeft = settings.paddingLeft ?? (isImageFullWidth ? 0 : 24);
  const paddingRight = settings.paddingRight ?? (isImageFullWidth ? 0 : 24);

  // ====================================
  // Media Detection (for rendering)
  // ====================================
  const hasDesktopVideo = !!content.videoUrl || !!settings.backgroundVideo;
  const hasMobileVideo = !!content.mobileVideoUrl;
  const hasDesktopImage = !!content.imageUrl || !!settings.backgroundImage;
  const hasMobileImage = !!content.mobileImageUrl;
  // hasMedia already defined above for smart defaults

  // ====================================
  // Alignment Classes
  // ====================================
  const textAlignClass = textAlign === 'right' ? 'text-right items-start' 
    : textAlign === 'left' ? 'text-left items-end' 
    : 'text-center items-center';
    
  const verticalAlignClass = verticalAlign === 'top' ? 'justify-start pt-20' 
    : verticalAlign === 'bottom' ? 'justify-end pb-20' 
    : 'justify-center';

  // ====================================
  // Gradient CSS
  // ====================================
  const gradientStyle = showGradient ? {
    background: gradientDirection === 'top' 
      ? 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
      : gradientDirection === 'bottom'
      ? 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
      : gradientDirection === 'left'
      ? 'linear-gradient(to left, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
      : 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
  } : {};

  // ====================================
  // Visibility Classes
  // ====================================
  const hideOnMobileClass = settings.hideOnMobile ? 'max-md:hidden' : '';
  const hideOnDesktopClass = settings.hideOnDesktop ? 'md:hidden' : '';

  // ====================================
  // Button Styles
  // ====================================
  const getButtonStyle = () => {
    const base: React.CSSProperties = {
      color: buttonTextColor,
      borderRadius: `${buttonBorderRadius}px`,
      textDecoration: buttonStyle === 'underline' ? 'underline' : 'none',
    };
    
    if (buttonStyle === 'filled') {
      return { ...base, backgroundColor: buttonBgColor, border: 'none' };
    }
    if (buttonStyle === 'outline') {
      return { ...base, backgroundColor: 'transparent', border: `${buttonBorderWidth}px solid ${buttonBorderColor}` };
    }
    // underline
    return { ...base, backgroundColor: 'transparent', border: 'none' };
  };

  // ====================================
  // Render
  // ====================================
  return (
    <section
      id={settings.customId || undefined}
      data-section-id={sectionId}
      data-section-type="content_block"
      data-section-name="בלוק תוכן"
      data-hide-on-mobile={settings.hideOnMobile || false}
      data-hide-on-desktop={settings.hideOnDesktop || false}
      className={`relative overflow-hidden ${hideOnMobileClass} ${hideOnDesktopClass} ${settings.customClass || ''}`.trim()}
      style={{
        // When contain + auto height, use transparent background (image determines look)
        backgroundColor: isImageFullWidth ? 'transparent' : (hasMedia ? undefined : backgroundColor),
        minHeight: minHeight !== null ? `${minHeight}${minHeightUnit}` : undefined,
        paddingTop: isImageFullWidth ? 0 : `${paddingTop}px`,
        paddingBottom: isImageFullWidth ? 0 : `${paddingBottom}px`,
        paddingLeft: `${paddingLeft}px`,
        paddingRight: `${paddingRight}px`,
        marginTop: settings.marginTop ? `${settings.marginTop}px` : undefined,
        marginBottom: settings.marginBottom ? `${settings.marginBottom}px` : undefined,
        zIndex: settings.zIndex,
        // Don't use flex when image determines height
        display: isImageFullWidth ? 'block' : 'flex',
        flexDirection: isImageFullWidth ? undefined : 'column',
      }}
    >
      {/* Scoped CSS for responsive typography */}
      <style dangerouslySetInnerHTML={{ __html: `
        [data-section-id="${sectionId}"] [data-section-title] {
          font-size: ${titleSize}px;
          font-weight: ${titleWeight === 'extralight' ? 200 : titleWeight === 'light' ? 300 : titleWeight === 'normal' ? 400 : titleWeight === 'medium' ? 500 : titleWeight === 'semibold' ? 600 : titleWeight === 'bold' ? 700 : 800};
          color: ${titleColor};
        }
        [data-section-id="${sectionId}"] [data-section-subtitle] {
          font-size: ${subtitleSize}px;
          font-weight: ${subtitleWeight === 'light' ? 300 : subtitleWeight === 'normal' ? 400 : subtitleWeight === 'medium' ? 500 : subtitleWeight === 'semibold' ? 600 : 700};
          color: ${subtitleColor};
        }
        [data-section-id="${sectionId}"] [data-content-text] {
          font-size: ${textSize}px;
          color: ${textColor};
        }
        @media (max-width: 768px) {
          [data-section-id="${sectionId}"] [data-section-title] { font-size: ${titleSizeMobile}px; }
          [data-section-id="${sectionId}"] [data-section-subtitle] { font-size: ${subtitleSizeMobile}px; }
          [data-section-id="${sectionId}"] [data-content-text] { font-size: ${textSizeMobile}px; }
        }
      `}} />

      {/* ==================== BACKGROUND IMAGE ==================== */}
      {hasDesktopImage && !hasDesktopVideo && (
        <>
          {/* When width/contain + auto height: use img element so image determines height */}
          {(backgroundSize === 'contain' || backgroundSize === 'width') && minHeight === null ? (
            <>
              {/* Desktop Image as img element - full width, height auto */}
              <img 
                src={content.imageUrl || settings.backgroundImage}
                alt=""
                className={`block ${hasMobileImage ? 'hidden md:block' : ''}`}
                style={{ 
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  maxWidth: settings.backgroundMaxWidth ? `${settings.backgroundMaxWidth}px` : 'none',
                  margin: settings.backgroundMaxWidth ? '0 auto' : undefined,
                }}
                data-bg-desktop
                data-bg-type="image"
              />
              {/* Mobile Image as img element */}
              {hasMobileImage && (
                <img 
                  src={content.mobileImageUrl}
                  alt=""
                  className="block md:hidden"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                  data-bg-mobile
                  data-bg-type="image"
                />
              )}
            </>
          ) : (
            <>
              {/* Desktop Image as background */}
              {settings.backgroundMaxWidth && settings.backgroundMaxWidth > 0 ? (
                // With max-width: wrapper with background color + centered image
                <div 
                  className={`absolute inset-0 ${hasMobileImage ? 'hidden md:block' : ''}`}
                  style={{ backgroundColor: backgroundColor }}
                  data-bg-desktop-wrapper
                >
                  <div 
                    className="absolute bg-no-repeat"
                    style={{ 
                      backgroundImage: `url("${content.imageUrl || settings.backgroundImage}")`,
                      backgroundSize: backgroundSize === 'width' ? '100% auto' : backgroundSize,
                      backgroundPosition: backgroundPosition,
                      top: 0,
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '100%',
                      maxWidth: `${settings.backgroundMaxWidth}px`,
                    }}
                    data-bg-desktop
                    data-bg-type="image"
                  />
                </div>
              ) : (
                // Full width (default)
                <div 
                  className={`absolute inset-0 bg-no-repeat ${hasMobileImage ? 'hidden md:block' : ''}`}
                  style={{ 
                    backgroundImage: `url("${content.imageUrl || settings.backgroundImage}")`,
                    backgroundSize: backgroundSize === 'width' ? '100% auto' : backgroundSize,
                    backgroundPosition: backgroundPosition,
                  }}
                  data-bg-desktop
                  data-bg-type="image"
                />
              )}
              {/* Mobile Image as background */}
              {hasMobileImage && (
                <div 
                  className="absolute inset-0 bg-no-repeat md:hidden"
                  style={{ 
                    backgroundImage: `url("${content.mobileImageUrl}")`,
                    backgroundSize: backgroundSize === 'width' ? '100% auto' : backgroundSize,
                    backgroundPosition: backgroundPosition,
                  }}
                  data-bg-mobile
                  data-bg-type="image"
                />
              )}
            </>
          )}
        </>
      )}

      {/* ==================== BACKGROUND VIDEO ==================== */}
      {hasDesktopVideo && (
        <>
          {/* Desktop Video */}
          <video
            className={`absolute inset-0 w-full h-full object-cover ${hasMobileVideo ? 'hidden md:block' : ''}`}
            autoPlay
            muted
            loop
            playsInline
            src={content.videoUrl || settings.backgroundVideo}
            data-video-desktop
            data-bg-type="video"
          />
          {/* Mobile Video */}
          {hasMobileVideo && (
            <video
              className="absolute inset-0 w-full h-full object-cover md:hidden"
              autoPlay
              muted
              loop
              playsInline
              src={content.mobileVideoUrl}
              data-video-mobile
              data-bg-type="video"
            />
          )}
        </>
      )}

      {/* ==================== OVERLAY ==================== */}
      {(overlay > 0 || showGradient) && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            backgroundColor: showGradient ? 'transparent' : `rgba(0,0,0,${overlay})`,
            ...gradientStyle
          }}
          data-overlay
        />
      )}

      {/* ==================== CONTENT ==================== */}
      <div 
        className={`relative z-10 flex-1 flex flex-col ${textAlignClass} ${verticalAlignClass}`}
        data-content-container
      >
        <div 
          className="w-full"
          style={{
            maxWidth: sectionWidth === 'boxed' ? `${contentWidth}px` : 'none',
            margin: sectionWidth === 'boxed' ? '0 auto' : undefined,
          }}
          data-content-wrapper
        >
          {/* Title - Always render for live editing */}
          <h2 
            className={`leading-tight ${hasMedia ? 'font-display tracking-[0.3em] uppercase mb-6' : 'mb-4'}`}
            style={{ display: title ? '' : 'none', direction: 'rtl' }}
            dir="rtl"
            data-section-title
          >
            {title || ''}
          </h2>

          {/* Subtitle - Always render for live editing */}
          <p 
            className={`mb-4 ${hasMedia ? 'tracking-[0.2em] mb-12' : ''}`}
            style={{ 
              display: subtitle ? '' : 'none',
              unicodeBidi: 'plaintext',
            }}
            data-section-subtitle
          >
            {subtitle || ''}
          </p>

          {/* Text Content - Always render for live editing */}
          <div 
            className="mb-6 leading-relaxed"
            style={{ display: content.text ? '' : 'none' }}
            data-content-text
            dangerouslySetInnerHTML={{ __html: content.text || '' }}
          />

          {/* Buttons */}
          <div 
            className="flex gap-4 flex-wrap justify-center mt-4"
            style={{ display: (content.buttonText || content.secondaryButtonText) ? '' : 'none' }}
          >
            <Link
              href={content.buttonLink ? (content.buttonLink.startsWith('/') ? `${basePath}${content.buttonLink}` : content.buttonLink) : '#'}
              className={`px-8 py-3 font-medium transition-all hover:opacity-80 ${hasMedia ? 'uppercase tracking-wider text-sm' : ''}`}
              style={{ ...getButtonStyle(), display: content.buttonText ? '' : 'none' }}
              data-section-button
            >
              {content.buttonText || ''}
            </Link>
            
            <Link
              href={content.secondaryButtonLink ? (content.secondaryButtonLink.startsWith('/') ? `${basePath}${content.secondaryButtonLink}` : content.secondaryButtonLink) : '#'}
              className="px-8 py-3 font-medium transition-all hover:opacity-80"
              style={{
                ...getButtonStyle(),
                backgroundColor: 'transparent',
                border: `${buttonBorderWidth}px solid ${buttonBorderColor}`,
                display: content.secondaryButtonText ? '' : 'none',
              }}
              data-section-button-secondary
            >
              {content.secondaryButtonText || ''}
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Arrow */}
      {settings.showScrollArrow === true && (
        <ScrollArrow sectionId={sectionId} color={hasMedia ? '#ffffff' : '#000000'} />
      )}
    </section>
  );
}

// ====================================
// Export Variant Names for Editor
// ====================================
export const CONTENT_BLOCK_VARIANTS = {
  text_block: {
    name: 'בלוק טקסט',
    description: 'טקסט פשוט עם כפתור',
    icon: 'Type',
  },
  hero: {
    name: 'באנר ראשי',
    description: 'תמונה עם כותרת וכפתור',
    icon: 'Image',
  },
  hero_premium: {
    name: 'באנר פרימיום',
    description: 'וידאו עם גרדיאנט וטקסט',
    icon: 'Film',
  },
};

