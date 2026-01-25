/**
 * Section Grid - Responsive grid layout
 * גריד רספונסיבי לסקשנים
 */

import { cn, getGridClasses } from '@/lib/section-system';
import type { GridSettings } from '@/lib/section-system';

export interface SectionGridProps {
  children: React.ReactNode;
  settings?: GridSettings;
  className?: string;
  /** Data attribute name for live editing (e.g., 'reviews', 'features') */
  dataGridType?: string;
}

export function SectionGrid({
  children,
  settings = {},
  className,
  dataGridType,
}: SectionGridProps) {
  const gridClasses = getGridClasses(settings);

  const dataAttrs = dataGridType 
    ? { [`data-${dataGridType}-grid`]: '' }
    : {};

  return (
    <div
      className={cn(gridClasses, className)}
      {...dataAttrs}
    >
      {children}
    </div>
  );
}

