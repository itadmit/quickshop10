# 🆕 Product Page V2 - Fully Editable Architecture

## 📋 Implementation Status

### ✅ Completed
1. **Database Schema** - Added `stores.productPageSections` JSONB column
2. **Dynamic Content** - Created `resolveDynamicContent()` with {{product.xxx}} syntax
3. **Section Types** - Defined all product page section types
4. **Editor Support** - Updated SectionTree and SectionSettings for product page
5. **Section Renderers** - Created Server Components for accordion, tabs, features, etc.
6. **API Updates** - Extended sections API to handle product page

### 🔄 Pending
1. **Full Product Page Migration** - Product page still uses V1 settings
2. **Preview Integration** - Live preview updates for new sections
3. **Templates UI** - Template picker in editor

### 📝 Migration Path
The V2 system is designed to work alongside V1. When `stores.productPageSections` has data,
the editor will use the new system. Otherwise, it falls back to V1 (`stores.settings.productPageSettings`).

---

## 🎯 Vision

עמוד מוצר שניתן לעריכה **בדיוק כמו עמוד הבית** - עם סקשנים, תוכן דינמי, ותבניות.

```
Before (V1):                           After (V2):
┌─────────────────────┐                ┌─────────────────────┐
│ Fixed Structure:    │                │ Editable Sections:  │
│ - Gallery           │                │ + Add Section       │
│ - Info              │       →        │ + Drag & Drop       │
│ - Features          │                │ + Dynamic Content   │
│ - Description       │                │ + Templates         │
│ - Reviews           │                │ + Any Order         │
│ - Related           │                └─────────────────────┘
└─────────────────────┘
```

---

## 🗄️ Database Changes

### New Column: `stores.productPageSections`

```sql
ALTER TABLE stores 
ADD COLUMN product_page_sections jsonb DEFAULT '[]'::jsonb;
```

### Section Structure (same as home page):

```typescript
interface ProductPageSection {
  id: string;
  type: ProductSectionType;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
}

type ProductSectionType = 
  // Product-specific sections
  | 'product_gallery'      // Gallery with zoom, thumbnails
  | 'product_info'         // Title, price, add to cart
  | 'product_description'  // Description (can be accordion)
  | 'product_variants'     // Variant selector
  | 'product_addons'       // Product addons
  | 'product_reviews'      // Reviews section
  | 'product_related'      // Related products
  | 'product_upsells'      // Upsell products
  // Generic sections (with dynamic content support)
  | 'text_block'           // Rich text with {{product.x}} support
  | 'accordion'            // Accordion items with dynamic content
  | 'tabs'                 // Tabbed content with dynamic content
  | 'features'             // Icon + text list
  | 'image_text'           // Image with text
  | 'video'                // Video embed
  | 'custom_html';         // Custom HTML
```

---

## 🔗 Dynamic Content System

### Syntax: `{{variable.path}}`

```
{{product.title}}              → "חולצת כותנה אורגנית"
{{product.price}}              → "₪149.00"
{{product.comparePrice}}       → "₪199.00"
{{product.discount}}           → "25%"
{{product.description}}        → Full HTML description
{{product.shortDescription}}   → Short text
{{product.sku}}                → "SKU-12345"
{{product.inventory}}          → "15 במלאי"
{{product.category}}           → "חולצות"

// Custom fields (metafields)
{{product.custom.material}}    → "כותנה 100%"
{{product.custom.care}}        → "כביסה ב-30°"
{{product.custom.origin}}      → "ישראל"

// Variant-specific (when selected)
{{variant.title}}              → "M / אדום"
{{variant.price}}              → "₪159.00"
{{variant.sku}}                → "SKU-12345-M-RED"
{{variant.inventory}}          → "5 במלאי"
```

### Implementation: `resolveDynamicContent()`

```typescript
// src/lib/dynamic-content.ts

export interface DynamicContentContext {
  product: {
    title: string;
    price: string;
    comparePrice?: string;
    description?: string;
    shortDescription?: string;
    sku?: string;
    inventory?: number;
    category?: string;
    custom: Record<string, string>; // Metafield values
  };
  variant?: {
    title: string;
    price: string;
    sku?: string;
    inventory?: number;
  };
  store: {
    name: string;
    currency: string;
  };
}

export function resolveDynamicContent(
  template: string, 
  context: DynamicContentContext
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getNestedValue(context, path.trim());
    return value !== undefined ? String(value) : match;
  });
}

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((acc, key) => 
    acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined
  , obj);
}
```

### Editor UI: Dynamic Content Picker

```
┌─────────────────────────────────────────┐
│  טקסט:                                  │
│  ┌─────────────────────────────────┐   │
│  │ המוצר "{{product.title}}" עשוי  │   │
│  │ מ{{product.custom.material}}    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [🔗 הוסף תוכן דינמי ▼]                │
│  ┌─────────────────────────────────┐   │
│  │ 📦 מוצר                         │   │
│  │   • שם מוצר                     │   │
│  │   • מחיר                        │   │
│  │   • תיאור                       │   │
│  │   • מלאי                        │   │
│  │ 🏷️ שדות מותאמים                │   │
│  │   • חומר (material)             │   │
│  │   • הוראות טיפול (care)         │   │
│  │   • ארץ ייצור (origin)          │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 📋 Default Sections (Template: "Clean")

```typescript
const defaultProductPageSections: ProductPageSection[] = [
  {
    id: 'gallery',
    type: 'product_gallery',
    title: null,
    subtitle: null,
    content: {},
    settings: {
      layout: 'carousel',
      thumbnailsPosition: 'bottom',
      aspectRatio: '3:4',
      enableZoom: true,
      showArrows: true,
    },
    sortOrder: 0,
    isActive: true,
  },
  {
    id: 'info',
    type: 'product_info',
    title: null,
    subtitle: null,
    content: {},
    settings: {
      showComparePrice: true,
      showDiscount: true,
      inventoryDisplay: 'count',
    },
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'description',
    type: 'product_description',
    title: null,
    subtitle: null,
    content: {},
    settings: {
      style: 'text', // 'text' | 'accordion'
    },
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'features',
    type: 'features',
    title: null,
    subtitle: null,
    content: {
      items: [
        { icon: 'truck', text: 'משלוח חינם מעל ₪200' },
        { icon: 'refresh', text: '14 יום להחזרה' },
        { icon: 'shield', text: 'אחריות יצרן' },
      ],
    },
    settings: {},
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'reviews',
    type: 'product_reviews',
    title: 'ביקורות',
    subtitle: null,
    content: {},
    settings: {
      showRating: true,
      showCount: true,
    },
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'related',
    type: 'product_related',
    title: 'אולי יעניין אותך',
    subtitle: 'מוצרים נוספים שאהבו לקוחות',
    content: {},
    settings: {
      count: 4,
    },
    sortOrder: 5,
    isActive: true,
  },
];
```

---

## 🎨 Product Page Templates

```typescript
interface ProductPageTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  sections: ProductPageSection[];
}

const productPageTemplates: ProductPageTemplate[] = [
  {
    id: 'classic',
    name: 'קלאסי',
    description: 'גלריה בצד, מידע בצד, תיאור למטה',
    thumbnail: '/templates/product/classic.png',
    sections: [...], // Standard layout
  },
  {
    id: 'modern',
    name: 'מודרני',
    description: 'גלריה רחבה, מידע מתחת',
    thumbnail: '/templates/product/modern.png',
    sections: [...], // Full-width gallery
  },
  {
    id: 'detailed',
    name: 'מפורט',
    description: 'אקורדיון עם מידע טכני',
    thumbnail: '/templates/product/detailed.png',
    sections: [...], // With accordion section
  },
  {
    id: 'fashion',
    name: 'אופנה',
    description: 'לוקבוק סטייל עם גלריה גדולה',
    thumbnail: '/templates/product/fashion.png',
    sections: [...], // Fashion-focused
  },
];
```

---

## 🏗️ Implementation Plan

### Phase 1: Database & Types (This PR)
- [ ] Add `productPageSections` column to stores
- [ ] Create `ProductPageSection` types
- [ ] Create migration script from V1 settings

### Phase 2: Dynamic Content (This PR)
- [ ] Create `resolveDynamicContent()` function
- [ ] Define all available variables
- [ ] Create Dynamic Content Picker component

### Phase 3: Editor Updates (This PR)
- [ ] Update `SectionTree` for product page sections
- [ ] Update `SectionSettings` for new section types
- [ ] Add "Add Section" menu for product page

### Phase 4: Rendering (This PR)
- [ ] Create section renderers for product-specific types
- [ ] Integrate dynamic content resolution
- [ ] Update product page to render from sections

### Phase 5: Templates (Future)
- [ ] Create product page template definitions
- [ ] Add template picker in editor
- [ ] Apply template = replace sections

---

## 🔄 Migration: V1 → V2

```typescript
// Convert old productPageSettings to new sections array
function migrateProductPageSettings(oldSettings: ProductPageSettings): ProductPageSection[] {
  const sections: ProductPageSection[] = [];
  
  // Map old sections to new format
  oldSettings.sections.forEach((s, index) => {
    sections.push({
      id: s.id,
      type: `product_${s.type}` as ProductSectionType,
      title: null,
      subtitle: null,
      content: {},
      settings: {}, // Map from old settings
      sortOrder: index,
      isActive: s.isVisible,
    });
  });
  
  // Add features as separate section
  if (oldSettings.features?.length) {
    sections.push({
      id: 'features',
      type: 'features',
      title: null,
      subtitle: null,
      content: { items: oldSettings.features },
      settings: {},
      sortOrder: sections.length,
      isActive: true,
    });
  }
  
  return sections;
}
```

---

## ⚡ Performance Considerations

### Server-Side Rendering (Critical!)
- All sections rendered on server
- `resolveDynamicContent()` runs on server
- Zero client JS for static content
- Only interactive elements hydrated (add to cart, variant selector)

### Caching Strategy
- Product page sections cached at store level (same for all products)
- Product data cached per-product with ISR
- Dynamic content resolved per-request (fast - just string replace)

### Example: Full Server Render

```tsx
// app/shops/[slug]/(storefront)/product/[productSlug]/page.tsx

export default async function ProductPage({ params }) {
  const [store, product] = await Promise.all([
    getStoreBySlug(params.slug),
    getProductBySlug(params.slug, params.productSlug),
  ]);

  // Get sections from store
  const sections = store.productPageSections as ProductPageSection[];

  // Build context for dynamic content
  const context: DynamicContentContext = {
    product: {
      title: product.name,
      price: formatPrice(product.price),
      // ... more
      custom: product.metadata?.customFields || {},
    },
    store: { name: store.name, currency: '₪' },
  };

  return (
    <div>
      {sections
        .filter(s => s.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(section => (
          <ProductSection 
            key={section.id} 
            section={section} 
            product={product}
            context={context}
          />
        ))}
    </div>
  );
}
```

---

## 📁 File Structure

```
src/
├── lib/
│   ├── product-page-sections.ts      # Types, defaults, templates
│   ├── dynamic-content.ts            # resolveDynamicContent()
│   └── dynamic-content-variables.ts  # Available variables list
│
├── components/
│   └── product-sections/             # Section renderers
│       ├── product-gallery.tsx
│       ├── product-info.tsx
│       ├── product-description.tsx
│       ├── product-reviews.tsx
│       ├── product-related.tsx
│       ├── text-with-dynamic.tsx
│       ├── accordion-section.tsx
│       └── tabs-section.tsx
│
└── app/shops/[slug]/editor/
    ├── product-section-tree.tsx      # Section list for product page
    └── product-section-settings.tsx  # Settings for each section type
```

---

## ✅ Benefits

1. **Full Flexibility** - Add any section, any order
2. **Dynamic Content** - Reference product data anywhere
3. **Templates** - Quick start with pre-designed layouts
4. **Server Rendered** - Maximum performance
5. **Consistent UX** - Same editor for home & product pages
6. **Future Proof** - Easy to add new section types

