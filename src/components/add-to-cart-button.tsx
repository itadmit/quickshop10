'use client';

import { useStoreOptional } from '@/lib/store-context';
import { useState } from 'react';
import { tracker } from '@/lib/tracking';
import { isOutOfStock } from '@/lib/inventory';

// Re-export for backwards compatibility
export { isOutOfStock } from '@/lib/inventory';

interface AddToCartButtonProps {
  productId: string;
  name: string;
  price: number;
  image: string;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  category?: string; // לטראקינג
  sku?: string; // מק"ט מוצר
  // Stock props
  inventory?: number | null;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  // הנחה אוטומטית
  automaticDiscountName?: string;
  // מחיר מוזל לתצוגה בעגלה (החישוב האמיתי בצ'קאאוט)
  discountedPrice?: number;
  // קטגוריות המוצר - לחישוב הנחות בצ'קאאוט
  categoryIds?: string[];
  // טקסט מותאם אישית
  buttonText?: string;
  outOfStockText?: string;
  // סגנון
  buttonStyle?: 'filled' | 'outline' | 'minimal';
  fullWidth?: boolean;
  // Bundle support
  isBundle?: boolean;
  bundleComponents?: Array<{
    name: string;
    variantTitle?: string;
    quantity: number;
  }>;
}

export function AddToCartButton({ 
  productId, 
  name, 
  price, 
  image, 
  variant = 'primary',
  className = '',
  category,
  sku,
  inventory,
  trackInventory = true,
  allowBackorder = false,
  automaticDiscountName,
  discountedPrice,
  categoryIds,
  buttonText = 'הוסף לעגלה',
  outOfStockText = 'אזל מהמלאי',
  buttonStyle = 'filled',
  fullWidth = true,
  isBundle = false,
  bundleComponents,
}: AddToCartButtonProps) {
  const store = useStoreOptional();
  const [added, setAdded] = useState(false);
  
  const outOfStock = isOutOfStock(trackInventory, inventory, allowBackorder);

  // If store context not available, render disabled button
  if (!store) {
    const baseStyles = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
    return (
      <button disabled className={`${baseStyles} opacity-50 cursor-not-allowed ${className}`}>
        {outOfStock ? outOfStockText : buttonText}
      </button>
    );
  }

  const { addToCart } = store;

  const handleClick = () => {
    if (outOfStock) return;
    
    // מעבירים maxQuantity ו-trackInventory לבדיקה מקומית מהירה בסל ⚡
    // 🔑 categoryIds לחישוב הנחות בצ'קאאוט, discountedPrice לתצוגה בעגלה
    addToCart({ 
      productId, 
      name, 
      price, 
      image,
      sku,
      maxQuantity: trackInventory ? inventory : null,
      trackInventory,
      automaticDiscountName,
      discountedPrice,
      categoryIds,
      isBundle,
      bundleComponents,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    
    // Track AddToCart event
    tracker.addToCart({
      id: productId,
      name,
      price,
      quantity: 1,
      category,
      image,
    });
  };

  // Different styles based on buttonStyle prop (for product page editor)
  const getButtonStyleClasses = () => {
    const widthClass = fullWidth ? 'w-full' : '';
    const baseClasses = 'py-3 px-6 text-sm font-medium transition-all duration-200';
    
    if (buttonStyle === 'outline') {
      return `
        ${baseClasses} ${widthClass} border
        ${added 
          ? 'bg-black text-white border-black' 
          : outOfStock 
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
            : 'bg-white text-black border-black hover:bg-black hover:text-white'
        }
      `;
    }
    
    if (buttonStyle === 'minimal') {
      return `
        ${baseClasses} ${widthClass}
        ${added 
          ? 'bg-gray-200 text-black' 
          : outOfStock 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-black underline hover:no-underline'
        }
      `;
    }
    
    // filled (default)
    return `
      ${baseClasses} ${widthClass}
      ${added 
        ? 'bg-gray-800 text-white' 
        : outOfStock 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
          : 'bg-black text-white hover:bg-gray-800'
      }
    `;
  };

  // Legacy variant-based styles (for backwards compatibility)
  const getVariantClasses = () => {
    if (variant === 'outline') {
      return `
        py-2.5 px-4 text-sm font-medium transition-all duration-200 border rounded-none
        ${added 
          ? 'bg-black text-white border-black' 
          : outOfStock 
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
            : 'bg-white text-black border-black hover:bg-black hover:text-white hover:scale-[1.02] active:scale-[0.98]'
        }
      `;
    }
    return variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  };

  // Use buttonStyle-based classes if buttonStyle is explicitly set, otherwise use variant
  const useButtonStyleClasses = buttonStyle !== undefined;

  return (
    <button
      onClick={handleClick}
      disabled={added || outOfStock}
      data-add-to-cart-button
      data-out-of-stock={outOfStock ? 'true' : 'false'}
      data-button-style={buttonStyle}
      data-full-width={fullWidth ? 'true' : 'false'}
      className={`
        ${useButtonStyleClasses ? getButtonStyleClasses() : getVariantClasses()}
        ${!useButtonStyleClasses && variant !== 'outline' && added ? '!bg-black !text-white !border-black' : ''}
        ${!useButtonStyleClasses && variant !== 'outline' && outOfStock ? '!bg-gray-100 !text-gray-400 !border-gray-200 cursor-not-allowed' : ''}
        disabled:cursor-not-allowed
        ${className}
      `}
    >
      {added ? 'נוסף לעגלה ✓' : outOfStock ? outOfStockText : buttonText}
    </button>
  );
}
