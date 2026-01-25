'use client';

/**
 * Typography Settings - Reusable typography controls
 * הגדרות טיפוגרפיה - לשימוש חוזר בכל הסקשנים
 * 
 * Uses updateMultipleSettings to batch updates properly
 */

import { TypographyPopover } from '@/components/admin/typography-popover';

// ============================================
// TYPES
// ============================================

interface TypographySettingsProps {
  settings: Record<string, unknown>;
  // onChange can be either single-key updater or batch updater
  onChange: ((key: string, value: unknown) => void) | ((updates: Record<string, unknown>) => void);
  // If true, onChange is treated as batch updater
  batchMode?: boolean;
}

interface SingleTypographyProps {
  label?: string;
  prefix: string;
  settings: Record<string, unknown>;
  onChange: ((key: string, value: unknown) => void) | ((updates: Record<string, unknown>) => void);
  batchMode?: boolean;
  defaultColor?: string;
  defaultSize?: number;
  defaultSizeMobile?: number;
  defaultWeight?: 'light' | 'normal' | 'medium' | 'bold' | 'extrabold';
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Convert size keywords to pixels
function sizeToPx(size: unknown, defaultPx: number): number {
  if (typeof size === 'number') return size;
  const sizeMap: Record<string, number> = {
    'sm': 14, 'md': 18, 'lg': 24, 'xl': 32, '2xl': 48, '3xl': 60, '4xl': 72,
  };
  return sizeMap[size as string] || defaultPx;
}

// Map weight keywords
function mapWeight(weight: unknown, defaultWeight: string): 'light' | 'normal' | 'medium' | 'bold' | 'extrabold' {
  const validWeights = ['light', 'normal', 'medium', 'bold', 'extrabold', 'semibold'];
  if (validWeights.includes(weight as string)) {
    return (weight === 'semibold' ? 'bold' : weight) as 'light' | 'normal' | 'medium' | 'bold' | 'extrabold';
  }
  return defaultWeight as 'light' | 'normal' | 'medium' | 'bold' | 'extrabold';
}

// ============================================
// SINGLE TYPOGRAPHY CONTROL
// ============================================

export function SingleTypography({
  label = 'טקסט',
  prefix,
  settings,
  onChange,
  batchMode = false,
  defaultColor = '#000000',
  defaultSize = 16,
  defaultSizeMobile,
  defaultWeight = 'normal',
}: SingleTypographyProps) {
  const color = (settings[`${prefix}Color`] as string) || defaultColor;
  const size = sizeToPx(settings[`${prefix}Size`], defaultSize);
  const sizeMobile = settings[`${prefix}SizeMobile`] as number | undefined;
  const weight = mapWeight(settings[`${prefix}Weight`], defaultWeight);

  const handleChange = (typography: { 
    color?: string; 
    fontSize?: number; 
    fontSizeMobile?: number; 
    fontWeight?: 'light' | 'normal' | 'medium' | 'bold' | 'extrabold';
  }) => {
    const updates: Record<string, unknown> = {};
    
    if (typography.color !== undefined) {
      updates[`${prefix}Color`] = typography.color;
    }
    if (typography.fontSize !== undefined) {
      updates[`${prefix}Size`] = typography.fontSize;
    }
    if (typography.fontSizeMobile !== undefined) {
      updates[`${prefix}SizeMobile`] = typography.fontSizeMobile;
    } else if (typography.fontSize !== undefined) {
      updates[`${prefix}SizeMobile`] = typography.fontSize;
    }
    if (typography.fontWeight !== undefined) {
      updates[`${prefix}Weight`] = typography.fontWeight;
    }

    if (batchMode) {
      // Batch update mode - call onChange once with all values
      (onChange as (updates: Record<string, unknown>) => void)(updates);
    } else {
      // Legacy mode - call onChange for each value (may cause race conditions)
      const singleOnChange = onChange as (key: string, value: unknown) => void;
      Object.entries(updates).forEach(([key, value]) => {
        singleOnChange(key, value);
      });
    }
  };

  return (
    <TypographyPopover
      label={label}
      value={{ 
        color, 
        fontSize: size, 
        fontSizeMobile: sizeMobile ?? defaultSizeMobile ?? size,
        fontWeight: weight 
      }}
      onChange={handleChange}
      defaultColor={defaultColor}
    />
  );
}

// ============================================
// PRE-CONFIGURED TYPOGRAPHY CONTROLS
// ============================================

export function TitleTypography({ 
  settings, 
  onChange, 
  batchMode = false,
  label = 'כותרת', 
  defaultColor = '#000000' 
}: TypographySettingsProps & { label?: string; defaultColor?: string }) {
  return (
    <SingleTypography
      label={label}
      prefix="title"
      settings={settings}
      onChange={onChange}
      batchMode={batchMode}
      defaultColor={defaultColor}
      defaultSize={30}
      defaultSizeMobile={24}
      defaultWeight="bold"
    />
  );
}

export function SubtitleTypography({ 
  settings, 
  onChange, 
  batchMode = false,
  label = 'תת כותרת', 
  defaultColor = '#6b7280' 
}: TypographySettingsProps & { label?: string; defaultColor?: string }) {
  return (
    <SingleTypography
      label={label}
      prefix="subtitle"
      settings={settings}
      onChange={onChange}
      batchMode={batchMode}
      defaultColor={defaultColor}
      defaultSize={16}
      defaultSizeMobile={14}
      defaultWeight="normal"
    />
  );
}

export function TextTypography({ 
  settings, 
  onChange, 
  batchMode = false,
  label = 'טקסט', 
  defaultColor = '#4b5563' 
}: TypographySettingsProps & { label?: string; defaultColor?: string }) {
  return (
    <SingleTypography
      label={label}
      prefix="text"
      settings={settings}
      onChange={onChange}
      batchMode={batchMode}
      defaultColor={defaultColor}
      defaultSize={16}
      defaultSizeMobile={14}
      defaultWeight="normal"
    />
  );
}

// ============================================
// COMBINED TYPOGRAPHY GROUP
// ============================================

interface FullTypographyProps extends TypographySettingsProps {
  showTitle?: boolean;
  showSubtitle?: boolean;
  showText?: boolean;
  titleLabel?: string;
  subtitleLabel?: string;
  textLabel?: string;
  titleDefaultColor?: string;
  subtitleDefaultColor?: string;
  textDefaultColor?: string;
}

export function FullTypography({
  settings,
  onChange,
  batchMode = false,
  showTitle = true,
  showSubtitle = true,
  showText = false,
  titleLabel = 'כותרת',
  subtitleLabel = 'תת כותרת',
  textLabel = 'טקסט',
  titleDefaultColor = '#000000',
  subtitleDefaultColor = '#6b7280',
  textDefaultColor = '#4b5563',
}: FullTypographyProps) {
  return (
    <div className="space-y-1">
      {showTitle && (
        <TitleTypography 
          settings={settings} 
          onChange={onChange} 
          batchMode={batchMode}
          label={titleLabel} 
          defaultColor={titleDefaultColor} 
        />
      )}
      {showSubtitle && (
        <SubtitleTypography 
          settings={settings} 
          onChange={onChange} 
          batchMode={batchMode}
          label={subtitleLabel} 
          defaultColor={subtitleDefaultColor} 
        />
      )}
      {showText && (
        <TextTypography 
          settings={settings} 
          onChange={onChange} 
          batchMode={batchMode}
          label={textLabel} 
          defaultColor={textDefaultColor} 
        />
      )}
    </div>
  );
}

// Legacy exports for backward compatibility
export const TitleTypographySettings = TitleTypography;
export const SubtitleTypographySettings = SubtitleTypography;
export const TextTypographySettings = TextTypography;
export const FullTypographySettings = FullTypography;
