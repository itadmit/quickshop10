/**
 * FeaturesSection - Server Component
 * יתרונות/אייקונים - אפס JS, מהיר כמו PHP!
 */

import type { ReactNode } from 'react';

interface Feature {
  id: string;
  icon?: string;
  emoji?: string;
  title: string;
  description?: string;
}

interface FeaturesSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    features?: Feature[];
  };
  settings: {
    columns?: number;
    iconStyle?: 'emoji' | 'icon' | 'none';
    backgroundColor?: string;
    textAlign?: 'right' | 'center' | 'left';
    showDividers?: boolean;
  };
  sectionId?: string;
}

// Default icons as SVG
const defaultIcons: Record<string, ReactNode> = {
  shipping: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  returns: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
  ),
  support: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  ),
  quality: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  ),
};

export function FeaturesSection({ 
  title, 
  subtitle, 
  content, 
  settings,
  sectionId 
}: FeaturesSectionProps) {
  const columns = settings.columns || 4;
  const iconStyle = settings.iconStyle || 'emoji';
  const textAlign = settings.textAlign || 'center';
  const showDividers = settings.showDividers !== false;

  // Default features for preview/empty state
  const features = content.features?.length ? content.features : [
    { id: '1', emoji: '🚚', title: 'משלוח מהיר', description: 'עד 3 ימי עסקים' },
    { id: '2', emoji: '🔄', title: 'החזרות חינם', description: 'עד 30 יום' },
    { id: '3', emoji: '💬', title: 'תמיכה 24/7', description: 'בכל שאלה' },
    { id: '4', emoji: '✨', title: 'איכות מובטחת', description: '100% שביעות רצון' },
  ];

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }[columns] || 'grid-cols-2 md:grid-cols-4';

  return (
    <section 
      className="py-12 px-4"
      style={{ backgroundColor: settings.backgroundColor || 'transparent' }}
      data-section-id={sectionId}
      data-section-name="יתרונות"
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

        {/* Features Grid */}
        <div className={`grid ${gridCols} gap-6 md:gap-8`}>
          {features.map((feature, index) => (
            <div 
              key={feature.id}
              className={`
                py-6 px-4 text-${textAlign}
                ${showDividers && index < features.length - 1 ? 'md:border-l md:border-gray-100' : ''}
              `}
            >
              {/* Icon/Emoji */}
              {iconStyle !== 'none' && (
                <div className={`mb-4 ${textAlign === 'center' ? 'flex justify-center' : ''}`}>
                  {iconStyle === 'emoji' && feature.emoji && (
                    <span className="text-3xl">{feature.emoji}</span>
                  )}
                  {iconStyle === 'icon' && feature.icon && defaultIcons[feature.icon] && (
                    <div className="text-gray-700">
                      {defaultIcons[feature.icon]}
                    </div>
                  )}
                </div>
              )}

              {/* Title */}
              <h3 className="font-medium text-gray-900 mb-1">
                {feature.title}
              </h3>

              {/* Description */}
              {feature.description && (
                <p className="text-sm text-gray-500">
                  {feature.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

