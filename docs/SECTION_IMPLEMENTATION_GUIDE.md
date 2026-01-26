# מדריך יישום סקשנים - ארכיטקטורה מודולרית

## סקירה כללית

כל סקשן בבילדר מורכב מ-3 חלקים עיקריים:
1. **קומפוננטת הסקשן** - Server Component שמרנדר את הסקשן
2. **Handler** - לוגיקת עדכון DOM בזמן אמת
3. **Panel** - ממשק העריכה באדיטור

---

## 1. מבנה התיקיות

```
src/components/sections/
├── text-block/                    # תיקיית הסקשן
│   ├── index.ts                   # ייצוא המודול
│   └── TextBlockHandler.ts        # Handler לעדכונים בזמן אמת
├── text-block-section.tsx         # קומפוננטת הסקשן (Server Component)
├── handlers/
│   ├── index.ts                   # רישום כל ה-handlers
│   └── common-handler.ts          # הגדרות משותפות לכל הסקשנים
└── types.ts                       # טיפוסים משותפים

src/components/editor/
├── controls/                      # קומפוננטות בקרה משותפות
│   ├── TypographyControl.tsx      # בקרת טיפוגרפיה
│   ├── ButtonControl.tsx          # בקרת כפתור
│   ├── SpacingControl.tsx         # בקרת ריווחים
│   ├── BackgroundControl.tsx      # בקרת רקע (צבע/תמונה/וידאו)
│   ├── GridControl.tsx            # בקרת פריסה (רוחב, יישור אנכי)
│   ├── AdvancedControl.tsx        # הגדרות מתקדמות (margin, padding, z-index, animation)
│   ├── VisibilityControl.tsx      # בקרת נראות (הסתר במובייל/דסקטופ)
│   └── index.ts                   # ייצוא כל הבקרות
├── panels/
│   └── TextBlockPanel.tsx         # פאנל עריכה ספציפי לסקשן
└── ui/                            # קומפוננטות UI בסיסיות
    ├── EditorInput.tsx
    ├── EditorSelect.tsx
    ├── EditorSlider.tsx
    ├── EditorColorPicker.tsx
    ├── EditorToggle.tsx
    └── EditorSection.tsx
```

---

## 2. זרימת נתונים - איך עדכון בזמן אמת עובד

```
┌─────────────────────────────────────────────────────────────────┐
│                         EDITOR (Parent Window)                   │
│                                                                  │
│  1. משתמש משנה הגדרה בפאנל                                       │
│                    ↓                                             │
│  2. onChange קורא ל-updateSetting / updateMultipleSettings       │
│                    ↓                                             │
│  3. שולח postMessage לאייפריים עם העדכון                         │
│                    ↓                                             │
│  4. שומר ל-DB (debounced)                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓ postMessage
┌─────────────────────────────────────────────────────────────────┐
│                      IFRAME (Storefront Preview)                 │
│                                                                  │
│  5. EditorSectionHighlighter מקבל את ההודעה                      │
│                    ↓                                             │
│  6. מוצא את האלמנט לפי data-section-id                           │
│                    ↓                                             │
│  7. בודק אם יש handler ייעודי לסקשן                              │
│                    ↓                                             │
│  8. מפעיל את ה-handler שמעדכן את ה-DOM ישירות                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. יצירת Handler חדש לסקשן

### שלב 1: יצירת קובץ Handler

```typescript
// src/components/sections/[section-name]/[SectionName]Handler.ts

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

export function handle[SectionName]Update(
  element: Element,
  updates: Partial<Section>
): void {
  const el = element as HTMLElement;

  // =====================================================
  // הגדרות משותפות (רקע, נראות, ריווחים, אנימציה וכו')
  // =====================================================
  applyCommonUpdates(el, updates);

  // =====================================================
  // הגדרות ספציפיות לסקשן
  // =====================================================
  
  // דוגמה: עדכון כותרת
  if (updates.title !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      titleEl.textContent = updates.title || '';
    }
  }

  // דוגמה: עדכון צבע כותרת
  if (updates.settings?.titleColor !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      titleEl.style.color = updates.settings.titleColor as string;
    }
  }
}

// ברירות מחדל לתוכן
export const defaultContent = {
  // ...
};

// ברירות מחדל להגדרות
export const defaultSettings = {
  // ...
};
```

### שלב 2: יצירת קובץ index.ts

```typescript
// src/components/sections/[section-name]/index.ts

export { 
  handle[SectionName]Update as handler,
  defaultContent,
  defaultSettings,
} from './[SectionName]Handler';

export const config = {
  type: '[section_type]',
  name: 'שם בעברית',
  icon: 'IconName',
};
```

### שלב 3: רישום ה-Handler

```typescript
// src/components/sections/handlers/index.ts

import { handler as [sectionName]Handler } from '../[section-name]';

export const handlers: Record<string, SectionHandler> = {
  // ...handlers קיימים
  [section_type]: [sectionName]Handler,
};
```

---

## 4. ההגדרות המשותפות ב-common-handler

הפונקציה `applyCommonUpdates` מטפלת אוטומטית ב:

### רקע
- `backgroundColor` - צבע רקע
- `backgroundImage` - תמונת רקע
- `backgroundVideo` - וידאו רקע
- `backgroundSize` - גודל תמונה (cover, contain, auto)
- `backgroundPosition` - מיקום תמונה (center, top, bottom...)
- `overlay` - שכבה כהה (0-100%)

### ריווחים
- `paddingTop`, `paddingBottom`, `paddingLeft`, `paddingRight`
- `marginTop`, `marginBottom`, `marginLeft`, `marginRight`

### פריסה
- `sectionWidth` - רוחב סקשן (full/boxed)
- `contentWidth` - רוחב תוכן בפיקסלים (כש-boxed)
- `minHeight` - גובה מינימום
- `minHeightUnit` - יחידה (px/vh)
- `verticalAlign` - יישור אנכי (start/center/end)
- `textAlign` - יישור טקסט (left/center/right)

### נראות
- `isVisible` - האם להציג
- `hideOnMobile` - הסתר במובייל/טאבלט
- `hideOnDesktop` - הסתר במחשב

### מיקום
- `zIndex` - z-index

### CSS מותאם
- `customId` - ID מותאם
- `customClass` - Classes מותאמים

### אנימציה
- `animation` - סוג אנימציה (none/fadeIn/slideUp/slideDown/slideLeft/slideRight)
- `animationDuration` - משך בשניות

---

## 5. Data Attributes חיוניים

כל סקשן חייב לכלול את ה-data attributes הבאים:

```tsx
<section
  data-section-id={sectionId}           // חובה - מזהה ייחודי
  data-section-type="section_type"      // חובה - סוג הסקשן
  data-section-name="שם בעברית"         // רשות - לתצוגה
>
  {/* Content wrapper - לשליטה ברוחב ויישור */}
  <div data-content-wrapper>
    
    {/* אלמנטים עם data attributes */}
    <h2 data-section-title>כותרת</h2>
    <p data-section-subtitle>תת כותרת</p>
    <div data-content-text>תוכן</div>
    <a data-section-button>כפתור</a>
    
  </div>
</section>
```

### רשימת data attributes נפוצים:

| Attribute | שימוש |
|-----------|-------|
| `data-section-id` | מזהה ייחודי לסקשן |
| `data-section-type` | סוג הסקשן (לבחירת handler) |
| `data-section-name` | שם לתצוגה בעץ סקשנים |
| `data-content-wrapper` | עטיפת תוכן (לרוחב ויישור) |
| `data-section-title` | כותרת ראשית |
| `data-section-subtitle` | תת כותרת |
| `data-content-text` | תוכן טקסט |
| `data-section-button` | כפתור |
| `data-bg-video` | אלמנט וידאו רקע |
| `data-overlay` | שכבת overlay |

---

## 6. יצירת Panel לעריכה

### מבנה Panel עם 3 לשוניות

```tsx
// src/components/editor/panels/[SectionName]Panel.tsx

'use client';

import { useState } from 'react';
import { 
  TypographyControl,
  ButtonControl,
  FullBackgroundControl,
  SectionWidthControl,
  MinHeightControl,
  VerticalAlignControl,
  VisibilityControl,
  AdvancedControl,
  AlignmentControl,
} from '../controls';
import { EditorInput, EditorSection, MiniAccordion } from '../ui';

interface Props {
  section: Section;
  updateSetting: (key: string, value: any) => void;
  updateContent: (key: string, value: any) => void;
  updateMultipleSettings: (updates: Record<string, any>) => void;
}

export function [SectionName]Panel({ 
  section, 
  updateSetting, 
  updateContent,
  updateMultipleSettings 
}: Props) {
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'advanced'>('content');
  const { settings = {}, content = {} } = section;

  return (
    <div>
      {/* לשוניות */}
      <div className="flex border-b border-[var(--editor-border-default)]">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-2 text-sm ${activeTab === 'content' ? 'border-b-2 border-blue-500' : ''}`}
        >
          תוכן
        </button>
        <button
          onClick={() => setActiveTab('design')}
          className={`flex-1 py-2 text-sm ${activeTab === 'design' ? 'border-b-2 border-blue-500' : ''}`}
        >
          עיצוב
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          className={`flex-1 py-2 text-sm ${activeTab === 'advanced' ? 'border-b-2 border-blue-500' : ''}`}
        >
          מתקדם
        </button>
      </div>

      {/* תוכן לשונית תוכן */}
      {activeTab === 'content' && (
        <div className="p-4 space-y-4">
          <EditorInput
            label="כותרת"
            value={section.title || ''}
            onChange={(v) => updateContent('title', v)}
          />
          {/* ... שאר שדות התוכן */}
        </div>
      )}

      {/* תוכן לשונית עיצוב */}
      {activeTab === 'design' && (
        <div className="p-4 space-y-2">
          <MiniAccordion title="פריסה" defaultOpen>
            <SectionWidthControl
              value={settings.sectionWidth || 'full'}
              contentWidth={settings.contentWidth || 1200}
              onChange={updateSetting}
            />
            <MinHeightControl
              value={settings.minHeight || 0}
              unit={settings.minHeightUnit || 'px'}
              onChange={updateSetting}
            />
            <VerticalAlignControl
              value={settings.verticalAlign || 'center'}
              onChange={(v) => updateSetting('verticalAlign', v)}
            />
            <AlignmentControl
              value={settings.textAlign || 'center'}
              onChange={(v) => updateSetting('textAlign', v)}
            />
          </MiniAccordion>

          <MiniAccordion title="רקע">
            <FullBackgroundControl
              backgroundType={settings.backgroundType || 'color'}
              backgroundColor={settings.backgroundColor || '#ffffff'}
              backgroundImage={settings.backgroundImage || ''}
              backgroundVideo={settings.backgroundVideo || ''}
              backgroundSize={settings.backgroundSize || 'cover'}
              backgroundPosition={settings.backgroundPosition || 'center'}
              overlay={settings.overlay || 0}
              onChange={updateSetting}
            />
          </MiniAccordion>

          <MiniAccordion title="כותרת">
            <TypographyControl
              prefix="title"
              size={settings.titleSize || 36}
              sizeMobile={settings.titleSizeMobile || 28}
              weight={settings.titleWeight || 'bold'}
              color={settings.titleColor || '#000000'}
              onChange={updateMultipleSettings}
            />
          </MiniAccordion>

          {/* ... שאר הגדרות העיצוב */}
        </div>
      )}

      {/* תוכן לשונית מתקדם */}
      {activeTab === 'advanced' && (
        <div className="p-4 space-y-2">
          <VisibilityControl
            hideOnMobile={settings.hideOnMobile || false}
            hideOnDesktop={settings.hideOnDesktop || false}
            onChange={updateSetting}
          />
          <AdvancedControl
            settings={settings}
            onChange={updateSetting}
            defaultPadding={{ top: 64, bottom: 64, left: 0, right: 0 }}
            defaultMargin={{ top: 0, bottom: 0, left: 0, right: 0 }}
          />
        </div>
      )}
    </div>
  );
}
```

---

## 7. שימוש בקומפוננטות בקרה משותפות

### TypographyControl
```tsx
<TypographyControl
  prefix="title"                    // קידומת לשמות המשתנים
  size={settings.titleSize}         // גודל דסקטופ
  sizeMobile={settings.titleSizeMobile}  // גודל מובייל
  weight={settings.titleWeight}     // משקל פונט
  color={settings.titleColor}       // צבע
  onChange={updateMultipleSettings} // פונקציה שמעדכנת כמה הגדרות
/>
// יוצר: titleSize, titleSizeMobile, titleWeight, titleColor
```

### ButtonControl
```tsx
<ButtonControl
  textColor={settings.buttonTextColor}
  bgColor={settings.buttonBgColor}
  borderColor={settings.buttonBorderColor}
  borderRadius={settings.buttonBorderRadius}
  borderWidth={settings.buttonBorderWidth}
  onChange={updateSetting}
/>
```

### FullBackgroundControl
```tsx
<FullBackgroundControl
  backgroundType={settings.backgroundType || 'color'}
  backgroundColor={settings.backgroundColor}
  backgroundImage={settings.backgroundImage}
  backgroundVideo={settings.backgroundVideo}
  backgroundSize={settings.backgroundSize}
  backgroundPosition={settings.backgroundPosition}
  overlay={settings.overlay}
  onChange={updateSetting}
/>
```

### SectionWidthControl
```tsx
<SectionWidthControl
  value={settings.sectionWidth || 'full'}
  contentWidth={settings.contentWidth || 1200}
  onChange={updateSetting}
/>
```

### AdvancedControl
```tsx
<AdvancedControl
  settings={settings}
  onChange={updateSetting}
  defaultPadding={{ top: 64, bottom: 64, left: 0, right: 0 }}
  defaultMargin={{ top: 0, bottom: 0, left: 0, right: 0 }}
/>
// כולל: ריווחים, z-index, CSS ID/Classes, אנימציה
```

---

## 8. צ'קליסט ליישום סקשן חדש

- [ ] **Handler**
  - [ ] יצירת תיקייה `src/components/sections/[section-name]/`
  - [ ] יצירת `[SectionName]Handler.ts`
  - [ ] קריאה ל-`applyCommonUpdates(el, updates)` בתחילת ה-handler
  - [ ] טיפול בכל ההגדרות הספציפיות לסקשן
  - [ ] הגדרת `defaultContent` ו-`defaultSettings`
  - [ ] יצירת `index.ts` עם exports
  - [ ] רישום ב-`handlers/index.ts`

- [ ] **קומפוננטת הסקשן**
  - [ ] הוספת `data-section-id`, `data-section-type`
  - [ ] הוספת `data-content-wrapper` לעטיפת התוכן
  - [ ] הוספת data attributes לכל אלמנט שניתן לעריכה
  - [ ] שימוש ב-CSS משתנים לגדלים דינמיים

- [ ] **Panel**
  - [ ] מבנה 3 לשוניות: תוכן, עיצוב, מתקדם
  - [ ] שימוש ב-MiniAccordion לקיבוץ הגדרות
  - [ ] שימוש בקומפוננטות בקרה משותפות
  - [ ] `updateMultipleSettings` לעדכון מספר הגדרות יחד

- [ ] **בדיקות**
  - [ ] כל שינוי מתעדכן בזמן אמת באייפריים
  - [ ] שמירה עובדת ומתעדכנת ב-DB
  - [ ] רענון לאחר שמירה מציג נכון
  - [ ] עובד במובייל ובדסקטופ
  - [ ] אנימציות עובדות
  - [ ] נראות (הסתר) עובדת

---

## 9. טיפים חשובים

### 1. תמיד להשתמש ב-data attributes
```tsx
// נכון ✅
<h2 data-section-title>כותרת</h2>

// לא נכון ❌
<h2 className="title">כותרת</h2>
```

### 2. תמיד לקרוא ל-applyCommonUpdates ראשון
```typescript
export function handleMyUpdate(element: Element, updates: Partial<Section>): void {
  const el = element as HTMLElement;
  
  // ראשון! - מטפל בכל ההגדרות המשותפות
  applyCommonUpdates(el, updates);
  
  // אחר כך - הגדרות ספציפיות
  // ...
}
```

### 3. להשתמש ב-updateMultipleSettings לטיפוגרפיה
```tsx
// נכון ✅ - עדכון אחד עם כל ההגדרות
onChange={updateMultipleSettings}

// לא נכון ❌ - עדכונים נפרדים יכולים לגרום ל-race conditions
onChange={(k, v) => updateSetting(k, v)}
```

### 4. ברירות מחדל לריווחים
```tsx
<AdvancedControl
  defaultPadding={{ top: 64, bottom: 64, left: 0, right: 0 }}
  defaultMargin={{ top: 0, bottom: 0, left: 0, right: 0 }}
/>
```

### 5. בדיקת undefined לפני עדכון
```typescript
if (updates.settings?.titleColor !== undefined) {
  // עדכן רק אם הערך קיים
}
```

---

## 10. דוגמה מלאה - text_block

ראה את הקבצים:
- `src/components/sections/text-block-section.tsx` - קומפוננטת הסקשן
- `src/components/sections/text-block/TextBlockHandler.ts` - Handler
- `src/components/editor/panels/TextBlockPanel.tsx` - Panel

אלה משמשים כתבנית מושלמת ליישום סקשנים נוספים.

---

---

## 11. סטטוס הסקשנים הקיימים

| סקשן | Handler | Panel (Figma UI) | applyCommonUpdates | data-section-type | סטטוס |
|------|---------|------------------|-------------------|-------------------|-------|
| text_block | ✅ | ✅ TextBlockPanel | ✅ | ✅ | ✅ מלא |
| hero | ✅ | ✅ HeroPanel | ✅ | ✅ | ✅ מלא |
| reviews | ✅ | ✅ ReviewsPanel | ✅ | ✅ | ✅ מלא |
| features | ✅ | ✅ FeaturesPanel | ✅ | ✅ | ✅ מלא |
| faq | ✅ | ✅ FaqPanel | ✅ | ✅ | ✅ מלא |
| newsletter | ✅ | ✅ NewsletterPanel | ✅ | ✅ | ✅ מלא |
| contact | ✅ | ✅ ContactPanel | ✅ | ✅ | ✅ מלא |
| logos | ✅ | ✅ LogosPanel | ✅ | ✅ | ✅ מלא |
| gallery | ✅ | ✅ GalleryPanel | ✅ | ✅ | ✅ מלא |
| image_text | ✅ | ✅ ImageTextPanel | ✅ | ✅ | ✅ מלא |
| banner_small | ✅ | ✅ BannerSmallPanel | ✅ | ✅ | ✅ מלא |
| video_banner | ✅ | ✅ VideoBannerPanel | ✅ | ✅ | ✅ מלא |
| split_banner | ✅ | ✅ SplitBannerPanel | ✅ | ✅ | ✅ מלא |

**סקשנים שעדיין משתמשים בממשק הישן:**
- products, categories, series_grid, featured_items - אלו סקשנים דינמיים שתלויים בנתונים מה-DB
- hero_premium, hero_slider, quote_banner - צריכים פאנלים חדשים

---

*עודכן לאחרונה: ינואר 2026*

