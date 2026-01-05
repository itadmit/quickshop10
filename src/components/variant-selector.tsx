'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store-context';

interface Option {
  id: string;
  name: string;
  values: { id: string; value: string }[];
}

interface Variant {
  id: string;
  title: string;
  price: string;
  comparePrice: string | null;
  inventory: number | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
}

interface VariantSelectorProps {
  productId: string;
  productName: string;
  productImage: string;
  options: Option[];
  variants: Variant[];
  basePrice: number;
  baseComparePrice: number | null;
}

export function VariantSelector({
  productId,
  productName,
  productImage,
  options,
  variants,
  basePrice,
  baseComparePrice,
}: VariantSelectorProps) {
  const { addToCart, formatPrice } = useStore();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [added, setAdded] = useState(false);

  // Initialize with first available values
  useEffect(() => {
    const initial: Record<string, string> = {};
    options.forEach((opt, i) => {
      if (opt.values.length > 0) {
        initial[`option${i + 1}`] = opt.values[0].value;
      }
    });
    setSelectedOptions(initial);
  }, [options]);

  // Find matching variant when options change
  useEffect(() => {
    const variant = variants.find((v) => {
      return (
        (!selectedOptions.option1 || v.option1 === selectedOptions.option1) &&
        (!selectedOptions.option2 || v.option2 === selectedOptions.option2) &&
        (!selectedOptions.option3 || v.option3 === selectedOptions.option3)
      );
    });
    setSelectedVariant(variant || null);
  }, [selectedOptions, variants]);

  const handleOptionChange = (optionIndex: number, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [`option${optionIndex + 1}`]: value,
    }));
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    
    const variantTitle = selectedVariant.title;
    addToCart({
      productId,
      variantId: selectedVariant.id,
      name: productName,
      price: Number(selectedVariant.price),
      image: productImage,
      variantTitle,
    });
    
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const currentPrice = selectedVariant ? Number(selectedVariant.price) : basePrice;
  const currentComparePrice = selectedVariant?.comparePrice 
    ? Number(selectedVariant.comparePrice) 
    : baseComparePrice;
  const hasDiscount = currentComparePrice && currentComparePrice > currentPrice;
  const inventory = selectedVariant?.inventory ?? null;
  const isOutOfStock = inventory !== null && inventory !== undefined && inventory <= 0;

  return (
    <div className="space-y-6">
      {/* Price */}
      <div className="flex items-center gap-4">
        <span className="text-2xl font-display">{formatPrice(currentPrice)}</span>
        {hasDiscount && (
          <span className="text-lg text-gray-400 line-through">
            {formatPrice(currentComparePrice)}
          </span>
        )}
      </div>

      {/* Options */}
      {options.map((option, optIndex) => (
        <div key={option.id}>
          <label className="text-[11px] tracking-[0.2em] uppercase text-black mb-3 block">
            {option.name}
          </label>
          <div className="flex flex-wrap gap-2">
            {option.values.map((val) => {
              const isSelected = selectedOptions[`option${optIndex + 1}`] === val.value;
              // Check if this option value is available in any variant
              const isAvailable = variants.some((v) => {
                const optionKey = `option${optIndex + 1}` as keyof Variant;
                return v[optionKey] === val.value && (v.inventory === null || v.inventory > 0);
              });

              return (
                <button
                  key={val.id}
                  onClick={() => handleOptionChange(optIndex, val.value)}
                  disabled={!isAvailable}
                  className={`
                    min-w-[48px] px-4 py-3 text-sm border transition-all cursor-pointer
                    ${isSelected 
                      ? 'border-black bg-black text-white' 
                      : 'border-gray-200 hover:border-black'
                    }
                    ${!isAvailable ? 'opacity-30 !cursor-not-allowed line-through' : ''}
                  `}
                >
                  {val.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Add to Cart */}
      <button
        onClick={handleAddToCart}
        disabled={!selectedVariant || isOutOfStock || added}
        className={`
          btn-primary w-full
          ${added ? '!bg-black !text-white' : ''}
          ${isOutOfStock ? '!bg-gray-200 !text-gray-500 !border-gray-200 cursor-not-allowed' : ''}
          disabled:cursor-not-allowed
        `}
      >
        {added 
          ? 'נוסף לעגלה ✓' 
          : isOutOfStock 
            ? 'אזל מהמלאי' 
            : 'הוסף לעגלה'
        }
      </button>

      {/* Stock Status */}
      {selectedVariant && inventory !== null && inventory !== undefined && inventory > 0 && (
        <p className="text-sm text-gray-500 text-center">
          {inventory} יחידות במלאי
        </p>
      )}
    </div>
  );
}

