/**
 * LogosSection - Server Component
 * לוגואים של מותגים/שותפים - אפס JS, מהיר כמו PHP!
 */

interface Logo {
  id: string;
  url: string;
  alt?: string;
  link?: string;
}

interface LogosSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    logos?: Logo[];
  };
  settings: {
    columns?: number;
    logoHeight?: number;
    grayscale?: boolean;
    backgroundColor?: string;
  };
  sectionId?: string;
}

export function LogosSection({ 
  title, 
  subtitle, 
  content, 
  settings,
  sectionId 
}: LogosSectionProps) {
  const columns = settings.columns || 6;
  const logoHeight = settings.logoHeight || 48;
  const grayscale = settings.grayscale !== false;
  const logos = content.logos || [];

  const gridCols = {
    3: 'grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-5',
    6: 'grid-cols-3 md:grid-cols-6',
    8: 'grid-cols-4 md:grid-cols-8',
  }[columns] || 'grid-cols-3 md:grid-cols-6';

  // Placeholder for empty state
  const displayLogos = logos.length > 0 ? logos : [
    { id: '1', url: '', alt: 'לוגו 1' },
    { id: '2', url: '', alt: 'לוגו 2' },
    { id: '3', url: '', alt: 'לוגו 3' },
    { id: '4', url: '', alt: 'לוגו 4' },
    { id: '5', url: '', alt: 'לוגו 5' },
    { id: '6', url: '', alt: 'לוגו 6' },
  ];

  return (
    <section 
      className="py-12 px-4"
      style={{ backgroundColor: settings.backgroundColor || 'transparent' }}
      data-section-id={sectionId}
      data-section-name="לוגואים"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-10">
            {title && (
              <h2 className="text-xl md:text-2xl font-display font-light tracking-wide mb-2">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-gray-500 text-sm">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Logos Grid */}
        <div className={`grid ${gridCols} gap-8 items-center`}>
          {displayLogos.map((logo) => {
            const LogoWrapper = logo.link ? 'a' : 'div';
            const wrapperProps = logo.link ? { 
              href: logo.link,
              target: '_blank',
              rel: 'noopener noreferrer',
            } : {};

            return (
              <LogoWrapper
                key={logo.id}
                {...wrapperProps}
                className={`
                  flex items-center justify-center p-4
                  ${logo.link ? 'hover:opacity-100 cursor-pointer' : ''}
                  ${grayscale ? 'opacity-60 hover:opacity-100 transition-opacity' : ''}
                `}
              >
                {logo.url ? (
                  <img 
                    src={logo.url} 
                    alt={logo.alt || ''} 
                    className={`object-contain ${grayscale ? 'grayscale hover:grayscale-0 transition-all' : ''}`}
                    style={{ height: logoHeight, maxWidth: '100%' }}
                  />
                ) : (
                  <div 
                    className="bg-gray-200 rounded flex items-center justify-center"
                    style={{ height: logoHeight, width: logoHeight * 2 }}
                  >
                    <span className="text-gray-400 text-xs">לוגו</span>
                  </div>
                )}
              </LogoWrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}

