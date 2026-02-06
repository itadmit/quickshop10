/**
 * QuickShop App Builder - Full-screen client component
 * Manages mobile app appearance and home screen layout
 *
 * Loaded via next/dynamic with ssr:false for code-splitting & performance.
 */
'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ThemeEditor } from './ThemeEditor';
import { SectionList } from './SectionList';
import { SectionEditor } from './SectionEditor';
import { PhonePreview } from './PhonePreview';
import type { MobileAppConfig, HomeSection, AppTheme, AppTypography } from './types';

// ─── Props ──────────────────────────────────────────────────────────────────

interface AppBuilderClientProps {
  storeSlug: string;
  storeId: string;
}

// ─── Default config (same as mobile app default) ───────────────────────────

const DEFAULT_CONFIG: MobileAppConfig = {
  version: 1,
  updatedAt: new Date().toISOString(),
  theme: {
    primaryColor: '#000000',
    secondaryColor: '#666666',
    backgroundColor: '#FFFFFF',
    surfaceColor: '#F5F5F5',
    accentColor: '#C4A265',
    textPrimary: '#000000',
    textSecondary: '#999999',
    errorColor: '#D32F2F',
    successColor: '#2E7D32',
  },
  typography: {
    headingFont: 'System',
    bodyFont: 'System',
    headingWeight: '300',
    bodyWeight: '400',
    headingLetterSpacing: 2,
    uppercaseHeadings: true,
  },
  homeSections: [
    {
      id: 'hero-1',
      type: 'hero_banner',
      order: 0,
      visible: true,
      data: {
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
        title: 'NEW COLLECTION',
        subtitle: 'SPRING / SUMMER 2026',
        buttonText: 'SHOP NOW',
        linkType: 'category',
        linkValue: 'new-arrivals',
        overlayOpacity: 0.3,
        textColor: '#FFFFFF',
        textPosition: 'center',
        height: 'full',
      },
    },
    {
      id: 'categories-1',
      type: 'category_strip',
      order: 1,
      visible: true,
      data: {
        categories: [
          { name: 'WOMEN', slug: 'women' },
          { name: 'MEN', slug: 'men' },
          { name: 'KIDS', slug: 'kids' },
          { name: 'SALE', slug: 'sale' },
        ],
        style: 'text',
      },
    },
    {
      id: 'featured-1',
      type: 'featured_products',
      order: 2,
      visible: true,
      data: {
        title: 'TRENDING NOW',
        source: 'featured',
        limit: 6,
        columns: 2,
      },
    },
    {
      id: 'editorial-1',
      type: 'editorial_banner',
      order: 3,
      visible: true,
      data: {
        imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
        title: 'WINTER SALE',
        subtitle: 'UP TO 50% OFF',
        buttonText: 'SHOP SALE',
        linkType: 'category',
        linkValue: 'sale',
        height: 'medium',
      },
    },
    {
      id: 'featured-2',
      type: 'featured_products',
      order: 4,
      visible: true,
      data: {
        title: 'BEST SELLERS',
        source: 'featured',
        limit: 4,
        columns: 2,
      },
    },
  ],
  tabBar: {
    style: 'text-only',
    labels: {
      home: 'HOME',
      shop: 'SHOP',
      search: 'SEARCH',
      wishlist: 'WISHLIST',
      account: 'ACCOUNT',
    },
  },
  productDisplay: {
    gridColumns: 2,
    imageRatio: '2:3',
    showPrice: true,
    showSaleBadge: true,
    saleBadgeText: 'SALE',
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(): string {
  return `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getDefaultSectionData(type: HomeSection['type']): HomeSection {
  const base = { id: generateId(), order: 999, visible: true };

  switch (type) {
    case 'hero_banner':
      return { ...base, type: 'hero_banner', data: { imageUrl: '', title: 'TITLE', subtitle: '', buttonText: '', linkType: 'category', linkValue: '', overlayOpacity: 0.3, textColor: '#FFFFFF', textPosition: 'center', height: 'full' } };
    case 'category_strip':
      return { ...base, type: 'category_strip', data: { categories: [{ name: 'Category', slug: 'category' }], style: 'text' } };
    case 'featured_products':
      return { ...base, type: 'featured_products', data: { title: 'FEATURED', source: 'featured', limit: 4, columns: 2 } };
    case 'editorial_banner':
      return { ...base, type: 'editorial_banner', data: { imageUrl: '', title: 'TITLE', linkType: 'category', linkValue: '', height: 'medium' } };
    case 'announcement':
      return { ...base, type: 'announcement', data: { text: 'FREE SHIPPING ON ORDERS OVER ₪299', backgroundColor: '#000000', textColor: '#FFFFFF' } };
    case 'spacer':
      return { ...base, type: 'spacer', data: { height: 32 } };
    default:
      return { ...base, type: 'spacer', data: { height: 32 } };
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AppBuilderClient({ storeSlug, storeId }: AppBuilderClientProps) {
  const [config, setConfig] = useState<MobileAppConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  // Load config from API on mount
  useEffect(() => {
    setLoading(true);
    fetch(`/api/storefront/${storeSlug}/app-config`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setConfig(json.data);
        }
        // If data is null, keep default config
      })
      .catch(() => {
        console.log('Using default config');
      })
      .finally(() => setLoading(false));
  }, [storeSlug]);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const updated = { ...config, updatedAt: new Date().toISOString() };
      const res = await fetch(`/api/storefront/${storeSlug}/app-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Save failed');
      }
      setConfig(updated);
      setMessage('✓ Saved successfully');
    } catch (err) {
      setMessage('✗ ' + (err as Error).message);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleThemeChange = (theme: AppTheme) => {
    setConfig({ ...config, theme });
  };

  const handleTypographyChange = (typography: AppTypography) => {
    setConfig({ ...config, typography });
  };

  const handleSectionsReorder = (sections: HomeSection[]) => {
    setConfig({ ...config, homeSections: sections });
  };

  const handleToggleVisible = (id: string) => {
    setConfig({
      ...config,
      homeSections: config.homeSections.map((s) =>
        s.id === id ? { ...s, visible: !s.visible } : s
      ),
    });
  };

  const handleDeleteSection = (id: string) => {
    if (confirm('Delete this section?')) {
      setConfig({
        ...config,
        homeSections: config.homeSections.filter((s) => s.id !== id),
      });
    }
  };

  const handleAddSection = (type: HomeSection['type']) => {
    const newSection = getDefaultSectionData(type);
    newSection.order = config.homeSections.length;
    setConfig({
      ...config,
      homeSections: [...config.homeSections, newSection],
    });
    setEditingSectionId(newSection.id);
  };

  const handleSaveSection = (updated: HomeSection) => {
    setConfig({
      ...config,
      homeSections: config.homeSections.map((s) =>
        s.id === updated.id ? updated : s
      ),
    });
  };

  const editingSection = config.homeSections.find((s) => s.id === editingSectionId);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={styles.app}>
      {/* Scoped styles for scrollbar + spin animation */}
      <style>{`
        .app-builder-scrollable::-webkit-scrollbar { width: 4px; }
        .app-builder-scrollable::-webkit-scrollbar-track { background: transparent; }
        .app-builder-scrollable::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
        .app-builder-spin { animation: app-builder-spin 1s linear infinite; }
        @keyframes app-builder-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Coming Soon Banner */}
      <div style={styles.comingSoonBanner} dir="rtl">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>בקרוב נשיק שירות אפליקציות חדש, השירות בתשלום נוסף — יש לפנות למחלקת המכירות שלנו</span>
      </div>

      {/* Top Bar */}
      <header style={styles.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href={`/shops/${storeSlug}/admin`}
            style={styles.backLink}
          >
            <ArrowRight size={16} />
            <span>חזרה לניהול</span>
          </Link>
          <h1 style={styles.logo}>APP BUILDER</h1>
        </div>
        <div style={styles.topActions}>
          {message && (
            <span style={{
              fontSize: 12,
              color: message.startsWith('✓') ? '#2E7D32' : '#D32F2F',
            }}>
              {message}
            </span>
          )}
          <button onClick={handleSave} disabled={saving || loading} style={styles.saveBtn}>
            {saving ? <RefreshCw size={14} className="app-builder-spin" /> : <Save size={14} />}
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <RefreshCw size={24} className="app-builder-spin" color="#999" />
          <p style={{ fontSize: 13, color: '#999', marginTop: 12 }}>Loading configuration...</p>
        </div>
      ) : (
        <div style={styles.main}>
          {/* Left Panel - Settings */}
          <aside style={styles.leftPanel}>
            <div className="app-builder-scrollable" style={styles.scrollable}>
              <ThemeEditor
                theme={config.theme}
                typography={config.typography}
                onThemeChange={handleThemeChange}
                onTypographyChange={handleTypographyChange}
              />

              {/* Product Display Settings */}
              <div style={styles.settingsSection}>
                <h3 style={styles.sectionTitle}>PRODUCT DISPLAY</h3>
                <div style={{ marginBottom: 12 }}>
                  <label style={styles.fieldLabel}>Grid Columns</label>
                  <select
                    value={config.productDisplay.gridColumns}
                    onChange={(e) =>
                      setConfig({ ...config, productDisplay: { ...config.productDisplay, gridColumns: Number(e.target.value) as 2 | 3 } })
                    }
                    style={styles.select}
                  >
                    <option value={2}>2 Columns</option>
                    <option value={3}>3 Columns</option>
                  </select>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={styles.fieldLabel}>Image Ratio</label>
                  <select
                    value={config.productDisplay.imageRatio}
                    onChange={(e) =>
                      setConfig({ ...config, productDisplay: { ...config.productDisplay, imageRatio: e.target.value as any } })
                    }
                    style={styles.select}
                  >
                    <option value="2:3">2:3 (Portrait)</option>
                    <option value="3:4">3:4</option>
                    <option value="4:5">4:5</option>
                    <option value="1:1">1:1 (Square)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={config.productDisplay.showPrice}
                    onChange={(e) =>
                      setConfig({ ...config, productDisplay: { ...config.productDisplay, showPrice: e.target.checked } })
                    }
                  />
                  <label style={styles.fieldLabel}>Show Price</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={config.productDisplay.showSaleBadge}
                    onChange={(e) =>
                      setConfig({ ...config, productDisplay: { ...config.productDisplay, showSaleBadge: e.target.checked } })
                    }
                  />
                  <label style={styles.fieldLabel}>Show Sale Badge</label>
                </div>
              </div>

              {/* Tab Bar Settings */}
              <div style={styles.settingsSection}>
                <h3 style={styles.sectionTitle}>TAB BAR</h3>
                <div style={{ marginBottom: 12 }}>
                  <label style={styles.fieldLabel}>Style</label>
                  <select
                    value={config.tabBar.style}
                    onChange={(e) =>
                      setConfig({ ...config, tabBar: { ...config.tabBar, style: e.target.value as any } })
                    }
                    style={styles.select}
                  >
                    <option value="text-only">Text Only</option>
                    <option value="icons">Icons Only</option>
                    <option value="icons-text">Icons + Text</option>
                  </select>
                </div>
                {Object.entries(config.tabBar.labels).map(([key, label]) => (
                  <div key={key} style={{ marginBottom: 8 }}>
                    <label style={styles.fieldLabel}>{key}</label>
                    <input
                      value={label}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          tabBar: {
                            ...config.tabBar,
                            labels: { ...config.tabBar.labels, [key]: e.target.value },
                          },
                        })
                      }
                      style={styles.input}
                    />
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Center - Preview */}
          <div style={styles.previewArea}>
            <PhonePreview config={config} />
          </div>

          {/* Right Panel - Sections */}
          <aside style={styles.rightPanel}>
            <div className="app-builder-scrollable" style={styles.scrollable}>
              <SectionList
                sections={config.homeSections}
                onReorder={handleSectionsReorder}
                onToggleVisible={handleToggleVisible}
                onEdit={setEditingSectionId}
                onDelete={handleDeleteSection}
                onAdd={handleAddSection}
              />
            </div>
          </aside>
        </div>
      )}

      {/* Section Editor Modal */}
      {editingSection && (
        <SectionEditor
          section={editingSection}
          onSave={handleSaveSection}
          onClose={() => setEditingSectionId(null)}
          storeId={storeId}
        />
      )}
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  app: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    height: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fafafa',
    position: 'fixed',
    inset: 0,
    zIndex: 50,
  },
  comingSoonBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 24px',
    backgroundColor: '#FFF8E1',
    borderBottom: '1px solid #FFE082',
    color: '#6D4C00',
    fontSize: 13,
    fontWeight: 500,
    flexShrink: 0,
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    height: 52,
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e5e5',
    flexShrink: 0,
  },
  backLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: '#666',
    textDecoration: 'none',
    padding: '4px 8px',
    border: '1px solid #e5e5e5',
    borderRadius: 4,
    cursor: 'pointer',
  },
  logo: {
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    margin: 0,
  },
  topActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 20px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: 500,
  },
  loadingContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  leftPanel: {
    width: 280,
    backgroundColor: '#fff',
    borderRight: '1px solid #e5e5e5',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  rightPanel: {
    width: 320,
    backgroundColor: '#fff',
    borderLeft: '1px solid #e5e5e5',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  previewArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  scrollable: {
    overflowY: 'auto',
    flex: 1,
  },
  settingsSection: {
    padding: 16,
    borderTop: '1px solid #e5e5e5',
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: 600,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: '1px solid #e5e5e5',
    textTransform: 'uppercase' as const,
  },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: 1,
    color: '#666',
    display: 'block',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
  },
  select: {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #ddd',
    fontSize: 13,
    backgroundColor: '#fff',
  },
  input: {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #ddd',
    fontSize: 13,
    boxSizing: 'border-box' as const,
  },
};
