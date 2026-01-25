/**
 * Product Page Section Renderers
 * 
 * IMPORTANT: All sections are SERVER COMPONENTS
 * This ensures zero client JS for static content!
 * 
 * Only interactive elements (add to cart, variant selector) use client components.
 */

import { type ProductPageSection } from '@/lib/product-page-sections';
import { resolveDynamicContent, type DynamicContentContext } from '@/lib/dynamic-content';
import { featureIcons } from '@/lib/product-page-settings';

// ===========================================
// Main Section Renderer
// ===========================================

interface ProductSectionProps {
  section: ProductPageSection;
  context: DynamicContentContext;
  // Additional data for specific sections
  children?: React.ReactNode;
}

export function ProductSection({ section, context, children }: ProductSectionProps) {
  // Resolve dynamic content in title/subtitle
  const title = section.title ? resolveDynamicContent(section.title, context) : null;
  const subtitle = section.subtitle ? resolveDynamicContent(section.subtitle, context) : null;

  // Render based on section type
  switch (section.type) {
    case 'accordion':
      return <AccordionSection section={section} context={context} />;
    case 'tabs':
      return <TabsSection section={section} context={context} />;
    case 'features':
      return <FeaturesSection section={section} context={context} />;
    case 'text_block':
      return <TextBlockSection section={section} context={context} />;
    case 'breadcrumb':
      return <BreadcrumbSection section={section} context={context} />;
    case 'divider':
      return <DividerSection />;
    case 'spacer':
      return <SpacerSection section={section} />;
    // Product-specific sections render children (gallery, info, etc.)
    case 'product_gallery':
    case 'product_info':
    case 'product_description':
    case 'product_reviews':
    case 'product_related':
    case 'product_upsells':
      return (
        <section data-section-id={section.id} data-section-type={section.type}>
          {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
          {subtitle && <p className="text-gray-600 mb-4">{subtitle}</p>}
          {children}
        </section>
      );
    default:
      return null;
  }
}

// ===========================================
// Accordion Section - Server Component
// ===========================================

interface AccordionItem {
  id: string;
  title: string;
  content: string;
  isOpen: boolean;
  contentSource: string;
  dynamicField?: string;
}

function AccordionSection({ 
  section, 
  context 
}: { 
  section: ProductPageSection; 
  context: DynamicContentContext;
}) {
  const items = (section.content.items as AccordionItem[]) || [];
  const style = (section.settings.style as string) || 'bordered';

  const borderClass = style === 'bordered' 
    ? 'border border-gray-200 rounded-lg mb-2' 
    : style === 'minimal' 
      ? 'border-b border-gray-100' 
      : '';

  return (
    <div className="product-accordion my-6" data-section-id={section.id}>
      {items.map((item, index) => {
        const resolvedContent = resolveDynamicContent(item.content, context);
        
        // Skip empty items
        if (!resolvedContent && item.contentSource === 'dynamic') return null;
        
        return (
          <details 
            key={item.id || `accordion-${index}`} 
            className={`group ${borderClass}`}
            open={item.isOpen}
          >
            <summary className="flex items-center justify-between cursor-pointer px-4 py-3 font-medium text-gray-900 hover:bg-gray-50">
              <span>{item.title}</span>
              <svg 
                className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-4 pb-4 text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              {resolvedContent}
            </div>
          </details>
        );
      })}
    </div>
  );
}

// ===========================================
// Tabs Section - Requires Client Component for interactivity
// ===========================================

import { TabsSectionClient } from './tabs-section-client';

interface TabItem {
  id: string;
  title: string;
  content: string;
  contentSource: string;
  dynamicField?: string;
}

function TabsSection({ 
  section, 
  context 
}: { 
  section: ProductPageSection; 
  context: DynamicContentContext;
}) {
  const items = (section.content.items as TabItem[]) || [];
  const style = (section.settings.style as string) || 'underline';
  const alignment = (section.settings.alignment as string) || 'right';

  // Pre-resolve all content on the server
  const resolvedItems = items.map(item => ({
    ...item,
    resolvedContent: resolveDynamicContent(item.content, context),
  }));

  return (
    <TabsSectionClient 
      items={resolvedItems}
      style={style}
      alignment={alignment}
      sectionId={section.id}
    />
  );
}

// ===========================================
// Features Section - Server Component
// ===========================================

interface FeatureItem {
  id: string;
  icon: string;
  text: string;
  isVisible: boolean;
}

function FeaturesSection({ 
  section, 
  context 
}: { 
  section: ProductPageSection; 
  context: DynamicContentContext;
}) {
  const items = (section.content.items as FeatureItem[]) || [];
  const layout = (section.settings.layout as string) || 'horizontal';

  const visibleItems = items.filter(item => item.isVisible);
  
  const layoutClass = layout === 'horizontal' 
    ? 'flex flex-wrap gap-4 md:gap-6' 
    : layout === 'grid'
      ? 'grid grid-cols-2 md:grid-cols-3 gap-4'
      : 'flex flex-col gap-3';

  return (
    <div className={`product-features my-6 ${layoutClass}`} data-section-id={section.id}>
      {visibleItems.map((item, index) => {
        const resolvedText = resolveDynamicContent(item.text, context);
        const iconSvg = featureIcons[item.icon] || featureIcons.check;
        
        return (
          <div 
            key={item.id || `feature-${index}`} 
            className="flex items-center gap-2 text-sm text-gray-600"
          >
            <span 
              className="text-gray-400 flex-shrink-0"
              dangerouslySetInnerHTML={{ __html: iconSvg }}
            />
            <span>{resolvedText}</span>
          </div>
        );
      })}
    </div>
  );
}

// ===========================================
// Text Block Section - Server Component
// ===========================================

function TextBlockSection({ 
  section, 
  context 
}: { 
  section: ProductPageSection; 
  context: DynamicContentContext;
}) {
  const text = (section.content.text as string) || '';
  const textAlign = (section.content.textAlign as string) || 'right';
  
  const resolvedText = resolveDynamicContent(text, context);
  
  const alignClass = textAlign === 'center' 
    ? 'text-center' 
    : textAlign === 'left' 
      ? 'text-left' 
      : 'text-right';

  return (
    <div 
      className={`product-text-block my-6 ${alignClass}`}
      data-section-id={section.id}
    >
      <div 
        className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-line"
        dangerouslySetInnerHTML={{ __html: resolvedText }}
      />
    </div>
  );
}

// ===========================================
// Breadcrumb Section - Server Component
// ===========================================

function BreadcrumbSection({ 
  section, 
  context 
}: { 
  section: ProductPageSection; 
  context: DynamicContentContext;
}) {
  const showHome = (section.settings.showHome as boolean) ?? true;
  const showCategory = (section.settings.showCategory as boolean) ?? true;
  const separator = (section.settings.separator as string) || '/';
  
  const productTitle = context.product.name;
  const categoryName = context.product.category;

  return (
    <nav 
      className="product-breadcrumb text-sm text-gray-500 mb-4"
      data-section-id={section.id}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-2">
        {showHome && (
          <>
            <li>
              <a href="/" className="hover:text-gray-900 transition-colors">
                ראשי
              </a>
            </li>
            <li className="text-gray-300">{separator}</li>
          </>
        )}
        {showCategory && categoryName && (
          <>
            <li>
              <span className="text-gray-600">{categoryName}</span>
            </li>
            <li className="text-gray-300">{separator}</li>
          </>
        )}
        <li className="text-gray-900 font-medium truncate max-w-[200px]">
          {productTitle}
        </li>
      </ol>
    </nav>
  );
}

// ===========================================
// Divider Section - Server Component
// ===========================================

function DividerSection() {
  return (
    <hr className="my-6 border-gray-200" />
  );
}

// ===========================================
// Spacer Section - Server Component
// ===========================================

function SpacerSection({ section }: { section: ProductPageSection }) {
  const height = (section.settings.height as string) || '40px';
  
  return (
    <div style={{ height }} aria-hidden="true" />
  );
}

