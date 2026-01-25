/**
 * Section Button - CTA button for sections
 * כפתור קריאה לפעולה
 */

import Link from 'next/link';
import { cn } from '@/lib/section-system';
import type { ButtonSettings } from '@/lib/section-system';

export interface SectionButtonProps extends ButtonSettings {
  text: string;
  href?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  /** Data attribute for live editing */
  dataAttribute?: string;
}

export function SectionButton({
  text,
  href,
  className,
  variant = 'primary',
  size = 'md',
  buttonTextColor,
  buttonBackgroundColor,
  buttonBorderColor,
  dataAttribute,
}: SectionButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variantClasses = {
    primary: 'bg-black text-white hover:bg-gray-800',
    secondary: 'bg-white text-black hover:bg-gray-100',
    outline: 'bg-transparent border-2 border-current hover:bg-black/5',
  };

  const baseClasses = cn(
    'inline-block font-medium transition-colors rounded-lg',
    sizeClasses[size],
    !buttonBackgroundColor && !buttonTextColor && variantClasses[variant],
    className
  );

  const style: React.CSSProperties = {};
  if (buttonBackgroundColor) style.backgroundColor = buttonBackgroundColor;
  if (buttonTextColor) style.color = buttonTextColor;
  if (buttonBorderColor) style.borderColor = buttonBorderColor;

  const dataAttrs = dataAttribute 
    ? { [`data-${dataAttribute}`]: '' }
    : {};

  if (href) {
    return (
      <Link
        href={href}
        className={baseClasses}
        style={style}
        {...dataAttrs}
      >
        {text}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={baseClasses}
      style={style}
      {...dataAttrs}
    >
      {text}
    </button>
  );
}

