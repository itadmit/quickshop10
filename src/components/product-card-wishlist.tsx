'use client';

import { useState, useEffect } from 'react';
import { useWishlistOptional } from './wishlist-provider';

interface ProductCardWishlistProps {
  productId: string;
  variantId?: string | null;
}

export function ProductCardWishlist({ productId, variantId }: ProductCardWishlistProps) {
  const wishlist = useWishlistOptional();
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fix hydration mismatch - only check wishlist after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // If no wishlist context, don't render
  if (!wishlist) {
    return null;
  }

  // Before mount, always show inactive state to match server render
  const isActive = mounted ? wishlist.isInWishlist(productId) : false;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAnimating(true);
    await wishlist.toggle(productId, variantId);
    
    // Reset animation after a short delay
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={wishlist.isLoading}
      aria-label={isActive ? 'הסר מרשימת המשאלות' : 'הוסף לרשימת המשאלות'}
      className={`
        w-8 h-8 rounded-full flex items-center justify-center
        transition-all duration-200 
        ${isActive 
          ? 'bg-red-500 text-white shadow-md' 
          : 'bg-white/90 text-gray-500 hover:text-red-500 hover:bg-white shadow-sm'
        }
        ${isAnimating ? 'scale-125' : 'scale-100'}
        ${wishlist.isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <svg
        className="w-4 h-4"
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
    </button>
  );
}

