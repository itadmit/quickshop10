/**
 * HeroPremiumSection - Premium Hero with Side Gradient
 * Large hero banner with gradient overlay from left
 * Elegant typography and button styling for premium brands
 * 
 * Features:
 * - Separate desktop/mobile background images OR video
 * - Video URL overrides image when provided
 * - Eyebrow, headline, headline accent, description
 * - Two buttons with customizable styles (filled/outline)
 * - Gradient direction (left/right/center)
 * - Live editor support with data-* attributes
 */

import Link from 'next/link';

interface HeroPremiumSectionProps {
  title?: string | null;
  subtitle?: string | null;
  content: {
    // Images
    imageUrl?: string;           // Desktop background image
    mobileImageUrl?: string;     // Mobile background image (optional)
    // Video (overrides image when provided)
    videoUrl?: string;           // Desktop video URL
    mobileVideoUrl?: string;     // Mobile video URL (optional)
    // Text content
    eyebrow?: string;
    headline?: string;
    headlineAccent?: string;
    description?: string;
    // Buttons
    primaryButtonText?: string;
    primaryButtonLink?: string;
    primaryButtonStyle?: 'filled' | 'outline';
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
    secondaryButtonStyle?: 'filled' | 'outline';
  };
  settings: {
    height?: string;
    mobileHeight?: string;
    gradientDirection?: 'left' | 'right' | 'center' | 'none';
    accentColor?: string;
    overlayOpacity?: number;
    showGradient?: boolean;  // Toggle gradient on/off
    // Video settings
    videoAutoplay?: boolean;
    videoMuted?: boolean;
    videoLoop?: boolean;
    videoControls?: boolean;
  };
  basePath: string;
  sectionId?: string;
}

export function HeroPremiumSection({ 
  content, 
  settings, 
  basePath,
  sectionId 
}: HeroPremiumSectionProps) {
  const height = settings.height || '800px';
  const mobileHeight = settings.mobileHeight || '600px';
  const gradientDir = settings.gradientDirection || 'left';
  const accentColor = settings.accentColor || '#d4af37';
  const overlayOpacity = settings.overlayOpacity ?? 0.3;
  const showGradient = settings.showGradient !== false; // Default to true

  // Video settings (defaults to autoplay, muted, loop for background video)
  const videoAutoplay = settings.videoAutoplay !== false;
  const videoMuted = settings.videoMuted !== false;
  const videoLoop = settings.videoLoop !== false;
  const videoControls = settings.videoControls || false;

  // Check if we have video content
  const hasVideo = !!content.videoUrl;
  const hasMobileVideo = !!content.mobileVideoUrl;

  // Gradient direction classes
  const gradientOverlay = gradientDir === 'left'
    ? 'from-[#fdfbf7]/95 via-[#fdfbf7]/70 to-transparent'
    : gradientDir === 'right'
      ? 'from-transparent via-[#fdfbf7]/70 to-[#fdfbf7]/95'
      : 'from-[#fdfbf7]/50 via-transparent to-[#fdfbf7]/50';

  const textAlign = gradientDir === 'left' 
    ? 'items-start text-right' 
    : gradientDir === 'right'
      ? 'items-end text-left'
      : 'items-center text-center';

  // Button style helper
  const getButtonClasses = (style: 'filled' | 'outline' = 'filled', isPrimary: boolean) => {
    if (style === 'outline') {
      return 'border border-gray-900 hover:border-black hover:bg-[#f4e4d4]/20 text-gray-900 bg-white/30 backdrop-blur-sm';
    }
    return isPrimary 
      ? 'bg-gray-900 hover:bg-black text-white shadow-xl'
      : 'bg-gray-900 hover:bg-black text-white shadow-xl';
  };

  return (
    <section 
      className="w-full relative overflow-hidden"
      data-section-id={sectionId}
      data-section-type="hero_premium"
      data-section-name="הירו פרימיום"
      data-has-video={hasVideo ? 'true' : 'false'}
    >
      {/* ==================== IMAGE BACKGROUNDS ==================== */}
      {/* Desktop Image - always rendered, hidden when video is active */}
      <div 
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat ${hasVideo ? 'hidden' : ''} ${content.mobileImageUrl && !hasVideo ? 'hidden md:block' : ''}`}
        style={{ backgroundImage: content.imageUrl ? `url("${content.imageUrl}")` : 'none' }}
        data-bg-desktop
        data-bg-type="image"
      />
      
      {/* Mobile Image - always rendered */}
      <div 
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden ${hasVideo || hasMobileVideo ? 'hidden' : ''}`}
        style={{ backgroundImage: content.mobileImageUrl ? `url("${content.mobileImageUrl}")` : (content.imageUrl ? `url("${content.imageUrl}")` : 'none') }}
        data-bg-mobile
        data-bg-type="image"
      />
      
      {/* ==================== VIDEO BACKGROUNDS ==================== */}
      {/* Desktop Video - only rendered when video URL exists */}
      {content.videoUrl && (
        <video
          className={`absolute inset-0 w-full h-full object-cover ${!hasVideo ? 'hidden' : ''} ${hasMobileVideo ? 'hidden md:block' : ''}`}
          autoPlay={videoAutoplay}
          muted={videoMuted}
          loop={videoLoop}
          controls={videoControls}
          playsInline
          src={content.videoUrl}
          data-video-desktop
          data-bg-type="video"
        />
      )}
      
      {/* Mobile Video - only rendered when video exists */}
      {(content.mobileVideoUrl || content.videoUrl) && (
        <video
          className={`absolute inset-0 w-full h-full object-cover md:hidden ${!hasVideo && !hasMobileVideo ? 'hidden' : ''}`}
          autoPlay={videoAutoplay}
          muted={videoMuted}
          loop={videoLoop}
          controls={videoControls}
          playsInline
          src={content.mobileVideoUrl || content.videoUrl}
          data-video-mobile
          data-bg-type="video"
        />
      )}
      
      {/* Dark Overlay (for contrast) */}
      <div 
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity }}
        data-overlay
      />
      
      {/* Gradient Overlays - can be toggled on/off */}
      <div 
        className={`absolute inset-0 bg-gradient-to-l ${gradientOverlay}`} 
        style={{ display: showGradient ? '' : 'none' }}
        data-gradient-overlay 
      />
      <div 
        className="absolute inset-0 bg-gradient-to-t from-[#fdfbf7] via-transparent to-transparent opacity-90" 
        style={{ display: showGradient ? '' : 'none' }}
        data-gradient-bottom
      />
      
      {/* Content */}
      <div 
        className={`relative max-w-[1440px] mx-auto px-4 md:px-10 flex flex-col justify-center ${textAlign}`}
        style={{ 
          height: height,
          minHeight: mobileHeight,
        }}
        data-content-container
      >
        {/* Mobile height adjustment */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 767px) {
            [data-section-id="${sectionId}"] [data-content-container] {
              height: ${mobileHeight} !important;
            }
          }
        `}} />
        
        <div className="flex flex-col gap-6 max-w-[650px]">
          {/* Eyebrow */}
          <span 
            className="font-bold tracking-[0.2em] uppercase text-sm md:text-base"
            style={{ color: accentColor, display: content.eyebrow ? '' : 'none' }}
            data-content-eyebrow
            data-accent-color
          >
            {content.eyebrow}
          </span>
          
          {/* Headline */}
          <h1 className="text-gray-900 text-5xl md:text-7xl font-black leading-[1.1] tracking-tight drop-shadow-sm">
            <span data-content-headline>{content.headline}</span>
            {content.headline && <br />}
            <span 
              className="font-bold"
              style={{ color: accentColor }}
              data-content-headline-accent
              data-accent-color
            >
              {content.headlineAccent}
            </span>
          </h1>
          
          {/* Description */}
          <p 
            className="text-gray-900 text-lg md:text-xl font-normal leading-relaxed max-w-[500px] opacity-90"
            style={{ display: content.description ? '' : 'none' }}
            data-content-description
          >
            {content.description}
          </p>
          
          {/* Buttons */}
          <div className="flex gap-4 mt-4 flex-wrap" style={{ display: (content.primaryButtonText || content.secondaryButtonText) ? '' : 'none' }}>
            {content.primaryButtonLink && (
              <Link
                href={content.primaryButtonLink.startsWith('/') ? `${basePath}${content.primaryButtonLink}` : content.primaryButtonLink}
                className={`cursor-pointer rounded-full h-14 px-10 transition-colors text-lg font-bold tracking-wide flex items-center justify-center ${getButtonClasses(content.primaryButtonStyle, true)}`}
                style={{ display: content.primaryButtonText ? '' : 'none' }}
                data-content-primary-btn
              >
                {content.primaryButtonText}
              </Link>
            )}
            
            {content.secondaryButtonLink && (
              <Link
                href={content.secondaryButtonLink.startsWith('/') ? `${basePath}${content.secondaryButtonLink}` : content.secondaryButtonLink}
                className={`cursor-pointer rounded-full h-14 px-10 transition-all text-lg font-medium tracking-wide flex items-center justify-center ${getButtonClasses(content.secondaryButtonStyle || 'outline', false)}`}
                style={{ display: content.secondaryButtonText ? '' : 'none' }}
                data-content-secondary-btn
              >
                {content.secondaryButtonText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
