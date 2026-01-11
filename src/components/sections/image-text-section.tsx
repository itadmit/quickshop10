/**
 * ImageTextSection - Server Component
 * תמונה + טקסט (ימין/שמאל) - אפס JS, מהיר כמו PHP!
 */

import Link from 'next/link';

interface ImageTextSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    imageUrl?: string;
    text?: string;
    buttonText?: string;
    buttonLink?: string;
  };
  settings: {
    imagePosition?: 'right' | 'left';
    imageWidth?: '40%' | '50%' | '60%';
    height?: string;
    backgroundColor?: string;
    textAlign?: 'right' | 'center' | 'left';
    overlay?: number;
  };
  basePath?: string;
  sectionId?: string;
}

export function ImageTextSection({ 
  title, 
  subtitle, 
  content, 
  settings,
  basePath = '',
  sectionId 
}: ImageTextSectionProps) {
  const imagePosition = settings.imagePosition || 'right';
  const imageWidth = settings.imageWidth || '50%';
  const height = settings.height || 'auto';
  const textAlign = settings.textAlign || 'right';

  // Determine flex direction based on image position (RTL aware)
  const flexDirection = imagePosition === 'right' ? 'flex-row' : 'flex-row-reverse';

  return (
    <section 
      className="py-12 md:py-0"
      style={{ backgroundColor: settings.backgroundColor || 'transparent' }}
      data-section-id={sectionId}
      data-section-name="תמונה + טקסט"
    >
      <div 
        className={`flex flex-col md:${flexDirection} min-h-[400px]`} 
        style={{ minHeight: height !== 'auto' ? height : undefined }}
        data-image-text-container
      >
        {/* Image Side */}
        <div 
          className="w-full md:w-1/2 relative overflow-hidden"
          style={{ 
            flexBasis: imageWidth,
            minHeight: '300px'
          }}
          data-image-container
        >
          <img 
            src={content.imageUrl || ''} 
            alt={title || ''} 
            className={`w-full h-full object-cover absolute inset-0 ${!content.imageUrl ? 'hidden' : ''}`}
            data-content-image
          />
          {settings.overlay && settings.overlay > 0 && (
            <div 
              className="absolute inset-0" 
              style={{ backgroundColor: `rgba(0,0,0,${settings.overlay})` }} 
            />
          )}
          <div className={`w-full h-full bg-gray-100 flex items-center justify-center ${content.imageUrl ? 'hidden' : ''}`} data-image-placeholder>
            <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Text Side */}
        <div 
          className="w-full md:w-1/2 flex items-center p-8 md:p-12 lg:p-16"
          style={{ 
            flexBasis: `calc(100% - ${imageWidth})`,
            textAlign 
          }}
          data-text-container
        >
          <div className="max-w-lg mx-auto">
            <h2 
              className={`text-2xl md:text-3xl lg:text-4xl font-display font-light tracking-wide mb-4 ${!title ? 'hidden' : ''}`}
              data-section-title
            >
              {title || ''}
            </h2>
            <p 
              className={`text-lg text-gray-600 mb-4 ${!subtitle ? 'hidden' : ''}`}
              data-section-subtitle
            >
              {subtitle || ''}
            </p>
            <div 
              className={`text-gray-600 leading-relaxed mb-6 prose prose-sm ${!content.text ? 'hidden' : ''}`}
              data-content-text
              dangerouslySetInnerHTML={{ __html: content.text || '' }}
            />
            <Link 
              href={content.buttonLink?.startsWith('/') ? `${basePath}${content.buttonLink}` : (content.buttonLink || '#')}
              className={`inline-block px-8 py-3 border border-black text-black hover:bg-black hover:text-white transition-colors text-sm tracking-wider uppercase ${!content.buttonText || !content.buttonLink ? 'hidden' : ''}`}
              data-section-button
            >
              {content.buttonText || ''}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

