'use client';

import { useStoreOptional } from '@/lib/store-context';
import { useState } from 'react';

interface AddToCartButtonProps {
  productId: string;
  name: string;
  price: number;
  image: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function AddToCartButton({ 
  productId, 
  name, 
  price, 
  image, 
  variant = 'primary',
  className = '' 
}: AddToCartButtonProps) {
  const store = useStoreOptional();
  const [added, setAdded] = useState(false);

  // If store context not available, render disabled button
  if (!store) {
    const baseStyles = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
    return (
      <button disabled className={`${baseStyles} opacity-50 cursor-not-allowed ${className}`}>
        הוסף לעגלה
      </button>
    );
  }

  const { addToCart } = store;

  const handleClick = () => {
    addToCart({ productId, name, price, image });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const baseStyles = variant === 'primary' ? 'btn-primary' : 'btn-secondary';

  return (
    <button
      onClick={handleClick}
      disabled={added}
      className={`
        ${baseStyles}
        ${added ? '!bg-black !text-white !border-black' : ''}
        disabled:cursor-not-allowed
        ${className}
      `}
    >
      {added ? 'נוסף לעגלה ✓' : 'הוסף לעגלה'}
    </button>
  );
}
