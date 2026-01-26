import Link from 'next/link';
import { ScrollArrow } from './hero/ScrollArrow';

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
    buttonBorderColor?: string;
    buttonBorderWidth?: number;
    buttonBorderRadius?: number;
    buttonTextDecoration?: string;
    buttonStyle?: 'filled' | 'outline' | 'underline';
    containerType?: 'container' | 'full';
    sectionWidth?: 'full' | 'boxed';
    contentWidth?: number;
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
    // Scroll Arrow
    showScrollArrow?: boolean;
    // Visibility
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
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
  const buttonBorderColor = settings.buttonBorderColor || buttonBg; // Default to same as background
  const buttonBorderWidth = settings.buttonBorderWidth ?? 1;
  const buttonBorderRadius = settings.buttonBorderRadius ?? 0;
  const buttonTextDecoration = settings.buttonTextDecoration || 'none';
  const containerType = settings.containerType || 'container';
  const sectionWidth = settings.sectionWidth || 'full';
  const contentWidth = settings.contentWidth || 1200;
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
  // In RTL: items-start = visual right, items-end = visual left
  const alignmentClass = textAlign === 'right' ? 'items-start text-right' : textAlign === 'left' ? 'items-end text-left' : 'items-center text-center';
  
  // Text position classes (vertical)
  const positionClass = textPosition === 'top' ? 'justify-start pt-20' : textPosition === 'bottom' ? 'justify-end pb-20' : 'justify-center';
  
  // Visibility classes (for production - will be overridden in editor)
  const hideOnMobileClass = settings.hideOnMobile ? 'max-md:hidden' : '';
  const hideOnDesktopClass = settings.hideOnDesktop ? 'md:hidden' : '';

  return (
    <section 
      id={settings.customId || undefined}
      className={`relative overflow-hidden ${hideOnMobileClass} ${hideOnDesktopClass} ${settings.customClass || ''}`.trim()}
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
      {...(settings.hideOnMobile && { 'data-hide-on-mobile': 'true' })}
      {...(settings.hideOnDesktop && { 'data-hide-on-desktop': 'true' })}
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
        className={`relative z-10 h-full flex flex-col ${positionClass} ${alignmentClass} w-full`}
        style={{
          paddingRight: textAlign === 'right' ? '20px' : '24px',
          paddingLeft: textAlign === 'left' ? '20px' : '24px',
        }}
        data-content-container
      >
        {/* Content wrapper - this is what gets constrained by sectionWidth/contentWidth */}
        <div 
          className="w-full"
          style={sectionWidth === 'boxed' 
            ? { maxWidth: `${contentWidth}px`, marginLeft: 'auto', marginRight: 'auto' } 
            : { maxWidth: 'none', width: '100%' }
          }
          data-content-wrapper
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
            border: `${buttonBorderWidth}px solid ${buttonBorderColor}`,
            borderRadius: `${buttonBorderRadius}px`,
            textDecoration: buttonTextDecoration
          }}
          data-section-button
          data-section-button-link
        >
          {content.buttonText || ''}
        </Link>
        </div>
      </div>
      
      {/* Scroll indicator - clickable to scroll to next section */}
      {(settings.showScrollArrow !== false) && (
        <ScrollArrow sectionId={sectionId} />
      )}
    </section>
  );
}
