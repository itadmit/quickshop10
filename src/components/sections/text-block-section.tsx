/**
 * TextBlockSection - Server Component
 * בלוק טקסט עשיר - אפס JS, מהיר כמו PHP!
 */

import Link from 'next/link';

interface TextBlockSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    text?: string;
    buttonText?: string;
    buttonLink?: string;
  };
  settings: {
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    textAlign?: 'right' | 'center' | 'left';
    backgroundColor?: string;
    textColor?: string;
    paddingY?: 'small' | 'medium' | 'large';
  };
  basePath?: string;
  sectionId?: string;
}

export function TextBlockSection({ 
  title, 
  subtitle, 
  content, 
  settings,
  basePath = '',
  sectionId 
}: TextBlockSectionProps) {
  const maxWidth = settings.maxWidth || 'lg';
  const textAlign = settings.textAlign || 'center';
  const paddingY = settings.paddingY || 'medium';

  const maxWidthClass = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-2xl',
    'xl': 'max-w-4xl',
    'full': 'max-w-7xl',
  }[maxWidth];

  const paddingClass = {
    'small': 'py-8',
    'medium': 'py-16',
    'large': 'py-24',
  }[paddingY];

  return (
    <section 
      className={`${paddingClass} px-4`}
      style={{ 
        backgroundColor: settings.backgroundColor || 'transparent',
        color: settings.textColor || 'inherit',
      }}
      data-section-id={sectionId}
      data-section-name="בלוק טקסט"
    >
      <div className={`${maxWidthClass} mx-auto`}>
        {/* Title */}
        <h2 
          className="text-2xl md:text-3xl lg:text-4xl font-display font-light tracking-wide mb-4"
          data-section-title
          style={{ display: title ? undefined : 'none' }}
        >
            {title}
          </h2>

        {/* Subtitle */}
        <p 
          className="text-lg md:text-xl opacity-80 mb-6"
          data-section-subtitle
          style={{ display: subtitle ? undefined : 'none' }}
        >
            {subtitle}
          </p>

        {/* Rich Text Content */}
          <div 
            className="prose prose-lg mx-auto mb-8"
          data-content-text
          dangerouslySetInnerHTML={{ __html: content.text || '' }}
          />

        {/* Button */}
        {content.buttonText && content.buttonLink && (
          <Link 
            href={content.buttonLink.startsWith('/') ? `${basePath}${content.buttonLink}` : content.buttonLink}
            className="inline-block px-8 py-3 border border-current hover:bg-black hover:text-white transition-colors text-sm tracking-wider uppercase"
          >
            {content.buttonText}
          </Link>
        )}
      </div>
    </section>
  );
}

