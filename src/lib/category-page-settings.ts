/**
 * Category Page Settings - Server-Side Configuration
 * All settings are read on the server - Zero client JS for layout!
 * 
 * ⚡ Performance (REQUIREMENTS.md compliant):
 * - Settings stored in store.settings.categoryPageSettings
 * - Server components read settings directly - no hydration
 * - Preview mode uses postMessage for real-time updates
 */

export type AspectRatio = '1:1' | '3:4' | '4:3' | '4:5' | '16:9';
export type BannerAspectRatio = '16:9' | '21:9' | '3:1' | '4:1' | '2:1' | '3:2' | '4:3';

export interface CategoryPageSettings {
  // Banner settings
  banner: {
    show: boolean;               // הצג באנר בראש הקטגוריה
    showTitle: boolean;          // הצג כיתוב (שם הקטגוריה)
    showDescription: boolean;    // הצג תיאור
    showParentCategory: boolean; // הצג קטגוריית אב
    overlayOpacity: number;      // שקיפות הכיהוי (0-100)
    height: 'small' | 'medium' | 'large'; // גובה הבאנר (לגרסאות קודמות)
    // רטיו נפרד למובייל ולמחשב - לתמונות אופקיות
    desktopAspectRatio: BannerAspectRatio;
    mobileAspectRatio: BannerAspectRatio;
    useAspectRatio: boolean;     // האם להשתמש ברטיו במקום גובה קבוע
  };
  
  // Subcategories grid settings
  subcategories: {
    show: boolean;               // הצג תתי קטגוריות
    mobileColumns: 1 | 2;        // כמות בשורה במובייל
    desktopColumns: 2 | 3 | 4;   // כמות בשורה במחשב
    aspectRatio: AspectRatio;    // יחס גובה-רוחב
    showOverlay: boolean;        // הצג שכבת כיהוי
    overlayOpacity: number;      // שקיפות הכיהוי
  };
  
  // Products grid settings
  products: {
    mobileColumns: 2 | 3;        // כמות בשורה במובייל
    desktopColumns: 3 | 4 | 5;   // כמות בשורה במחשב
    showCount: boolean;          // הצג מספר פריטים
  };
  
  // Breadcrumb settings
  breadcrumb: {
    show: boolean;
  };
}

// Default settings
export const defaultCategoryPageSettings: CategoryPageSettings = {
  banner: {
    show: true,
    showTitle: true,
    showDescription: true,
    showParentCategory: true,
    overlayOpacity: 30,
    height: 'medium',
    desktopAspectRatio: '21:9',
    mobileAspectRatio: '4:3',
    useAspectRatio: false, // ברירת מחדל: גובה קבוע (לתאימות אחורה)
  },
  
  subcategories: {
    show: true,
    mobileColumns: 2,
    desktopColumns: 4,
    aspectRatio: '4:3',
    showOverlay: true,
    overlayOpacity: 20,
  },
  
  products: {
    mobileColumns: 2,
    desktopColumns: 4,
    showCount: true,
  },
  
  breadcrumb: {
    show: true,
  },
};

// Get category page settings from store settings
export function getCategoryPageSettings(storeSettings: Record<string, unknown>): CategoryPageSettings {
  const saved = storeSettings.categoryPageSettings as Partial<CategoryPageSettings> | undefined;
  
  if (!saved) {
    return defaultCategoryPageSettings;
  }
  
  // Merge with defaults (in case new fields were added)
  return {
    banner: { ...defaultCategoryPageSettings.banner, ...saved.banner },
    subcategories: { ...defaultCategoryPageSettings.subcategories, ...saved.subcategories },
    products: { ...defaultCategoryPageSettings.products, ...saved.products },
    breadcrumb: { ...defaultCategoryPageSettings.breadcrumb, ...saved.breadcrumb },
  };
}

// Banner height classes
export const bannerHeightClasses: Record<string, string> = {
  small: 'h-[30vh] min-h-[250px]',
  medium: 'h-[50vh] min-h-[400px]',
  large: 'h-[70vh] min-h-[500px]',
};

// Aspect ratio classes for subcategories
export const aspectRatioClasses: Record<AspectRatio, string> = {
  '1:1': 'aspect-square',
  '3:4': 'aspect-[3/4]',
  '4:3': 'aspect-[4/3]',
  '4:5': 'aspect-[4/5]',
  '16:9': 'aspect-video',
};

// Banner aspect ratio classes - more horizontal options for banners
export const bannerAspectRatioClasses: Record<BannerAspectRatio, string> = {
  '16:9': 'aspect-video',         // וידאו רגיל
  '21:9': 'aspect-[21/9]',        // אולטרה-וויד (קולנועי)
  '3:1': 'aspect-[3/1]',          // באנר רחב מאוד
  '4:1': 'aspect-[4/1]',          // סרט צר
  '2:1': 'aspect-[2/1]',          // פנורמי
  '3:2': 'aspect-[3/2]',          // צילום קלאסי
  '4:3': 'aspect-[4/3]',          // מסך קלאסי
};

// Labels for banner aspect ratios
export const bannerAspectRatioLabels: Record<BannerAspectRatio, string> = {
  '16:9': 'וידאו (16:9)',
  '21:9': 'קולנועי (21:9)',
  '3:1': 'באנר רחב (3:1)',
  '4:1': 'סרט צר (4:1)',
  '2:1': 'פנורמי (2:1)',
  '3:2': 'צילום (3:2)',
  '4:3': 'קלאסי (4:3)',
};

