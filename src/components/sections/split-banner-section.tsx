/**
 * SplitBannerSection - Server Component
 * באנר מפוצל - אפס JS, מהיר כמו PHP!
 */

import Link from 'next/link';

interface SideContent {
  title?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  link?: string;
}

interface SplitBannerSectionProps {
  content: {
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
    overlay?: number;
    // Typography
    titleColor?: string;
    titleSize?: 'sm' | 'md' | 'lg' | 'xl';
    titleWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
    // Spacing
    marginTop?: number;
    marginBottom?: number;
    // Custom
    customClass?: string;
    customId?: string;
    customCss?: string;
  };
  basePath: string;
  sectionId?: string;
}

const TITLE_SIZES = {
  sm: 'text-xl md:text-2xl',
  md: 'text-2xl md:text-3xl',
  lg: 'text-3xl md:text-4xl',
  xl: 'text-4xl md:text-5xl',
};

const FONT_WEIGHTS = {
  light: 'font-extralight',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export function SplitBannerSection({ 
  content, 
  settings, 
  basePath, 
  sectionId 
}: SplitBannerSectionProps) {
  const height = settings.height || '70vh';
  const overlay = settings.overlay ?? 0.1;
  const titleSize = settings.titleSize || 'lg';
  const titleWeight = settings.titleWeight || 'light';
  
  // Support both new (right/left) and legacy (items) structure
  let sides: SideContent[] = [];
  
  if (content.right || content.left) {
    if (content.right) sides.push(content.right);
    if (content.left) sides.push(content.left);
  } else if (content.items) {
    sides = content.items;
  }

  // If no content, show placeholders
  if (sides.length === 0) {
    sides = [
      { title: 'נשים', imageUrl: '', link: '/category/women' },
      { title: 'גברים', imageUrl: '', link: '/category/men' },
    ];
  }

  return (
    <section 
      className={`grid md:grid-cols-2 ${settings.customClass || ''}`}
      style={{
        marginTop: settings.marginTop ? `${settings.marginTop}px` : undefined,
        marginBottom: settings.marginBottom ? `${settings.marginBottom}px` : undefined,
      }}
      id={settings.customId || undefined}
      data-section-id={sectionId}
      data-section-name="באנר מפוצל"
    >
      {settings.customCss && <style>{settings.customCss}</style>}
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
            />
          )}
          {/* Desktop Image (also fallback for mobile if no mobile image) */}
          {side.imageUrl ? (
            <img 
              src={side.imageUrl}
              alt={side.title || ''}
              className={`w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105 ${side.mobileImageUrl ? 'hidden md:block' : ''}`}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-b from-gray-200 to-gray-300 ${side.mobileImageUrl ? 'hidden md:block' : ''}`} />
          )}
          <div 
            className="absolute inset-0 group-hover:bg-black/20 transition-colors"
            style={{ backgroundColor: `rgba(0,0,0,${overlay})` }}
            data-overlay
          />
          <div className="absolute inset-0 flex items-end justify-center pb-16">
            <span 
              className={`${TITLE_SIZES[titleSize]} ${FONT_WEIGHTS[titleWeight]} tracking-[0.3em] uppercase`}
              style={{ color: settings.titleColor || '#ffffff' }}
              data-section-title
            >
              {side.title || ''}
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
