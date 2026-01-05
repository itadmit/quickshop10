import Link from 'next/link';

interface SideContent {
  title?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  link?: string;
}

interface SplitBannerSectionProps {
  content: {
    // New structure: right & left
    right?: SideContent;
    left?: SideContent;
    // Legacy support: items array
    items?: {
      title: string;
      imageUrl: string;
      mobileImageUrl?: string;
      link: string;
    }[];
  };
  settings: {
    height?: string;
  };
  basePath: string;
}

export function SplitBannerSection({ content, settings, basePath, sectionId }: SplitBannerSectionProps & { sectionId?: string }) {
  const height = settings.height || '70vh';
  
  // Support both new (right/left) and legacy (items) structure
  let sides: SideContent[] = [];
  
  if (content.right || content.left) {
    // New structure - right first (RTL)
    if (content.right) sides.push(content.right);
    if (content.left) sides.push(content.left);
  } else if (content.items) {
    // Legacy structure
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
      className="grid md:grid-cols-2"
      data-section-id={sectionId}
      data-section-name="באנר מפוצל"
    >
      {sides.map((side, i) => (
        <Link 
          key={i}
          href={side.link ? (side.link.startsWith('/') ? `${basePath}${side.link}` : side.link) : '#'}
          className="relative group overflow-hidden"
          style={{ height }}
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
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
          <div className="absolute inset-0 flex items-end justify-center pb-16">
            <span 
              className="font-display text-3xl md:text-4xl text-white font-extralight tracking-[0.3em] uppercase"
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


