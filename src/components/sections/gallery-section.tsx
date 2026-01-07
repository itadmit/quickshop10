/**
 * GallerySection - Server Component
 * גלריית תמונות - אפס JS, מהיר כמו PHP!
 */

interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  link?: string;
}

interface GallerySectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    images?: GalleryImage[];
  };
  settings: {
    columns?: number;
    gap?: number;
    aspectRatio?: 'square' | '4:3' | '16:9' | 'auto';
    layout?: 'grid' | 'masonry';
    backgroundColor?: string;
  };
  basePath?: string;
  sectionId?: string;
}

export function GallerySection({ 
  title, 
  subtitle, 
  content, 
  settings,
  basePath = '',
  sectionId 
}: GallerySectionProps) {
  const columns = settings.columns || 4;
  const gap = settings.gap || 4;
  const aspectRatio = settings.aspectRatio || 'square';
  const images = content.images || [];

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }[columns] || 'grid-cols-2 md:grid-cols-4';

  const aspectClass = {
    'square': 'aspect-square',
    '4:3': 'aspect-[4/3]',
    '16:9': 'aspect-video',
    'auto': '',
  }[aspectRatio];

  const gapClass = {
    0: 'gap-0',
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  }[gap] || 'gap-4';

  // Placeholder images for empty state
  const displayImages = images.length > 0 ? images : [
    { id: '1', url: '', alt: 'תמונה 1' },
    { id: '2', url: '', alt: 'תמונה 2' },
    { id: '3', url: '', alt: 'תמונה 3' },
    { id: '4', url: '', alt: 'תמונה 4' },
  ];

  return (
    <section 
      className="py-12 px-4 md:px-8"
      style={{ backgroundColor: settings.backgroundColor || 'transparent' }}
      data-section-id={sectionId}
      data-section-name="גלריה"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-10">
            {title && (
              <h2 className="text-2xl md:text-3xl font-display font-light tracking-wide mb-3">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-gray-600 text-sm md:text-base">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Gallery Grid */}
        <div className={`grid ${gridCols} ${gapClass}`}>
          {displayImages.map((image) => {
            const ImageWrapper = image.link ? 'a' : 'div';
            const wrapperProps = image.link ? { 
              href: image.link.startsWith('/') ? `${basePath}${image.link}` : image.link 
            } : {};

            return (
              <ImageWrapper
                key={image.id}
                {...wrapperProps}
                className={`
                  relative overflow-hidden bg-gray-100 group
                  ${aspectClass}
                  ${image.link ? 'cursor-pointer' : ''}
                `}
              >
                {image.url ? (
                  <img 
                    src={image.url} 
                    alt={image.alt || ''} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </ImageWrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}

