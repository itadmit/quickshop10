'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store-context';
import { ProductWaitlistForm } from './product-waitlist-form';

interface OptionValueMetadata {
  color?: string;      // for color type
  pattern?: string;    // for pattern type (dots, stripes, etc.)
  imageUrl?: string;   // for image type
  images?: string[];   // gallery images for this value
}

interface OptionValue {
  id: string;
  value: string;
  metadata?: OptionValueMetadata | unknown;
}

interface Option {
  id: string;
  name: string;
  displayType?: 'button' | 'color' | 'pattern' | 'image';
  values: OptionValue[];
}

interface Variant {
  id: string;
  title: string;
  price: string;
  comparePrice: string | null;
  inventory: number | null;
  sku: string | null; // מק"ט וריאנט
  option1: string | null;
  option2: string | null;
  option3: string | null;
}

// פרטי הנחה אוטומטית
interface AutomaticDiscount {
  type: 'percentage' | 'fixed_amount';
  value: number;
  name: string;
}

interface VariantSelectorProps {
  productId: string;
  productName: string;
  productImage: string;
  options: Option[];
  variants: Variant[];
  basePrice: number;
  baseComparePrice: number | null;
  // הנחה אוטומטית (מחושב בשרת)
  automaticDiscountName?: string;
  // 🆕 פרטי ההנחות - לחישוב מדויק לכל וריאנט
  automaticDiscounts?: AutomaticDiscount[];
  // קטגוריות המוצר - לחישוב הנחות בצ'קאאוט
  categoryIds?: string[];
  // Callback when option changes (for gallery switching)
  onOptionChange?: (optionName: string, value: string, valueMetadata?: OptionValue['metadata']) => void;
  // Store slug for waitlist
  storeSlug: string;
  // טקסט מותאם אישית לכפתור
  buttonText?: string;
  outOfStockText?: string;
}

export function VariantSelector({
  productId,
  productName,
  productImage,
  options,
  variants,
  basePrice,
  baseComparePrice,
  automaticDiscountName,
  automaticDiscounts = [],
  categoryIds,
  onOptionChange,
  storeSlug,
  buttonText = 'הוסף לעגלה',
  outOfStockText = 'אזל מהמלאי',
}: VariantSelectorProps) {
  const { addToCart, formatPrice } = useStore();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [added, setAdded] = useState(false);

  // 🆕 חישוב מחיר מוזל לפי פרטי ההנחות (לא לפי אחוז כולל!)
  const calculateDiscountedPrice = useCallback((price: number): number => {
    if (automaticDiscounts.length === 0) return price;
    
    let discountedPrice = price;
    for (const discount of automaticDiscounts) {
      if (discount.type === 'percentage') {
        discountedPrice = discountedPrice * (1 - discount.value / 100);
      } else if (discount.type === 'fixed_amount') {
        discountedPrice = Math.max(0, discountedPrice - discount.value);
      }
    }
    return Math.round(discountedPrice * 100) / 100;
  }, [automaticDiscounts]);

  // Initialize with first available values
  useEffect(() => {
    const initial: Record<string, string> = {};
    options.forEach((opt, i) => {
      if (opt.values.length > 0) {
        initial[`option${i + 1}`] = opt.values[0].value;
        // Notify parent of initial selection
        if (onOptionChange) {
          onOptionChange(opt.name, opt.values[0].value, opt.values[0].metadata);
        }
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

  const handleOptionChange = (optionIndex: number, value: string, option: Option) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [`option${optionIndex + 1}`]: value,
    }));
    
    // Notify parent for gallery switching
    if (onOptionChange) {
      const selectedVal = option.values.find(v => v.value === value);
      onOptionChange(option.name, value, selectedVal?.metadata);
    }
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    
    const variantTitle = selectedVariant.title;
    // מעבירים maxQuantity לבדיקה מקומית מהירה בסל ⚡
    const hasInventoryTracking = selectedVariant.inventory !== null;
    // 🆕 חישוב מחיר מוזל לוריאנט (לפי פרטי ההנחות, לא אחוז!)
    const variantPrice = Number(selectedVariant.price);
    const calculatedDiscountedPrice = calculateDiscountedPrice(variantPrice);
    const variantDiscountedPrice = calculatedDiscountedPrice < variantPrice 
      ? calculatedDiscountedPrice 
      : undefined;
    
    addToCart({
      productId,
      variantId: selectedVariant.id,
      name: productName,
      price: variantPrice,
      image: productImage,
      variantTitle,
      sku: selectedVariant.sku || undefined,
      maxQuantity: hasInventoryTracking ? selectedVariant.inventory : null,
      trackInventory: hasInventoryTracking,
      automaticDiscountName,
      discountedPrice: variantDiscountedPrice,
      categoryIds,
    });
    
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Use variant price if available, otherwise fall back to basePrice
  const currentPrice = selectedVariant ? Number(selectedVariant.price) : (basePrice || 0);
  const currentComparePrice = selectedVariant?.comparePrice 
    ? Number(selectedVariant.comparePrice) 
    : baseComparePrice;
  
  // 🆕 חישוב מחיר מוזל לפי פרטי ההנחות (לא אחוז כולל!)
  const calculatedPrice = calculateDiscountedPrice(currentPrice);
  const automaticDiscountedPrice = calculatedPrice < currentPrice ? calculatedPrice : null;
  
  // Has any discount (compare price or automatic)
  const hasCompareDiscount = currentComparePrice && currentComparePrice > currentPrice;
  const hasAutomaticDiscount = automaticDiscountedPrice !== null && automaticDiscountedPrice < currentPrice;
  const hasAnyDiscount = hasCompareDiscount || hasAutomaticDiscount;
  
  // Calculate final display price
  const displayPrice = hasAutomaticDiscount ? automaticDiscountedPrice : currentPrice;
  const originalPrice = hasCompareDiscount ? currentComparePrice : currentPrice;
  
  // Calculate total discount percentage
  const totalDiscountPercent = hasAnyDiscount && originalPrice > 0
    ? Math.round((1 - displayPrice / originalPrice) * 100)
    : null;
  
  const inventory = selectedVariant?.inventory ?? null;
  const isOutOfStock = inventory !== null && inventory !== undefined && inventory <= 0;

  // Pattern background generator
  const getPatternStyle = (pattern?: string, color?: string): React.CSSProperties => {
    if (!pattern || !color) return {};
    switch (pattern) {
      case 'dots':
        return { background: `radial-gradient(circle, ${color} 20%, transparent 20%) 0 0 / 6px 6px` };
      case 'stripes':
        return { background: `repeating-linear-gradient(45deg, ${color}, ${color} 1px, transparent 1px, transparent 4px)` };
      case 'squares':
        return { background: `linear-gradient(to right, ${color} 50%, transparent 50%) 0 0 / 6px 6px, linear-gradient(to bottom, ${color} 50%, transparent 50%) 0 0 / 6px 6px` };
      case 'zigzag':
        return { background: `linear-gradient(135deg, ${color} 25%, transparent 25%) -3px 0 / 6px 6px, linear-gradient(225deg, ${color} 25%, transparent 25%) -3px 0 / 6px 6px` };
      case 'diagonal':
        return { background: `repeating-linear-gradient(45deg, ${color} 0px, ${color} 2px, transparent 2px, transparent 5px)` };
      default:
        return {};
    }
  };

  return (
    <div className="space-y-6">
      {/* Price */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Final price */}
        <span className={`text-2xl font-display ${hasAutomaticDiscount ? 'text-green-600' : ''}`}>
          {formatPrice(displayPrice)}
        </span>
        
        {/* Original price (crossed out) */}
        {hasAnyDiscount && originalPrice > displayPrice && (
          <span className="text-lg text-gray-400 line-through">
            {formatPrice(originalPrice)}
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

              const displayType = option.displayType || 'button';
              // Cast metadata to proper type
              const meta = val.metadata as OptionValueMetadata | undefined;

              // Render based on displayType
              if (displayType === 'color' && meta?.color) {
                return (
                  <button
                    key={val.id}
                    onClick={() => handleOptionChange(optIndex, val.value, option)}
                    disabled={!isAvailable}
                    title={val.value}
                    className={`
                      relative w-10 h-10 rounded-full transition-all cursor-pointer
                      ${isSelected 
                        ? 'ring-2 ring-offset-2 ring-black' 
                        : 'hover:ring-2 hover:ring-offset-2 hover:ring-gray-300'
                      }
                      ${!isAvailable ? 'opacity-30 !cursor-not-allowed' : ''}
                    `}
                    style={{ backgroundColor: meta.color }}
                  >
                    {!isAvailable && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-full h-0.5 bg-gray-500 rotate-45 absolute"></span>
                      </span>
                    )}
                  </button>
                );
              }

              if (displayType === 'pattern' && meta?.pattern && meta?.color) {
                return (
                  <button
                    key={val.id}
                    onClick={() => handleOptionChange(optIndex, val.value, option)}
                    disabled={!isAvailable}
                    title={val.value}
                    className={`
                      relative w-10 h-10 rounded border transition-all cursor-pointer
                      ${isSelected 
                        ? 'ring-2 ring-offset-2 ring-black border-black' 
                        : 'border-gray-200 hover:border-black'
                      }
                      ${!isAvailable ? 'opacity-30 !cursor-not-allowed' : ''}
                    `}
                    style={getPatternStyle(meta.pattern, meta.color)}
                  >
                    {!isAvailable && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-full h-0.5 bg-gray-500 rotate-45 absolute"></span>
                      </span>
                    )}
                  </button>
                );
              }

              if (displayType === 'image' && meta?.imageUrl) {
                return (
                  <button
                    key={val.id}
                    onClick={() => handleOptionChange(optIndex, val.value, option)}
                    disabled={!isAvailable}
                    title={val.value}
                    className={`
                      relative w-12 h-12 rounded overflow-hidden transition-all cursor-pointer
                      ${isSelected 
                        ? 'ring-2 ring-offset-2 ring-black' 
                        : 'hover:ring-2 hover:ring-offset-2 hover:ring-gray-300'
                      }
                      ${!isAvailable ? 'opacity-30 !cursor-not-allowed' : ''}
                    `}
                  >
                    <img 
                      src={meta.imageUrl} 
                      alt={val.value}
                      className="w-full h-full object-cover"
                    />
                    {!isAvailable && (
                      <span className="absolute inset-0 flex items-center justify-center bg-white/50">
                        <span className="w-full h-0.5 bg-gray-500 rotate-45 absolute"></span>
                      </span>
                    )}
                  </button>
                );
              }

              // Default: button display
              return (
                <button
                  key={val.id}
                  onClick={() => handleOptionChange(optIndex, val.value, option)}
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

      {/* Add to Cart or Waitlist */}
      {isOutOfStock ? (
        <div className="mt-4">
          <ProductWaitlistForm
            storeSlug={storeSlug}
            productId={productId}
            variantId={selectedVariant?.id}
            variantTitle={selectedVariant?.title}
          />
        </div>
      ) : (
        <button
          onClick={handleAddToCart}
          disabled={!selectedVariant || added}
          className={`
            btn-primary w-full
            ${added ? '!bg-black !text-white' : ''}
            disabled:cursor-not-allowed
          `}
        >
          {added ? 'נוסף לעגלה ✓' : buttonText}
        </button>
      )}

      {/* Stock Status */}
      {selectedVariant && inventory !== null && inventory !== undefined && inventory > 0 && (
        <p className="text-sm text-gray-500 text-center">
          {inventory} יחידות במלאי
        </p>
      )}
    </div>
  );
}
