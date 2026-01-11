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
    textAlign?: 'right' | 'center' | 'left';
    backgroundColor?: string;
    buttonBackground?: string;
    buttonTextColor?: string;
    containerType?: 'container' | 'full';
    paddingTop?: number;
    paddingBottom?: number;
    customClass?: string;
    customId?: string;
    customCss?: string;
  };
  basePath: string;
}

export function HeroSection({ title, subtitle, content, settings, basePath, sectionId }: HeroSectionProps & { sectionId?: string }) {
  const height = settings.height || '90vh';
  const overlay = settings.overlay ?? 0.3;
  const textAlign = settings.textAlign || 'center';
  const backgroundColor = settings.backgroundColor || 'transparent';
  const buttonBg = settings.buttonBackground || '#000000';
  const buttonText = settings.buttonTextColor || '#FFFFFF';
  const containerType = settings.containerType || 'container';
  const paddingTop = settings.paddingTop || 0;
  const paddingBottom = settings.paddingBottom || 0;

  // Text alignment classes
  const alignmentClass = textAlign === 'right' ? 'items-end text-right' : textAlign === 'left' ? 'items-start text-left' : 'items-center text-center';

  return (
    <section 
      id={settings.customId || undefined}
      className={`relative overflow-hidden ${settings.customClass || ''}`}
      style={{ 
        height,
        backgroundColor,
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        ...(settings.customCss ? { cssText: settings.customCss } : {})
      }}
      data-section-id={sectionId}
      data-section-name="באנר ראשי"
    >
      <div className="absolute inset-0">
        {/* Desktop Image */}
        <div 
          className={`absolute inset-0 bg-cover bg-center ${content.mobileImageUrl ? 'hidden md:block' : ''}`}
          style={{ backgroundImage: content.imageUrl ? `url("${content.imageUrl}")` : 'none' }}
          data-bg-desktop
        />
        {/* Mobile Image */}
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
      
      <div className={`relative z-10 h-full flex flex-col justify-center px-6 ${alignmentClass} ${containerType === 'container' ? 'container mx-auto' : ''}`}>
        {/* Title */}
        <h1 
          className="font-display text-6xl md:text-8xl lg:text-9xl text-white font-extralight tracking-[0.3em] mb-6 animate-fade-in uppercase"
          style={{ display: title ? '' : 'none' }}
          data-section-title
        >
          {title || ''}
        </h1>
        
        {/* Subtitle */}
        <p 
          className="text-white/90 text-xs md:text-sm tracking-[0.4em] uppercase mb-12 animate-slide-up"
          style={{ display: subtitle ? '' : 'none' }}
          data-section-subtitle
        >
          {subtitle || ''}
        </p>
        
        {/* Button */}
        <Link 
          href={content.buttonLink?.startsWith('/') ? `${basePath}${content.buttonLink}` : content.buttonLink || '#'}
          className="inline-block px-8 py-3 uppercase tracking-wider text-sm transition-all"
          style={{ 
            animationDelay: '200ms', 
            display: (content.buttonText && content.buttonLink) ? '' : 'none',
            backgroundColor: buttonBg,
            color: buttonText,
            border: `1px solid ${buttonBg}`
          }}
          data-section-button
          data-section-button-link
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
