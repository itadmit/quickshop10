/**
 * QuoteBannerSection - Parallax Quote Banner
 * Fixed background with centered quote text
 * Creates an elegant visual break between content sections
 * 
 * Features:
 * - Background image OR video
 * - Separate desktop/mobile backgrounds
 * - Parallax effect (optional)
 * - Customizable text style
 * - Live editor support with data-* attributes
 */

interface QuoteBannerSectionProps {
  title?: string | null;
  subtitle?: string | null;
  content: {
    quote: string;
    attribution?: string;
    // Desktop media
    imageUrl?: string;
    videoUrl?: string;
    // Mobile media (optional - uses desktop if not provided)
    mobileImageUrl?: string;
    mobileVideoUrl?: string;
    // Media type selector
    mediaType?: 'image' | 'video';
  };
  settings: {
    height?: string;
    mobileHeight?: string;
    overlay?: number;
    textStyle?: 'serif' | 'sans' | 'italic';
    parallax?: boolean;
  };
  sectionId?: string;
}

export function QuoteBannerSection({ 
  content, 
  settings, 
  sectionId 
}: QuoteBannerSectionProps) {
  const height = settings.height || '400px';
  const mobileHeight = settings.mobileHeight || '350px';
  const overlay = settings.overlay ?? 0.4;
  const textStyle = settings.textStyle || 'italic';
  const useParallax = settings.parallax !== false;
  const mediaType = content.mediaType || (content.videoUrl ? 'video' : 'image');

  const fontClass = textStyle === 'serif' 
    ? 'font-serif' 
    : textStyle === 'italic' 
      ? 'font-serif italic' 
      : 'font-sans';

  const isVideo = mediaType === 'video';
  const hasMobileMedia = isVideo 
    ? !!content.mobileVideoUrl 
    : !!content.mobileImageUrl;

  return (
    <section 
      className="w-full relative overflow-hidden"
      data-section-id={sectionId}
      data-section-name="באנר ציטוט"
      data-media-type={mediaType}
    >
      {/* ==================== IMAGE BACKGROUNDS ==================== */}
      {/* Desktop Image - always rendered, hidden when video selected */}
      <div 
        className={`absolute inset-0 bg-cover bg-center ${isVideo ? 'hidden' : ''} ${hasMobileMedia && !isVideo ? 'hidden md:block' : ''}`}
        style={{ 
          backgroundImage: content.imageUrl ? `url("${content.imageUrl}")` : 'none',
          backgroundAttachment: useParallax ? 'fixed' : 'scroll',
        }}
        data-bg-desktop
        data-bg-type="image"
      />
      {/* Mobile Image - always rendered */}
      <div 
        className={`absolute inset-0 bg-cover bg-center md:hidden ${isVideo ? 'hidden' : ''}`}
        style={{ 
          backgroundImage: content.mobileImageUrl ? `url("${content.mobileImageUrl}")` : (content.imageUrl ? `url("${content.imageUrl}")` : 'none'),
          backgroundAttachment: 'scroll',
        }}
        data-bg-mobile
        data-bg-type="image"
      />

      {/* ==================== VIDEO BACKGROUNDS ==================== */}
      {/* Desktop Video - only rendered when video URL exists */}
      {content.videoUrl && (
        <video
          className={`absolute inset-0 w-full h-full object-cover ${!isVideo ? 'hidden' : ''} ${hasMobileMedia && isVideo ? 'hidden md:block' : ''}`}
          autoPlay
          muted
          loop
          playsInline
          data-video-desktop
          data-bg-type="video"
          src={content.videoUrl}
        />
      )}
      {/* Mobile Video - only rendered when video exists */}
      {(content.mobileVideoUrl || content.videoUrl) && (
        <video
          className={`absolute inset-0 w-full h-full object-cover md:hidden ${!isVideo ? 'hidden' : ''}`}
          autoPlay
          muted
          loop
          playsInline
          data-video-mobile
          data-bg-type="video"
          src={content.mobileVideoUrl || content.videoUrl}
        />
      )}

      {/* Fallback background if no media */}
      <div 
        className="absolute inset-0 bg-gray-900"
        style={{ display: (content.imageUrl || content.videoUrl) ? 'none' : 'block' }}
        data-bg-fallback
      />

      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black"
        style={{ opacity: overlay }}
        data-overlay
      />
      
      {/* Content Container with dynamic height */}
      <div 
        className="relative flex items-center justify-center"
        style={{ height: height }}
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
        
        {/* Quote Content */}
        <div className="text-center text-white px-4 max-w-4xl mx-auto">
          <h2 
            className={`text-3xl md:text-5xl ${fontClass} mb-4`}
            data-section-quote
          >
            &quot;{content.quote}&quot;
          </h2>
          
          <p 
            className="text-lg opacity-90"
            style={{ display: content.attribution ? '' : 'none' }}
            data-section-attribution
          >
            {content.attribution}
          </p>
        </div>
      </div>
    </section>
  );
}
