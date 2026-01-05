import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/lib/db/queries';
import { PageHeader } from '@/components/admin/ui';
import { CheckIcon } from '@/components/admin/icons';
import { ExportThemeButton } from './export-theme-button';
import { HeaderLayoutSelector } from './header-layout-selector';

// ============================================
// Design Templates Page
// ============================================

interface DesignPageProps {
  params: Promise<{ slug: string }>;
}

// Available templates
const templates = [
  {
    id: 'noir',
    name: 'Noir',
    description: 'עיצוב מינימלי יוקרתי בשחור-לבן. פונטים דקים ואלגנטיים.',
    preview: '/templates/noir-preview.jpg',
    colors: {
      primary: '#000000',
      secondary: '#ffffff',
      accent: '#1a1a1a',
    },
    fonts: {
      heading: 'Cormorant Garamond',
      body: 'Inter',
    },
    isDefault: true,
    isPro: false,
  },
  {
    id: 'fresh',
    name: 'Fresh',
    description: 'עיצוב צעיר וחי עם צבעים רעננים. מושלם לקוסמטיקה ומזון.',
    preview: '/templates/fresh-preview.jpg',
    colors: {
      primary: '#22c55e',
      secondary: '#f0fdf4',
      accent: '#16a34a',
    },
    fonts: {
      heading: 'Poppins',
      body: 'Inter',
    },
    isDefault: false,
    isPro: false,
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'עיצוב נועז וצבעוני. מושלם לאופנה ואקססוריז.',
    preview: '/templates/bold-preview.jpg',
    colors: {
      primary: '#7c3aed',
      secondary: '#faf5ff',
      accent: '#6d28d9',
    },
    fonts: {
      heading: 'Space Grotesk',
      body: 'Inter',
    },
    isDefault: false,
    isPro: true,
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'עיצוב יוקרתי וכהה. מושלם לתכשיטים ומוצרי פרימיום.',
    preview: '/templates/elegant-preview.jpg',
    colors: {
      primary: '#d4af37',
      secondary: '#1a1a1a',
      accent: '#b8860b',
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Lato',
    },
    isDefault: false,
    isPro: true,
  },
];

export default async function DesignPage({ params }: DesignPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get current theme from store settings
  const themeSettings = store.themeSettings as Record<string, unknown> || {};
  const storeSettings = store.settings as Record<string, unknown> || {};
  const currentTemplateId = (themeSettings.templateId as string) || 'noir';

  return (
    <div className="space-y-6">
      <PageHeader
        title="עיצוב החנות"
        description="בחרו תבנית עיצוב והתאימו אותה לסגנון שלכם"
      />

      {/* Header Layout Selector */}
      <HeaderLayoutSelector 
        currentLayout={(storeSettings.headerLayout as string) || 'logo-right'}
        storeSlug={slug}
      />

      {/* Current Theme Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">התבנית הנוכחית</h2>
              <p className="text-sm text-gray-600 mt-1 font-medium">
                {templates.find(t => t.id === currentTemplateId)?.name || 'Noir'}
              </p>
            </div>
            <Link
              href={`/shops/${slug}/editor`}
              className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
            >
              עריכת עיצוב
            </Link>
          </div>
        </div>

        {/* Preview */}
        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
            {/* Desktop Preview */}
            <div className="lg:col-span-2 flex flex-col">
              <div className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide text-center">דסקטופ</div>
              <div className="bg-[#e8e8e8] rounded-xl shadow-2xl overflow-hidden w-full">
                {/* Browser Chrome */}
                <div className="bg-[#dee1e6] px-4 py-2 flex items-center gap-3 border-b border-gray-300">
                  {/* Traffic Light Buttons */}
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-[#ff5f57] rounded-full shadow-inner" />
                    <div className="w-2.5 h-2.5 bg-[#febc2e] rounded-full shadow-inner" />
                    <div className="w-2.5 h-2.5 bg-[#28c840] rounded-full shadow-inner" />
                  </div>
                  {/* Navigation Arrows */}
                  <div className="flex gap-1 mr-2">
                    <button className="p-0.5 text-gray-400 hover:text-gray-600">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                    <button className="p-0.5 text-gray-400 hover:text-gray-600">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                  {/* URL Bar */}
                  <div className="flex-1 mx-2">
                    <div className="bg-white rounded px-2 py-1 flex items-center gap-2 shadow-sm border border-gray-200">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className="text-[10px] text-gray-600 truncate flex-1 leading-tight">
                        {slug}.quickshop.co.il
                      </span>
                    </div>
                  </div>
                </div>
                {/* Browser Content */}
                <div className="bg-white overflow-hidden" style={{ height: '400px' }}>
                  <iframe
                    src={`/shops/${slug}`}
                    className="w-full h-full border-0"
                    title="Desktop Preview"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Preview */}
            <div className="flex flex-col">
              <div className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide text-center">מובייל</div>
              <div className="w-[240px] bg-gray-900 shadow-xl mx-auto" style={{ borderRadius: '0 0 32px 32px' }}>
                {/* Screen */}
                <div className="bg-white overflow-hidden" style={{ height: '430px', borderRadius: '0' }}>
                  <iframe
                    src={`/shops/${slug}`}
                    className="w-full h-full border-0"
                    title="Mobile Preview"
                  />
                </div>
                {/* Home Indicator */}
                <div className="bg-gray-900 h-4 flex justify-center items-center pt-1" style={{ borderRadius: '0 0 32px 32px' }}>
                  <div className="w-20 h-1 bg-gray-700 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Info */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>נשמר לאחרונה: היום ב-11:08</span>
            <span className="text-gray-300">|</span>
            <span>גרסה 1.0.0</span>
          </div>
          <div className="flex items-center gap-2">
            <ExportThemeButton 
              templateId={currentTemplateId}
              template={templates.find(t => t.id === currentTemplateId)}
              storeSlug={slug}
            />
          </div>
        </div>
      </div>

      {/* Templates Gallery */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-bold text-gray-900">תבניות עיצוב</h2>
          <p className="text-sm text-gray-600 mt-1">
            בחרו מתוך מגוון תבניות מעוצבות מראש
          </p>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isActive={template.id === currentTemplateId}
                slug={slug}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Template Card Component
function TemplateCard({ 
  template, 
  isActive, 
  slug 
}: { 
  template: typeof templates[0]; 
  isActive: boolean;
  slug: string;
}) {
  return (
    <div className={`
      group relative rounded-xl border-2 overflow-hidden transition-all
      ${isActive 
        ? 'border-black shadow-lg' 
        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }
    `}>
      {/* Preview Image */}
      <div 
        className="aspect-[4/3] relative"
        style={{ 
          background: `linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.accent} 100%)` 
        }}
      >
        {/* Template Preview Mockup */}
        <div className="absolute inset-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className="p-3 space-y-2">
            <div className="h-1.5 bg-white/30 rounded w-12"></div>
            <div className="h-8 bg-white/20 rounded"></div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="h-12 bg-white/15 rounded"></div>
              <div className="h-12 bg-white/15 rounded"></div>
            </div>
          </div>
        </div>

        {/* Active Badge */}
        {isActive && (
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-black text-white text-[10px] font-medium rounded-full flex items-center gap-1">
            <CheckIcon size={12} />
            פעיל
          </div>
        )}

        {/* Pro Badge */}
        {template.isPro && !isActive && (
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-medium rounded-full">
            PRO
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Link
            href={`/shops/${slug}/editor?template=${template.id}`}
            className="px-4 py-2 bg-white text-black text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isActive ? 'ערוך עיצוב' : 'צפה בתצוגה מקדימה'}
          </Link>
        </div>
      </div>

      {/* Template Info */}
      <div className="p-4 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{template.name}</h3>
          {/* Color Palette */}
          <div className="flex gap-1">
            <div 
              className="w-4 h-4 rounded-full border border-gray-200"
              style={{ backgroundColor: template.colors.primary }}
            />
            <div 
              className="w-4 h-4 rounded-full border border-gray-200"
              style={{ backgroundColor: template.colors.secondary }}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          {template.description}
        </p>
      </div>
    </div>
  );
}

function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

