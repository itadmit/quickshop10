/**
 * SplitBannerSection - Server Component
 * באנר מפוצל - אפס JS, מהיר כמו PHP!
 * 
 * 🔧 Uses shared section-system constants
 */

import Link from 'next/link';
import { TITLE_SIZES, FONT_WEIGHTS_HERO as FONT_WEIGHTS } from '@/lib/section-system';
import type { TitleSize, FontWeight } from '@/lib/section-system';

interface SideContent {
  title?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  link?: string;
}

interface SplitBannerSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    right?: SideContent;
    left?: SideContent;
    items?: {
      title: string;
      imageUrl: string;
      mobileImageUrl?: string;
      link: string;
    }[];
  };
  settings: {
    height?: string;
    minHeight?: number;
    minHeightUnit?: 'px' | 'vh';
    overlay?: number;
    // Alignment
    verticalAlign?: 'top' | 'center' | 'bottom';
    textAlign?: 'right' | 'center' | 'left';
    // Typography (supports both string keys and numeric px values)
    titleColor?: string;
    titleSize?: TitleSize | number;
    titleSizeMobile?: number;
    titleWeight?: FontWeight;
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

export function SplitBannerSection({ 
  content, 
  settings, 
  basePath, 
  sectionId 
}: SplitBannerSectionProps) {
  // Height - supports both old height string and new minHeight/minHeightUnit
  const minHeight = settings.minHeight ?? 70;
  const minHeightUnit = settings.minHeightUnit || 'vh';
  const height = settings.height || `${minHeight}${minHeightUnit}`;
  const overlay = settings.overlay ?? 0.1;
  
  // Alignment
  const verticalAlign = settings.verticalAlign || 'bottom';
  const textAlign = settings.textAlign || 'center';
  
  // Vertical align class
  const verticalAlignClass = verticalAlign === 'top' ? 'items-start pt-16' 
    : verticalAlign === 'center' ? 'items-center' 
    : 'items-end pb-16';
    
  // Text align class - in RTL: right = start (justify-start), left = end (justify-end)
  const textAlignClass = textAlign === 'right' ? 'text-right justify-start px-12' 
    : textAlign === 'left' ? 'text-left justify-end px-12' 
    : 'text-center justify-center';
  
  // Check for numeric font sizes
  const titleSizeValue = settings.titleSize;
  const isNumericTitleSize = typeof titleSizeValue === 'number';
  const titleSize = isNumericTitleSize ? 'lg' : (titleSizeValue || 'lg');
  const titleWeight = settings.titleWeight || 'light';
  
  // Support both new (right/left) and legacy (items) structure
  let sides: SideContent[] = [];
  
  if (content.right || content.left) {
    if (content.right) sides.push(content.right);
    if (content.left) sides.push(content.left);
  } else if (content.items) {
    sides = content.items;
  }

  // If no content, show placeholders with demo content
  if (sides.length === 0) {
    sides = [
      { title: 'נשים', imageUrl: 'https://3lwnd3ucppklouqs.public.blob.vercel-storage.com/quickshop/stores/noir-fashion/x0gDz-4TUp.webp', link: '/category/women' },
      { title: 'גברים', imageUrl: 'https://3lwnd3ucppklouqs.public.blob.vercel-storage.com/quickshop/stores/noir-fashion/r6Du0CcW_E.webp', link: '/category/men' },
    ];
  }
  
  // Visibility classes
  const hideOnMobileClass = settings.hideOnMobile ? 'max-md:hidden' : '';
  const hideOnDesktopClass = settings.hideOnDesktop ? 'md:hidden' : '';

  return (
    <section 
      className={`grid md:grid-cols-2 ${hideOnMobileClass} ${hideOnDesktopClass} ${settings.customClass || ''}`.trim()}
      style={{
        marginTop: settings.marginTop ? `${settings.marginTop}px` : undefined,
        marginBottom: settings.marginBottom ? `${settings.marginBottom}px` : undefined,
      }}
      id={settings.customId || undefined}
      data-section-id={sectionId}
      data-section-type="split_banner"
      data-section-name="באנר מפוצל"
      {...(settings.hideOnMobile && { 'data-hide-on-mobile': 'true' })}
      {...(settings.hideOnDesktop && { 'data-hide-on-desktop': 'true' })}
    >
      {settings.customCss && <style>{settings.customCss}</style>}
      
      {/* Scoped responsive styles for numeric font sizes */}
      {isNumericTitleSize && (
        <style dangerouslySetInnerHTML={{ __html: `
          [data-section-id="${sectionId}"] [data-side-title] {
            font-size: ${settings.titleSizeMobile || (titleSizeValue as number) * 0.7}px !important;
          }
          @media (min-width: 768px) {
            [data-section-id="${sectionId}"] [data-side-title] {
              font-size: ${titleSizeValue}px !important;
            }
          }
        `}} />
      )}
      {sides.map((side, i) => (
        <Link 
          key={i}
          href={side.link ? (side.link.startsWith('/') ? `${basePath}${side.link}` : side.link) : '#'}
          className="relative group overflow-hidden"
          style={{ height }}
          data-side-index={i}
        >
          {/* Mobile Image */}
          {side.mobileImageUrl && (
            <img 
              src={side.mobileImageUrl}
              alt={side.title || ''}
              className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105 md:hidden"
              data-side-mobile-image
            />
          )}
          {/* Desktop Image (also fallback for mobile if no mobile image) */}
          {side.imageUrl ? (
            <img 
              src={side.imageUrl}
              alt={side.title || ''}
              className={`w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105 ${side.mobileImageUrl ? 'hidden md:block' : ''}`}
              data-side-image
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-b from-gray-200 to-gray-300 ${side.mobileImageUrl ? 'hidden md:block' : ''}`} data-side-placeholder />
          )}
          <div 
            className="absolute inset-0 group-hover:bg-black/20 transition-colors"
            style={{ backgroundColor: `rgba(0,0,0,${overlay})` }}
            data-side-overlay
          />
          <div 
            className={`absolute inset-0 flex ${verticalAlignClass} ${textAlignClass}`}
            data-side-content
          >
            <span 
              className={`${!isNumericTitleSize ? TITLE_SIZES[titleSize as TitleSize] : ''} ${FONT_WEIGHTS[titleWeight]} tracking-[0.3em] uppercase`}
              style={{ color: settings.titleColor || '#ffffff' }}
              data-side-title
            >
              {side.title || ''}
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
