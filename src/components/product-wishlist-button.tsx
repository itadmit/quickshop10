'use client';

import { useState } from 'react';
import { useWishlistOptional } from './wishlist-provider';

interface ProductWishlistButtonProps {
  productId: string;
  variantId?: string | null;
  className?: string;
  // Style settings
  buttonStyle?: 'filled' | 'outline' | 'minimal';
  fullWidth?: boolean;
  text?: string;
  activeText?: string;
}

export function ProductWishlistButton({ 
  productId, 
  variantId,
  className = '',
  buttonStyle = 'outline',
  fullWidth = true,
  text = 'הוסף לרשימת משאלות',
  activeText = 'ברשימת המשאלות',
}: ProductWishlistButtonProps) {
  const wishlist = useWishlistOptional();
  const [isAnimating, setIsAnimating] = useState(false);

  // If no wishlist context, don't render
  if (!wishlist) {
    return null;
  }

  const isActive = wishlist.isInWishlist(productId);

  const handleClick = async () => {
    setIsAnimating(true);
    await wishlist.toggle(productId, variantId);
    
    // Reset animation after a short delay
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Get button style classes based on buttonStyle prop
  const getStyleClasses = () => {
    const widthClass = fullWidth ? 'w-full' : '';
    const baseClasses = `flex items-center justify-center gap-2 py-3 px-4 transition-all duration-200 ${widthClass}`;
    
    if (buttonStyle === 'filled') {
      return `
        ${baseClasses}
        ${isActive 
          ? 'bg-red-500 text-white hover:bg-red-600' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-red-500'
        }
      `;
    }
    
    if (buttonStyle === 'minimal') {
      return `
        ${baseClasses}
        ${isActive 
          ? 'text-red-600' 
          : 'text-gray-600 hover:text-red-500'
        }
      `;
    }
    
    // outline (default)
    return `
      ${baseClasses} border
      ${isActive 
        ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' 
        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-red-500'
      }
    `;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={wishlist.isLoading}
      data-wishlist-button
      data-button-style={buttonStyle}
      data-full-width={fullWidth ? 'true' : 'false'}
      className={`
        ${getStyleClasses()}
        ${isAnimating ? 'scale-[1.02]' : ''}
        ${wishlist.isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <svg
        className={`w-5 h-5 transition-transform duration-200 ${isAnimating ? 'scale-125' : ''}`}
        fill={isActive ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={isActive ? 0 : 1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span className="text-sm font-medium">
        {isActive ? activeText : text}
      </span>
    </button>
  );
}

