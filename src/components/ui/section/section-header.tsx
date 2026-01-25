/**
 * Section Header - Title and subtitle for sections
 * כותרת ותת-כותרת לסקשנים
 */

import { cn, getTitleClasses, getSubtitleClasses } from '@/lib/section-system';
import type { TitleTypography, SubtitleTypography } from '@/lib/section-system';

export interface SectionHeaderProps extends TitleTypography, SubtitleTypography {
  title: string | null;
  subtitle?: string | null;
  align?: 'left' | 'center' | 'right';
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  /** Show data attributes for live editing */
  editable?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  align = 'center',
  className,
  titleClassName,
  subtitleClassName,
  titleColor,
  titleSize = 'md',
  titleWeight = 'light',
  subtitleColor,
  subtitleSize = 'md',
  subtitleWeight = 'normal',
  editable = true,
}: SectionHeaderProps) {
  if (!title && !subtitle) return null;

  const alignClass = align === 'left' 
    ? 'text-right' // RTL visual left
    : align === 'right' 
      ? 'text-left' // RTL visual right
      : 'text-center';

  return (
    <div className={cn('mb-8 md:mb-12', alignClass, className)}>
      {title && (
        <h2
          className={cn(
            getTitleClasses(titleSize, titleWeight),
            titleClassName
          )}
          style={{ color: titleColor || undefined }}
          {...(editable ? { 'data-section-title': '' } : {})}
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <p
          className={cn(
            'mt-2 md:mt-4',
            getSubtitleClasses(subtitleSize, subtitleWeight),
            subtitleClassName
          )}
          style={{ color: subtitleColor || 'rgb(107 114 128)' }}
          {...(editable ? { 'data-section-subtitle': '' } : {})}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

