/**
 * BannerSmallSection - Server Component
 * באנר קטן/הודעה - אפס JS, מהיר כמו PHP!
 */

import Link from 'next/link';

interface BannerSmallSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    buttonText?: string;
    buttonLink?: string;
    icon?: string;
  };
  settings: {
    backgroundColor?: string;
    textColor?: string;
    buttonStyle?: 'outline' | 'filled' | 'none';
    size?: 'small' | 'medium' | 'large';
  };
  basePath?: string;
  sectionId?: string;
}

export function BannerSmallSection({ 
  title, 
  subtitle, 
  content, 
  settings,
  basePath = '',
  sectionId 
}: BannerSmallSectionProps) {
  const backgroundColor = settings.backgroundColor || '#000000';
  const textColor = settings.textColor || '#ffffff';
  const buttonStyle = settings.buttonStyle || 'outline';
  const size = settings.size || 'medium';

  const paddingY = {
    small: 'py-3',
    medium: 'py-5',
    large: 'py-8',
  }[size];

  const textSize = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  }[size];

  return (
    <section 
      className={`${paddingY} px-4`}
      style={{ backgroundColor, color: textColor }}
      data-section-id={sectionId}
      data-section-name="באנר קטן"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-right">
        {/* Icon */}
        {content.icon && (
          <span className="text-2xl">{content.icon}</span>
        )}

        {/* Text */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {title && (
            <span className={`font-medium ${textSize}`}>
              {title}
            </span>
          )}
          {subtitle && (
            <span className={`opacity-80 ${textSize}`}>
              {subtitle}
            </span>
          )}
        </div>

        {/* Button */}
        {buttonStyle !== 'none' && content.buttonText && content.buttonLink && (
          <Link 
            href={content.buttonLink.startsWith('/') ? `${basePath}${content.buttonLink}` : content.buttonLink}
            className={`
              px-4 py-1.5 text-sm font-medium transition-colors
              ${buttonStyle === 'outline' 
                ? 'border border-current hover:bg-white/10' 
                : 'bg-white text-black hover:bg-white/90'
              }
            `}
            style={buttonStyle === 'filled' ? { color: backgroundColor } : undefined}
          >
            {content.buttonText}
          </Link>
        )}
      </div>
    </section>
  );
}

