/**
 * Section System - Common Types
 * טיפוסים משותפים לכל הסקשנים
 */

// ============================================
// TYPOGRAPHY
// ============================================
export type TitleSize = 'sm' | 'md' | 'lg' | 'xl';
export type SubtitleSize = 'sm' | 'md' | 'lg';
export type TextSize = 'sm' | 'md' | 'lg';
export type FontWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold';

export interface TitleTypography {
  titleColor?: string;
  titleSize?: TitleSize;
  titleWeight?: FontWeight;
}

export interface SubtitleTypography {
  subtitleColor?: string;
  subtitleSize?: SubtitleSize;
  subtitleWeight?: FontWeight;
}

export interface TextTypography {
  textColor?: string;
  textSize?: TextSize;
}

export interface FullTypography extends TitleTypography, SubtitleTypography, TextTypography {}

// ============================================
// SPACING
// ============================================
export interface SpacingSettings {
  marginTop?: number;
  marginBottom?: number;
  paddingTop?: number;
  paddingBottom?: number;
}

// ============================================
// BACKGROUND
// ============================================
export interface BackgroundSettings {
  backgroundColor?: string;
  overlay?: number;
}

// ============================================
// ADVANCED
// ============================================
export interface AdvancedSettings {
  customClass?: string;
  customId?: string;
  customCss?: string;
}

// ============================================
// BUTTON
// ============================================
export interface ButtonSettings {
  buttonTextColor?: string;
  buttonBackgroundColor?: string;
  buttonBorderColor?: string;
}

export interface ButtonContent {
  buttonText?: string;
  buttonLink?: string;
}

// ============================================
// GRID / LAYOUT
// ============================================
export type LayoutType = 'grid' | 'slider';

export interface GridSettings {
  columns?: number;
  mobileColumns?: number;
  tabletColumns?: number;
  gap?: number;
}

// ============================================
// SLIDER
// ============================================
export type ArrowStyle = 'circle' | 'square' | 'minimal';
export type DotsStyle = 'dots' | 'lines' | 'numbers';

export interface SliderSettings {
  showArrows?: boolean;
  showDots?: boolean;
  arrowStyle?: ArrowStyle;
  dotsStyle?: DotsStyle;
  autoplay?: boolean;
  autoplayInterval?: number;
  loop?: boolean;
}

// ============================================
// COMBINED SETTINGS
// ============================================

/** Base settings that ALL sections have */
export interface BaseSectionSettings extends 
  SpacingSettings, 
  BackgroundSettings, 
  AdvancedSettings {}

/** Settings for sections with title/subtitle */
export interface HeaderSectionSettings extends 
  BaseSectionSettings, 
  TitleTypography, 
  SubtitleTypography {}

/** Settings for grid-based sections */
export interface GridSectionSettings extends 
  HeaderSectionSettings, 
  GridSettings {
  layout?: LayoutType;
}

/** Settings for grid sections that can also be sliders */
export interface GridSliderSectionSettings extends 
  GridSectionSettings, 
  SliderSettings {}

/** Settings for sections with CTA buttons */
export interface CTASectionSettings extends 
  HeaderSectionSettings, 
  ButtonSettings {}

// ============================================
// BASE SECTION PROPS
// ============================================
export interface BaseSectionProps<
  TContent = Record<string, unknown>,
  TSettings extends BaseSectionSettings = BaseSectionSettings
> {
  title: string | null;
  subtitle: string | null;
  content: TContent;
  settings: TSettings;
  sectionId?: string;
  basePath?: string;
}

// ============================================
// TEXT ALIGNMENT
// ============================================
export type TextAlign = 'left' | 'center' | 'right';
export type TextPosition = 'top' | 'center' | 'bottom';

export interface TextAlignSettings {
  textAlign?: TextAlign;
  textPosition?: TextPosition;
}

