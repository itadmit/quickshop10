/**
 * Phone Preview - iPhone-frame live preview
 * Matches the actual mobile app appearance
 */
'use client';

import type { MobileAppConfig, HomeSection } from './types';

interface PhonePreviewProps {
  config: MobileAppConfig;
}

// Simple SVG icons for the preview
const SearchIcon = ({ color = '#000', size = 12 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CartIcon = ({ color = '#000', size = 12 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);

export function PhonePreview({ config }: PhonePreviewProps) {
  const { theme, typography, homeSections } = config;
  const visibleSections = homeSections
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  // Check if the first section is a hero banner → transparent header
  const firstIsHero = visibleSections[0]?.type === 'hero_banner';
  const headerColor = firstIsHero ? '#FFFFFF' : theme.textPrimary;

  return (
    <div style={styles.frame}>
      <style>{`.phone-content::-webkit-scrollbar { display: none; }`}</style>
      {/* iPhone Dynamic Island */}
      <div style={styles.dynamicIsland} />

      {/* Scrollable content area - takes full space */}
      <div className="phone-content" style={{ ...styles.content, backgroundColor: theme.backgroundColor }}>
        {/* If first section is hero, it extends under the header */}
        {visibleSections.map((section) => (
          <PreviewSection key={section.id} section={section} config={config} />
        ))}
      </div>

      {/* Status Bar - overlays on top */}
      <div style={{
        ...styles.statusBar,
        backgroundColor: firstIsHero ? 'transparent' : theme.backgroundColor,
      }}>
        <div style={styles.statusBarLeft}>
          {/* Signal + WiFi */}
          <svg width="32" height="10" viewBox="0 0 32 10" fill="none">
            <rect x="0" y="5" width="3" height="5" rx="0.5" fill={headerColor} opacity="0.9"/>
            <rect x="4" y="3.5" width="3" height="6.5" rx="0.5" fill={headerColor} opacity="0.9"/>
            <rect x="8" y="2" width="3" height="8" rx="0.5" fill={headerColor} opacity="0.9"/>
            <rect x="12" y="0" width="3" height="10" rx="0.5" fill={headerColor} opacity="0.9"/>
            <path d="M20 3.5c1.5-1.2 3.5-1.2 5 0" stroke={headerColor} strokeWidth="1" fill="none" opacity="0.5"/>
            <path d="M21 5.5c.9-.7 2.1-.7 3 0" stroke={headerColor} strokeWidth="1" fill="none" opacity="0.8"/>
            <circle cx="22.5" cy="7" r="0.8" fill={headerColor}/>
          </svg>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: headerColor }}>9:41</span>
        <div style={styles.statusBarRight}>
          {/* Battery */}
          <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
            <rect x="0" y="1" width="18" height="8" rx="1.5" stroke={headerColor} strokeWidth="1" fill="none"/>
            <rect x="1.5" y="2.5" width="14" height="5" rx="0.5" fill={headerColor}/>
            <rect x="18.5" y="3" width="2" height="4" rx="0.5" fill={headerColor} opacity="0.4"/>
          </svg>
        </div>
      </div>

      {/* Header - overlays on top, below status bar */}
      <div style={{
        ...styles.header,
        backgroundColor: firstIsHero ? 'transparent' : theme.backgroundColor,
        borderBottom: firstIsHero ? 'none' : '1px solid #eee',
      }}>
        {/* Search icon */}
        <div style={styles.headerLeft}>
          <SearchIcon color={headerColor} size={11} />
        </div>

        {/* Store name */}
        <span style={{
          fontSize: 10,
          letterSpacing: 3,
          fontWeight: parseInt(typography.headingWeight) as any,
          color: headerColor,
          textTransform: typography.uppercaseHeadings ? 'uppercase' : 'none',
        }}>
          QUICKSHOP
        </span>

        {/* Cart icon */}
        <div style={styles.headerRight}>
          <CartIcon color={headerColor} size={11} />
        </div>
      </div>

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        {Object.entries(config.tabBar.labels).map(([key, label]) => (
          <span key={key} style={{
            fontSize: 7,
            letterSpacing: 0.5,
            color: key === 'home' ? theme.textPrimary : theme.textSecondary,
            textTransform: 'uppercase',
          }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function PreviewSection({ section, config }: { section: HomeSection; config: MobileAppConfig }) {
  const { theme, typography } = config;

  switch (section.type) {
    case 'hero_banner': {
      // Match mobile: full=85vh, large=60vh, medium=40vh
      // Phone frame content height is ~460px (520 - status bar - tab bar)
      const phoneHeight = 460;
      const baseHeight = section.data.height === 'full'
        ? Math.round(phoneHeight * 0.85)
        : section.data.height === 'large'
          ? Math.round(phoneHeight * 0.60)
          : Math.round(phoneHeight * 0.40);
      return (
        <div style={{
          height: baseHeight,
          backgroundImage: `url(${section.data.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: section.data.textPosition === 'bottom-left' ? 'flex-start' : 'center',
          justifyContent: section.data.textPosition === 'center' ? 'center' : 'flex-end',
          padding: '12px 8px',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(0,0,0,${section.data.overlayOpacity})`,
          }} />
          <span style={{
            color: section.data.textColor,
            fontSize: 14,
            letterSpacing: 4,
            fontWeight: parseInt(typography.headingWeight) as any,
            position: 'relative',
            textTransform: typography.uppercaseHeadings ? 'uppercase' : 'none',
            textAlign: 'center',
            lineHeight: '18px',
          }}>
            {section.data.title}
          </span>
          {section.data.subtitle && (
            <span style={{
              color: section.data.textColor,
              fontSize: 7,
              letterSpacing: 2,
              position: 'relative',
              marginTop: 4,
            }}>
              {section.data.subtitle}
            </span>
          )}
          {section.data.buttonText && (
            <span style={{
              color: section.data.textColor,
              fontSize: 7,
              letterSpacing: 1.5,
              position: 'relative',
              marginTop: 10,
              border: `1px solid ${section.data.textColor}`,
              padding: '4px 14px',
            }}>
              {section.data.buttonText}
            </span>
          )}
        </div>
      );
    }

    case 'category_strip': {
      const isImageStyle = section.data.style === 'image-circle' || section.data.style === 'image-square';
      const isCircle = section.data.style === 'image-circle';

      if (isImageStyle) {
        return (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 6px',
          }}>
            {section.data.categories.slice(0, 5).map((cat) => (
              <div key={cat.slug} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: isCircle ? 16 : 3,
                  backgroundColor: '#e5e5e5',
                  backgroundImage: cat.imageUrl ? `url(${cat.imageUrl})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  marginBottom: 3,
                }} />
                <span style={{
                  fontSize: 5.5,
                  letterSpacing: 0.5,
                  color: theme.textPrimary,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  textAlign: 'center',
                }}>
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        );
      }

      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          padding: '8px 0',
          borderBottom: `1px solid ${theme.surfaceColor}`,
        }}>
          {section.data.categories.slice(0, 4).map((cat) => (
            <span key={cat.slug} style={{
              fontSize: 7,
              letterSpacing: 1,
              color: theme.textPrimary,
              fontWeight: 500,
            }}>
              {cat.name}
            </span>
          ))}
        </div>
      );
    }

    case 'featured_products':
      return (
        <div style={{ padding: '8px 4px' }}>
          <div style={{
            textAlign: 'center',
            padding: '6px 0',
            fontSize: 8,
            letterSpacing: 2,
            fontWeight: parseInt(typography.headingWeight) as any,
            color: theme.textPrimary,
            textTransform: typography.uppercaseHeadings ? 'uppercase' : 'none',
          }}>
            {section.data.title}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${section.data.columns}, 1fr)`,
            gap: 3,
          }}>
            {Array.from({ length: Math.min(section.data.limit, 4) }).map((_, i) => (
              <div key={i} style={{
                backgroundColor: '#f5f5f5',
                paddingBottom: '140%',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: 4,
                  left: 4,
                }}>
                  <div style={{ fontSize: 6, color: theme.textSecondary }}>Product {i + 1}</div>
                  <div style={{ fontSize: 6, color: theme.textPrimary }}>₪99.00</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'editorial_banner': {
      const editorialTextColor = section.data.textColor || '#FFFFFF';
      const editorialOverlay = section.data.overlayOpacity ?? 0.3;
      return (
        <div style={{
          height: section.data.height === 'large' ? 120 : section.data.height === 'medium' ? 90 : 60,
          backgroundImage: `url(${section.data.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: 8,
          margin: '2px 0',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${editorialOverlay})` }} />
          <span style={{ color: editorialTextColor, fontSize: 9, letterSpacing: 2, position: 'relative', fontWeight: parseInt(typography.headingWeight) as any }}>
            {section.data.title}
          </span>
          {section.data.subtitle && (
            <span style={{ color: editorialTextColor, fontSize: 6, letterSpacing: 1, position: 'relative', marginTop: 2 }}>
              {section.data.subtitle}
            </span>
          )}
          {section.data.buttonText && (
            <span style={{
              color: editorialTextColor,
              fontSize: 6,
              letterSpacing: 1,
              position: 'relative',
              marginTop: 4,
              border: `1px solid ${editorialTextColor}`,
              padding: '2px 8px',
            }}>
              {section.data.buttonText}
            </span>
          )}
        </div>
      );
    }

    case 'announcement':
      return (
        <div style={{
          backgroundColor: section.data.backgroundColor,
          padding: '4px 8px',
          textAlign: 'center',
        }}>
          <span style={{
            color: section.data.textColor,
            fontSize: 7,
            letterSpacing: 1,
          }}>
            {section.data.text}
          </span>
        </div>
      );

    case 'spacer':
      return <div style={{ height: section.data.height * 0.3 }} />;

    default:
      return null;
  }
}

const styles: Record<string, React.CSSProperties> = {
  frame: {
    width: 260,
    height: 520,
    border: '8px solid #1a1a1a',
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
    flexShrink: 0,
  },
  dynamicIsland: {
    position: 'absolute',
    top: 6,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 70,
    height: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    zIndex: 20,
  },
  statusBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 26,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: '0 12px 2px',
    zIndex: 15,
  },
  statusBarLeft: {
    width: 30,
  },
  statusBarRight: {
    width: 30,
    textAlign: 'right' as const,
  },
  header: {
    position: 'absolute',
    top: 26,
    left: 0,
    right: 0,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    padding: '0 8px',
  },
  headerLeft: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
  },
  headerRight: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  tabBar: {
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTop: '1px solid #eee',
    backgroundColor: '#fff',
    paddingBottom: 4,
  },
};
