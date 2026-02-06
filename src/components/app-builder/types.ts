/**
 * Admin Panel Types - Matches mobile app MobileAppConfig
 */

export interface MobileAppConfig {
  version: number;
  updatedAt: string;
  theme: AppTheme;
  typography: AppTypography;
  homeSections: HomeSection[];
  tabBar: TabBarConfig;
  productDisplay: ProductDisplayConfig;
}

export interface AppTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  accentColor: string;
  textPrimary: string;
  textSecondary: string;
  errorColor: string;
  successColor: string;
}

export interface AppTypography {
  headingFont: string;
  bodyFont: string;
  headingWeight: string;
  bodyWeight: string;
  headingLetterSpacing: number;
  uppercaseHeadings: boolean;
}

export interface TabBarConfig {
  style: 'text-only' | 'icons' | 'icons-text';
  labels: {
    home: string;
    shop: string;
    search: string;
    wishlist: string;
    account: string;
  };
}

export interface ProductDisplayConfig {
  gridColumns: 2 | 3;
  imageRatio: '2:3' | '3:4' | '1:1' | '4:5';
  showPrice: boolean;
  showSaleBadge: boolean;
  saleBadgeText: string;
}

export type HomeSection =
  | HeroBannerSection
  | CategoryStripSection
  | FeaturedProductsSection
  | EditorialBannerSection
  | AnnouncementBarSection
  | SpacerSection;

export interface HeroBannerSection {
  id: string;
  type: 'hero_banner';
  order: number;
  visible: boolean;
  data: {
    imageUrl: string;
    title: string;
    subtitle: string;
    buttonText: string;
    linkType: 'category' | 'product' | 'url';
    linkValue: string;
    overlayOpacity: number;
    textColor: string;
    textPosition: 'center' | 'bottom-left' | 'bottom-center';
    height: 'full' | 'large' | 'medium';
  };
}

export interface CategoryStripSection {
  id: string;
  type: 'category_strip';
  order: number;
  visible: boolean;
  data: {
    categories: Array<{ name: string; slug: string; imageUrl?: string }>;
    style: 'text' | 'image-circle' | 'image-square';
  };
}

export interface FeaturedProductsSection {
  id: string;
  type: 'featured_products';
  order: number;
  visible: boolean;
  data: {
    title: string;
    subtitle?: string;
    source: 'featured' | 'category' | 'new-arrivals' | 'sale';
    categorySlug?: string;
    limit: number;
    columns: 2 | 3;
  };
}

export interface EditorialBannerSection {
  id: string;
  type: 'editorial_banner';
  order: number;
  visible: boolean;
  data: {
    imageUrl: string;
    title: string;
    subtitle?: string;
    buttonText?: string;
    linkType: 'category' | 'product' | 'url';
    linkValue: string;
    height: 'large' | 'medium' | 'small';
    overlayOpacity?: number;
    textColor?: string;
  };
}

export interface AnnouncementBarSection {
  id: string;
  type: 'announcement';
  order: number;
  visible: boolean;
  data: {
    text: string;
    backgroundColor: string;
    textColor: string;
  };
}

export interface SpacerSection {
  id: string;
  type: 'spacer';
  order: number;
  visible: boolean;
  data: {
    height: number;
  };
}

// Section type labels
export const SECTION_TYPE_LABELS: Record<string, string> = {
  hero_banner: 'Hero Banner',
  category_strip: 'Category Strip',
  featured_products: 'Featured Products',
  editorial_banner: 'Editorial Banner',
  announcement: 'Announcement Bar',
  spacer: 'Spacer',
};
