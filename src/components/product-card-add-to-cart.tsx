'use client';

import { useState } from 'react';
import { useStoreOptional } from '@/lib/store-context';
import { isOutOfStock } from '@/lib/inventory';
import { tracker } from '@/lib/tracking';
import { QuickAddModal } from './quick-add-modal';
import { useTranslations } from '@/lib/translations/use-translations';

// ============================================
// Product Card Add to Cart Button
// Handles both simple products and products with variants
// ============================================

interface ProductCardAddToCartProps {
  productId: string;
  name: string;
  price: number;
  image: string;
  // Stock props
  inventory?: number | null;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  // הנחה אוטומטית
  automaticDiscountName?: string;
  categoryIds?: string[];
  // Variant support
  hasVariants?: boolean;
  storeSlug: string;
  // Display mode
  showAlways?: boolean; // true = visible always, false = hover only
  positionBelow?: boolean; // true = render below card (not absolute), false = overlay on image
  buttonStyle?: 'outline' | 'filled'; // סגנון הכפתור
  className?: string;
}

export function ProductCardAddToCart({
  productId,
  name,
  price,
  image,
  inventory,
  trackInventory = true,
  allowBackorder = false,
  automaticDiscountName,
  categoryIds,
  hasVariants = false,
  storeSlug,
  showAlways = false,
  positionBelow = false,
  buttonStyle = 'outline',
  className = '',
}: ProductCardAddToCartProps) {
  const store = useStoreOptional();
  const [added, setAdded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslations();
  
  // Use translations from context (defaults to Hebrew if no Provider)
  const addToCartText = t.product.addToCart;
  const outOfStockText = t.product.outOfStock;
  const addedText = t.product.addedToCart;
  const selectOptionsText = t.product.selectOptions || 'בחר אפשרויות';
  
  const outOfStock = isOutOfStock(trackInventory, inventory, allowBackorder);

  // If store context not available, render disabled button
  if (!store) {
    return (
      <>
        <button 
          disabled 
          className={`btn-primary opacity-50 cursor-not-allowed ${className}`}
        >
          {outOfStock ? outOfStockText : addToCartText}
        </button>
      </>
    );
  }

  const { addToCart } = store;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (outOfStock) return;
    
    // If product has variants, open modal
    if (hasVariants) {
      setIsModalOpen(true);
      return;
    }
    
    // Simple product - add directly
    addToCart({ 
      productId, 
      name, 
      price, 
      image,
      maxQuantity: trackInventory ? inventory : null,
      trackInventory,
      automaticDiscountName,
      categoryIds,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    
    // Track AddToCart event
    tracker.addToCart({
      id: productId,
      name,
      price,
      quantity: 1,
      image,
    });
  };

  // Container classes based on position mode
  // 🔧 pointer-events-none on mobile prevents accidental clicks on hidden button
  // z-20 ensures hover button is above overlay content (z-10)
  const containerClasses = positionBelow
    ? '' // Below card - no absolute positioning
    : showAlways
      ? 'absolute bottom-0 left-0 right-0 p-4 z-20' // Always visible on image
      : 'absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none md:pointer-events-auto z-20'; // Hover only - disabled on mobile

  return (
    <>
      <div className={containerClasses}>
        <button
          onClick={handleClick}
          disabled={added || outOfStock}
          className={`
            w-full py-2.5 px-4 text-sm font-medium transition-all duration-200
            border rounded-none
            ${added 
              ? 'bg-black text-white border-black' 
              : outOfStock 
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                : buttonStyle === 'filled'
                  ? 'bg-black text-white border-black hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-white text-black border-black hover:bg-black hover:text-white hover:scale-[1.02] active:scale-[0.98]'
            }
            disabled:cursor-not-allowed
            ${className}
          `}
        >
          {added ? addedText : outOfStock ? outOfStockText : hasVariants ? selectOptionsText : addToCartText}
        </button>
      </div>
      
      {/* Quick Add Modal for products with variants */}
      {hasVariants && (
        <QuickAddModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          productId={productId}
          productName={name}
          productImage={image}
          productPrice={price}
          storeSlug={storeSlug}
          automaticDiscountName={automaticDiscountName}
          categoryIds={categoryIds}
        />
      )}
    </>
  );
}

