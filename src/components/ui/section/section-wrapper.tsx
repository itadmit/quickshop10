/**
 * Section Wrapper - Base container for all sections
 * עוטף כל סקשן עם padding, background, margins
 */

import { cn, getSpacingClasses } from '@/lib/section-system';
import type { BaseSectionSettings } from '@/lib/section-system';

export interface SectionWrapperProps {
  children: React.ReactNode;
  sectionId: string;
  sectionType: string;
  settings?: BaseSectionSettings;
  className?: string;
  innerClassName?: string;
  fullWidth?: boolean;
}

export function SectionWrapper({
  children,
  sectionId,
  sectionType,
  settings = {},
  className,
  innerClassName,
  fullWidth = false,
}: SectionWrapperProps) {
  const {
    backgroundColor,
    marginTop,
    marginBottom,
    paddingTop = 48,
    paddingBottom = 48,
  } = settings;

  const spacingClasses = getSpacingClasses({
    marginTop,
    marginBottom,
    paddingTop,
    paddingBottom,
  });

  return (
    <section
      data-section-id={sectionId}
      data-section-type={sectionType}
      className={cn(
        'relative',
        spacingClasses,
        className
      )}
      style={{
        backgroundColor: backgroundColor || undefined,
      }}
    >
      <div 
        className={cn(
          !fullWidth && 'container mx-auto px-4',
          innerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}

