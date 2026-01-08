import Link from 'next/link';

interface HeroSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    imageUrl?: string;
    mobileImageUrl?: string;
    buttonText?: string;
    buttonLink?: string;
  };
  settings: {
    height?: string;
    overlay?: number;
  };
  basePath: string;
}

export function HeroSection({ title, subtitle, content, settings, basePath, sectionId }: HeroSectionProps & { sectionId?: string }) {
  const height = settings.height || '90vh';
  const overlay = settings.overlay ?? 0.1;

  return (
    <section 
      className="relative bg-gray-50 overflow-hidden" 
      style={{ height }}
      data-section-id={sectionId}
      data-section-name="באנר ראשי"
    >
      <div className="absolute inset-0">
        {/* Desktop Image - always rendered for live editor */}
        <div 
          className={`absolute inset-0 bg-cover bg-center ${content.mobileImageUrl ? 'hidden md:block' : ''}`}
          style={{ backgroundImage: content.imageUrl ? `url("${content.imageUrl}")` : 'none' }}
          data-bg-desktop
        />
        {/* Mobile Image - always rendered */}
        <div 
          className="absolute inset-0 bg-cover bg-center md:hidden"
          style={{ backgroundImage: content.mobileImageUrl ? `url("${content.mobileImageUrl}")` : (content.imageUrl ? `url("${content.imageUrl}")` : 'none') }}
          data-bg-mobile
        />
        {/* Overlay */}
        <div 
          className="absolute inset-0" 
          style={{ backgroundColor: `rgba(0,0,0,${overlay})` }}
          data-overlay
        />
      </div>
      
      <div className="relative z-10 h-full flex flex-col items-center justify-end text-center px-6 pb-24">
        {/* Title - always rendered, hidden when empty */}
        <h1 
          className="font-display text-6xl md:text-8xl lg:text-9xl text-white font-extralight tracking-[0.3em] mb-6 animate-fade-in uppercase"
          style={{ display: title ? '' : 'none' }}
          data-section-title
        >
          {title || ''}
        </h1>
        
        {/* Subtitle - always rendered, hidden when empty */}
        <p 
          className="text-white/90 text-xs md:text-sm tracking-[0.4em] uppercase mb-12 animate-slide-up"
          style={{ display: subtitle ? '' : 'none' }}
          data-section-subtitle
        >
          {subtitle || ''}
        </p>
        
        {/* Button - always rendered, hidden when no text/link */}
        <Link 
          href={content.buttonLink?.startsWith('/') ? `${basePath}${content.buttonLink}` : content.buttonLink || '#'}
          className="btn-secondary !bg-transparent !text-white !border-white hover:!bg-white hover:!text-black animate-slide-up"
          style={{ animationDelay: '200ms', display: (content.buttonText && content.buttonLink) ? '' : 'none' }}
          data-section-button
        >
          {content.buttonText || ''}
        </Link>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
          <path d="M12 5v14M19 12l-7 7-7-7"/>
        </svg>
      </div>
    </section>
  );
}
