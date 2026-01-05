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
  variant?: 'primary' | 'secondary';
  className?: string;
  category?: string;
  // Stock props
  inventory?: number | null;
  trackInventory?: boolean;
  allowBackorder?: boolean;
}

export function AddToCartButton({ 
  productId, 
  name, 
  price, 
  image, 
  variant = 'primary',
  className = '',
  category,
  inventory,
  trackInventory = true,
  allowBackorder = false,
}: AddToCartButtonProps) {
  const store = useStoreOptional();
  const [added, setAdded] = useState(false);
  
  const outOfStock = isOutOfStock(trackInventory, inventory, allowBackorder);

  // If store context not available, render disabled button
  if (!store) {
    const baseStyles = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
    return (
      <button disabled className={`${baseStyles} opacity-50 cursor-not-allowed ${className}`}>
        {outOfStock ? 'אזל מהמלאי' : 'הוסף לעגלה'}
      </button>
    );
  }

  const { addToCart } = store;

  const handleClick = () => {
    if (outOfStock) return;
    
    addToCart({ productId, name, price, image });
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

  const baseStyles = variant === 'primary' ? 'btn-primary' : 'btn-secondary';

  return (
    <button
      onClick={handleClick}
      disabled={added || outOfStock}
      className={`
        ${baseStyles}
        ${added ? '!bg-black !text-white !border-black' : ''}
        ${outOfStock ? '!bg-gray-100 !text-gray-400 !border-gray-200 cursor-not-allowed' : ''}
        disabled:cursor-not-allowed
        ${className}
      `}
    >
      {added ? 'נוסף לעגלה ✓' : outOfStock ? 'אזל מהמלאי' : 'הוסף לעגלה'}
    </button>
  );
}
