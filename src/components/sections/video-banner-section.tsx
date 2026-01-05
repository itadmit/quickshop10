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
  };
  basePath: string;
}

export function VideoBannerSection({ title, subtitle, content, settings, basePath, sectionId }: VideoBannerSectionProps & { sectionId?: string }) {
  const height = settings.height || '80vh';
  const overlay = settings.overlay ?? 0.2;
  const autoplay = settings.autoplay ?? true;
  const loop = settings.loop ?? true;
  const muted = settings.muted ?? true;
  const controls = settings.controls ?? false;

  // Determine what to show on mobile vs desktop
  const hasMobileMedia = content.mobileVideoUrl || content.mobileImageUrl;
  const hasDesktopVideo = content.videoUrl;
  const hasDesktopImage = content.imageUrl;
  const hasMobileVideo = content.mobileVideoUrl;
  const hasMobileImage = content.mobileImageUrl;

  return (
    <section 
      className="relative overflow-hidden bg-black" 
      style={{ height }}
      data-section-id={sectionId}
      data-section-name="קולקציה חדשה"
    >
      {/* Mobile Media */}
      {hasMobileMedia && (
        <div className="md:hidden absolute inset-0">
          {hasMobileVideo ? (
            <video 
              src={content.mobileVideoUrl}
              autoPlay={autoplay}
              muted={muted}
              loop={loop}
              playsInline
              controls={controls}
              className="w-full h-full object-cover"
            />
          ) : hasMobileImage ? (
            <img 
              src={content.mobileImageUrl}
              alt={title || 'Banner'}
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
      )}

      {/* Desktop Media (also fallback for mobile if no mobile media) */}
      <div className={hasMobileMedia ? 'hidden md:block absolute inset-0' : 'absolute inset-0'}>
        {hasDesktopVideo ? (
          <video 
            src={content.videoUrl}
            autoPlay={autoplay}
            muted={muted}
            loop={loop}
            playsInline
            controls={controls}
            className="w-full h-full object-cover"
          />
        ) : hasDesktopImage ? (
          <img 
            src={content.imageUrl}
            alt={title || 'Banner'}
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>
      
      {/* Overlay + Content */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ backgroundColor: `rgba(0,0,0,${overlay})` }}
      >
        <div className="text-center max-w-2xl px-6">
          {subtitle && (
            <p 
              className="text-white/80 text-xs tracking-[0.4em] uppercase mb-6"
              data-section-subtitle
            >
              {subtitle}
            </p>
          )}
          {title && (
            <h2 
              className="font-display text-4xl md:text-6xl lg:text-7xl text-white font-extralight tracking-[0.2em] uppercase mb-8"
              data-section-title
            >
              {title}
            </h2>
          )}
          {content.buttonText && content.buttonLink && (
            <Link 
              href={content.buttonLink.startsWith('/') ? `${basePath}${content.buttonLink}` : content.buttonLink}
              className="btn-secondary !border-white !text-white hover:!bg-white hover:!text-black"
              data-section-button
            >
              {content.buttonText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}


