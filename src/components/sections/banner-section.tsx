'use client';

/**
 * BannerSection - Simple image banner (not background)
 * סקשן באנר פשוט - תמונה בלבד (לא כרקע)
 * 
 * Features:
 * - Desktop and mobile images
 * - Full width, height auto (image determines height)
 * - Optional link wrapping the entire banner
 * - Supports max-width for centered banners
 */

import Link from 'next/link';

interface BannerSectionProps {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  content: {
    imageUrl?: string;
    mobileImageUrl?: string;
    linkUrl?: string;
    linkTarget?: '_self' | '_blank';
    altText?: string;
  };
  settings: {
    // Layout
    sectionWidth?: 'full' | 'boxed';
    maxWidth?: number;
    
    // Spacing
    paddingTop?: number;
    paddingBottom?: number;
    marginTop?: number;
    marginBottom?: number;
    
    // Background (behind the image)
    backgroundColor?: string;
    
    // Border radius
    borderRadius?: number;
    
    // Shadow
    shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    
    // Visibility
    hideOnDesktop?: boolean;
    hideOnMobile?: boolean;
    isActive?: boolean;
  };
  isActive?: boolean;
}

export function BannerSection({
  id,
  content,
  settings,
  isActive = true,
}: BannerSectionProps) {
  if (!isActive && settings.isActive !== true) return null;

  // Content
  const imageUrl = content.imageUrl || '';
  const mobileImageUrl = content.mobileImageUrl || '';
  const linkUrl = content.linkUrl || '';
  const linkTarget = content.linkTarget || '_self';
  const altText = content.altText || '';

  // Settings with defaults
  const sectionWidth = settings.sectionWidth || 'full';
  const maxWidth = settings.maxWidth || 0;
  const paddingTop = settings.paddingTop ?? 0;
  const paddingBottom = settings.paddingBottom ?? 0;
  const marginTop = settings.marginTop ?? 0;
  const marginBottom = settings.marginBottom ?? 0;
  const backgroundColor = settings.backgroundColor || 'transparent';
  const borderRadius = settings.borderRadius ?? 0;
  const shadow = settings.shadow || 'none';
  const hideOnDesktop = settings.hideOnDesktop || false;
  const hideOnMobile = settings.hideOnMobile || false;

  // Shadow classes
  const shadowClass = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  }[shadow];

  // Visibility classes
  const visibilityClass = [
    hideOnDesktop ? 'md:hidden' : '',
    hideOnMobile ? 'hidden md:block' : '',
  ].filter(Boolean).join(' ');

  // No image - don't render
  if (!imageUrl && !mobileImageUrl) {
    return (
      <section
        data-section-id={id}
        data-section-type="banner"
        data-section-name="באנר"
        className="w-full flex items-center justify-center py-20 bg-gray-100"
        style={{ marginTop, marginBottom }}
      >
        <p className="text-gray-400 text-sm">הוסף תמונה לבאנר</p>
      </section>
    );
  }

  // Image element
  const ImageContent = () => (
    <>
      {/* Desktop Image - shown on all devices if no mobile image, otherwise only desktop */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={altText}
          className={`w-full h-auto ${mobileImageUrl ? 'hidden md:block' : 'block'} ${shadowClass}`}
          style={{
            maxWidth: maxWidth > 0 ? `${maxWidth}px` : 'none',
            margin: maxWidth > 0 ? '0 auto' : undefined,
            borderRadius: borderRadius > 0 ? `${borderRadius}px` : undefined,
          }}
          data-banner-desktop
        />
      )}
      
      {/* Mobile Image - only if separate mobile image is provided */}
      {mobileImageUrl && (
        <img
          src={mobileImageUrl}
          alt={altText}
          className={`w-full h-auto block md:hidden ${shadowClass}`}
          style={{
            maxWidth: maxWidth > 0 ? `${maxWidth}px` : 'none',
            margin: maxWidth > 0 ? '0 auto' : undefined,
            borderRadius: borderRadius > 0 ? `${borderRadius}px` : undefined,
          }}
          data-banner-mobile
        />
      )}
    </>
  );

  return (
    <section
      data-section-id={id}
      data-section-type="banner"
      data-section-name="באנר"
      className={`w-full ${visibilityClass}`}
      style={{
        backgroundColor,
        paddingTop,
        paddingBottom,
        marginTop,
        marginBottom,
      }}
    >
      <div
        className={sectionWidth === 'boxed' ? 'max-w-7xl mx-auto px-4' : 'w-full'}
      >
        {linkUrl ? (
          // With link
          linkUrl.startsWith('http') || linkUrl.startsWith('//') ? (
            <a
              href={linkUrl}
              target={linkTarget}
              rel={linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
              className="block"
              data-banner-link
            >
              <ImageContent />
            </a>
          ) : (
            <Link href={linkUrl} className="block" data-banner-link>
              <ImageContent />
            </Link>
          )
        ) : (
          // Without link
          <ImageContent />
        )}
      </div>
    </section>
  );
}
