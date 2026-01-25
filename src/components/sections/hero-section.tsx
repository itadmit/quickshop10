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
    textPosition?: 'top' | 'center' | 'bottom';
    backgroundColor?: string;
    buttonBackground?: string;
    buttonTextColor?: string;
    containerType?: 'container' | 'full';
    paddingTop?: number;
    paddingBottom?: number;
    customClass?: string;
    customId?: string;
    customCss?: string;
    // Typography - Title
    titleColor?: string;
    titleSize?: number;
    titleSizeMobile?: number;
    titleWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
    // Typography - Subtitle
    subtitleColor?: string;
    subtitleSize?: number;
    subtitleSizeMobile?: number;
    subtitleWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  };
  basePath: string;
}

export function HeroSection({ title, subtitle, content, settings, basePath, sectionId }: HeroSectionProps & { sectionId?: string }) {
  const height = settings.height || '90vh';
  const overlay = settings.overlay ?? 0.3;
  const textAlign = settings.textAlign || 'center';
  const textPosition = settings.textPosition || 'center';
  const backgroundColor = settings.backgroundColor || '#6B7280'; // Gray as fallback
  const buttonBg = settings.buttonBackground || '#FFFFFF'; // White default
  const buttonText = settings.buttonTextColor || '#000000'; // Black default
  const containerType = settings.containerType || 'container';
  const paddingTop = settings.paddingTop || 0;
  const paddingBottom = settings.paddingBottom || 0;
  
  // Typography settings
  const titleColor = settings.titleColor || '#ffffff';
  const titleSize = settings.titleSize; // numeric px value
  const titleSizeMobile = settings.titleSizeMobile;
  const titleWeight = settings.titleWeight || 'extralight';
  const subtitleColor = settings.subtitleColor || 'rgba(255,255,255,0.9)';
  const subtitleSize = settings.subtitleSize;
  const subtitleSizeMobile = settings.subtitleSizeMobile;
  const subtitleWeight = settings.subtitleWeight || 'normal';

  // Check if there's any image
  const hasImage = !!(content.imageUrl || content.mobileImageUrl);
  
  // Text alignment classes (horizontal)
  const alignmentClass = textAlign === 'right' ? 'items-end text-right' : textAlign === 'left' ? 'items-start text-left' : 'items-center text-center';
  
  // Text position classes (vertical)
  const positionClass = textPosition === 'top' ? 'justify-start pt-20' : textPosition === 'bottom' ? 'justify-end pb-20' : 'justify-center';

  return (
    <section 
      id={settings.customId || undefined}
      className={`relative overflow-hidden ${settings.customClass || ''}`}
      style={{ 
        height,
        backgroundColor: hasImage ? undefined : backgroundColor, // Only apply background if no image
        marginTop: `${paddingTop}px`,
        marginBottom: `${paddingBottom}px`,
        ...(settings.customCss ? { cssText: settings.customCss } : {})
      }}
      data-section-id={sectionId}
      data-section-type="hero"
      data-section-name="באנר ראשי"
      data-has-image={hasImage ? 'true' : 'false'}
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
      
      <div 
        className={`relative z-10 h-full flex flex-col ${positionClass} ${alignmentClass} ${
          containerType === 'container' ? 'container mx-auto px-6' : 'w-full'
        }`}
        style={containerType === 'full' ? {
          paddingRight: textAlign === 'right' ? '20px' : '24px',
          paddingLeft: textAlign === 'left' ? '20px' : '24px',
        } : undefined}
        data-content-container
      >
        {/* Scoped responsive styles */}
        {(titleSize || subtitleSize) && (
          <style dangerouslySetInnerHTML={{ __html: `
            [data-section-id="${sectionId}"] [data-section-title] {
              font-size: ${titleSizeMobile || (titleSize ? titleSize * 0.6 : 48)}px !important;
            }
            @media (min-width: 768px) {
              [data-section-id="${sectionId}"] [data-section-title] {
                font-size: ${titleSize || 96}px !important;
              }
            }
            [data-section-id="${sectionId}"] [data-section-subtitle] {
              font-size: ${subtitleSizeMobile || (subtitleSize ? subtitleSize * 0.8 : 12)}px !important;
            }
            @media (min-width: 768px) {
              [data-section-id="${sectionId}"] [data-section-subtitle] {
                font-size: ${subtitleSize || 14}px !important;
              }
            }
          `}} />
        )}
        
        {/* Title */}
        <h1 
          className={`font-display tracking-[0.3em] mb-6 animate-fade-in uppercase ${
            !titleSize ? 'text-5xl md:text-7xl lg:text-8xl' : ''
          } font-${titleWeight}`}
          style={{ 
            display: title ? '' : 'none',
            color: titleColor,
          }}
          data-section-title
        >
          {title || ''}
        </h1>
        
        {/* Subtitle */}
        <p 
          className={`tracking-[0.4em] uppercase mb-12 animate-slide-up ${
            !subtitleSize ? 'text-xs md:text-sm' : ''
          } font-${subtitleWeight}`}
          style={{ 
            display: subtitle ? '' : 'none',
            color: subtitleColor,
          }}
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
