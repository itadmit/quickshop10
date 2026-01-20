'use client';

import { useState } from 'react';
import { useWishlistOptional } from './wishlist-provider';

// Simple class name concatenation utility
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface WishlistButtonProps {
  productId: string;
  variantId?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  textActive?: string;
  textInactive?: string;
}

export function WishlistButton({
  productId,
  variantId,
  className,
  size = 'md',
  showText = false,
  textActive = 'ברשימת המשאלות',
  textInactive = 'הוסף לרשימת משאלות',
}: WishlistButtonProps) {
  const wishlist = useWishlistOptional();
  const [isAnimating, setIsAnimating] = useState(false);

  // If no wishlist context, don't render
  if (!wishlist) {
    return null;
  }

  const isActive = wishlist.isInWishlist(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAnimating(true);
    await wishlist.toggle(productId, variantId);
    
    // Reset animation after a short delay
    setTimeout(() => setIsAnimating(false), 300);
  };

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={wishlist.isLoading}
      aria-label={isActive ? textActive : textInactive}
      className={cn(
        'flex items-center justify-center rounded-full transition-all duration-200',
        'hover:scale-110 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500',
        isActive 
          ? 'bg-red-50 text-red-500' 
          : 'bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-red-50',
        sizeClasses[size],
        isAnimating && 'animate-pulse',
        wishlist.isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <svg
        className={cn(
          iconSizes[size],
          'transition-transform duration-200',
          isAnimating && 'scale-125'
        )}
        fill={isActive ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={isActive ? 0 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {showText && (
        <span className="mr-2 text-sm">
          {isActive ? textActive : textInactive}
        </span>
      )}
    </button>
  );
}

// Wishlist icon for header (shows count)
export function WishlistIcon({ className }: { className?: string }) {
  const wishlist = useWishlistOptional();

  // If no wishlist context, show empty state
  const count = wishlist?.count ?? 0;

  return (
    <div className={cn('relative', className)}>
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  );
}

