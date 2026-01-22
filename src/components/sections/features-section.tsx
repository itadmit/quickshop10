/**
 * FeaturesSection - Server Component
 * יתרונות/אייקונים - אפס JS, מהיר כמו PHP!
 */

interface Feature {
  id?: string;
  icon?: string;
  emoji?: string; // Legacy support
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
    layout?: 'horizontal' | 'vertical' | 'grid';
    iconStyle?: 'emoji' | 'icon' | 'none';
    backgroundColor?: string;
    showDividers?: boolean;
    // Typography - Title
    titleColor?: string;
    titleSize?: 'sm' | 'md' | 'lg' | 'xl';
    titleWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
    // Typography - Subtitle
    subtitleColor?: string;
    // Feature styling
    featureTitleColor?: string;
    featureDescColor?: string;
    iconColor?: string;
    iconBgColor?: string;
    // Spacing
    marginTop?: number;
    marginBottom?: number;
    // Custom
    customClass?: string;
    customId?: string;
    customCss?: string;
  };
  sectionId?: string;
}

const TITLE_SIZES = {
  sm: 'text-xl md:text-2xl',
  md: 'text-2xl md:text-3xl',
  lg: 'text-3xl md:text-4xl',
  xl: 'text-4xl md:text-5xl',
};

const FONT_WEIGHTS = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

// SVG icon paths for features
const FEATURE_ICON_PATHS: Record<string, string> = {
  truck: 'M1 3h15v13H1zm15 5h4l3 3v5h-7m-13 0a2.5 2.5 0 105 0m8 0a2.5 2.5 0 105 0',
  refresh: 'M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  check: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
  message: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
  sparkles: 'M12 3l-1.9 5.8a2 2 0 01-1.3 1.3L3 12l5.8 1.9a2 2 0 011.3 1.3L12 21l1.9-5.8a2 2 0 011.3-1.3L21 12l-5.8-1.9a2 2 0 01-1.3-1.3L12 3zM5 3v4M19 17v4M3 5h4M17 19h4',
  heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  gift: 'M20 12v10H4V12m16-5H4v5h16V7zm-8 15V7m0 0H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zm0 0h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  percent: 'M19 5L5 19M9 6.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM20 17.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
  award: 'M12 15a7 7 0 100-14 7 7 0 000 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
};

// Render SVG icon
function FeatureIcon({ icon, color, bgColor, size = 32 }: { icon: string; color?: string; bgColor?: string; size?: number }) {
  const path = FEATURE_ICON_PATHS[icon];
  if (!path) return null;
  
  return (
    <div 
      className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center"
      style={{ backgroundColor: bgColor || 'rgba(0,0,0,0.05)' }}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={color || 'currentColor'} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d={path} />
      </svg>
    </div>
  );
}

export function FeaturesSection({ 
  title, 
  subtitle, 
  content, 
  settings,
  sectionId 
}: FeaturesSectionProps) {
  const columns = settings.columns || 4;
  const layout = settings.layout || 'horizontal';
  const showDividers = settings.showDividers !== false;
  const titleSize = settings.titleSize || 'md';
  const titleWeight = settings.titleWeight || 'light';

  // Default features for preview/empty state
  const features = content.features?.length ? content.features : [
    { id: '1', icon: 'truck', title: 'משלוח מהיר', description: 'עד 3 ימי עסקים' },
    { id: '2', icon: 'refresh', title: 'החזרות חינם', description: 'עד 30 יום' },
    { id: '3', icon: 'message', title: 'תמיכה 24/7', description: 'בכל שאלה' },
    { id: '4', icon: 'sparkles', title: 'איכות מובטחת', description: '100% שביעות רצון' },
  ];

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }[columns] || 'grid-cols-2 md:grid-cols-4';

  return (
    <section 
      className={`py-12 px-4 ${settings.customClass || ''}`}
      style={{ 
        backgroundColor: settings.backgroundColor || 'transparent',
        marginTop: settings.marginTop ? `${settings.marginTop}px` : undefined,
        marginBottom: settings.marginBottom ? `${settings.marginBottom}px` : undefined,
      }}
      id={settings.customId || undefined}
      data-section-id={sectionId}
      data-section-name="חוזקות"
    >
      {settings.customCss && <style>{settings.customCss}</style>}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-10">
            <h2 
              className={`${TITLE_SIZES[titleSize]} ${FONT_WEIGHTS[titleWeight]} tracking-wide mb-3 ${!title ? 'hidden' : ''}`}
              style={{ color: settings.titleColor || 'inherit' }}
              data-section-title
            >
              {title || ''}
            </h2>
            <p 
              className={`text-sm md:text-base ${!subtitle ? 'hidden' : ''}`}
              style={{ color: settings.subtitleColor || '#4b5563' }}
              data-section-subtitle
            >
              {subtitle || ''}
            </p>
          </div>
        )}

        {/* Features Grid */}
        <div 
          className={`grid ${gridCols} gap-6 md:gap-8`}
          data-features-grid
        >
          {features.map((feature, index) => (
            <div 
              key={feature.id || index}
              className={`py-6 px-4 text-center ${showDividers && index < features.length - 1 ? 'md:border-l md:border-gray-100' : ''}`}
              data-feature-id={feature.id || index}
            >
              {/* Icon */}
              {feature.icon && FEATURE_ICON_PATHS[feature.icon] && (
                <div className="mb-4 flex justify-center" data-feature-icon>
                  <FeatureIcon 
                    icon={feature.icon} 
                    color={settings.iconColor || '#374151'}
                    bgColor={settings.iconBgColor}
                  />
                </div>
              )}
              
              {/* Legacy emoji support */}
              {!feature.icon && feature.emoji && (
                <div className="mb-4 flex justify-center">
                  <span className="text-3xl">{feature.emoji}</span>
                </div>
              )}

              {/* Title */}
              <h3 
                className="font-medium mb-1"
                style={{ color: settings.featureTitleColor || '#111827' }}
                data-feature-title
              >
                {feature.title}
              </h3>

              {/* Description */}
              <p 
                className="text-sm"
                style={{ 
                  color: settings.featureDescColor || '#6b7280',
                  display: feature.description ? '' : 'none'
                }}
                data-feature-description
              >
                {feature.description || ''}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
