'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStoreOptional } from '@/lib/store-context';
import { tracker } from '@/lib/tracking';
import { X, ShoppingBag, Check } from 'lucide-react';
import { useTranslations } from '@/lib/translations/use-translations';

// Global event to close all other modals
const CLOSE_OTHER_MODALS_EVENT = 'quickAddModal:closeOthers';

// ============================================
// Quick Add Modal - לבחירת וריאנט מהכרטיס
// Server Component friendly - loads data on demand
// ============================================

interface OptionValueMetadata {
  color?: string;
  pattern?: string;
  imageUrl?: string;
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
  sku: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
}

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  storeSlug: string;
  // הנחה אוטומטית
  automaticDiscountName?: string;
  categoryIds?: string[];
}

export function QuickAddModal({
  isOpen,
  onClose,
  productId,
  productName,
  productImage,
  productPrice,
  storeSlug,
  automaticDiscountName,
  categoryIds,
}: QuickAddModalProps) {
  const store = useStoreOptional();
  const { t } = useTranslations();
  const [options, setOptions] = useState<Option[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalId = useRef(`modal-${productId}-${Date.now()}`);

  // Close this modal when another one opens
  useEffect(() => {
    const handleCloseOthers = (e: CustomEvent) => {
      if (e.detail !== modalId.current && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener(CLOSE_OTHER_MODALS_EVENT, handleCloseOthers as EventListener);
    return () => window.removeEventListener(CLOSE_OTHER_MODALS_EVENT, handleCloseOthers as EventListener);
  }, [isOpen, onClose]);

  // When this modal opens, close all others
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent(CLOSE_OTHER_MODALS_EVENT, { detail: modalId.current }));
    }
  }, [isOpen]);

  // Fetch product variants when modal opens
  useEffect(() => {
    if (!isOpen || !productId) return;
    
    setIsLoading(true);
    setError(null);
    
    fetch(`/api/shops/${storeSlug}/products/${productId}/variants`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch variants');
        return res.json();
      })
      .then(data => {
        setOptions(data.options || []);
        setVariants(data.variants || []);
        
        // Initialize with first values
        const initial: Record<string, string> = {};
        (data.options || []).forEach((opt: Option, i: number) => {
          if (opt.values.length > 0) {
            initial[`option${i + 1}`] = opt.values[0].value;
          }
        });
        setSelectedOptions(initial);
      })
      .catch(err => {
        console.error('Error fetching variants:', err);
        setError('שגיאה בטעינת האפשרויות');
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, productId, storeSlug]);

  // Find matching variant when options change
  useEffect(() => {
    if (variants.length === 0) return;
    
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
    if (!store || !selectedVariant) return;
    
    const variantPrice = Number(selectedVariant.price);
    const hasInventoryTracking = selectedVariant.inventory !== null;
    
    store.addToCart({
      productId,
      variantId: selectedVariant.id,
      name: productName,
      price: variantPrice,
      image: productImage,
      variantTitle: selectedVariant.title,
      sku: selectedVariant.sku || undefined,
      maxQuantity: hasInventoryTracking ? selectedVariant.inventory : null,
      trackInventory: hasInventoryTracking,
      automaticDiscountName,
      categoryIds,
    });
    
    // Track AddToCart event
    tracker.addToCart({
      id: productId,
      name: productName,
      price: variantPrice,
      quantity: 1,
      variant: selectedVariant.title,
      image: productImage,
    });
    
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1500);
  };

  // Pattern background generator
  const getPatternStyle = (pattern?: string, color?: string): React.CSSProperties => {
    const patternColor = color || '#000';
    switch (pattern) {
      case 'dots':
        return {
          background: `radial-gradient(circle, ${patternColor} 2px, transparent 2px)`,
          backgroundSize: '8px 8px',
        };
      case 'stripes':
        return {
          background: `repeating-linear-gradient(45deg, ${patternColor}, ${patternColor} 2px, transparent 2px, transparent 6px)`,
        };
      case 'squares':
        return {
          background: `repeating-linear-gradient(0deg, ${patternColor}, ${patternColor} 4px, transparent 4px, transparent 8px), repeating-linear-gradient(90deg, ${patternColor}, ${patternColor} 4px, transparent 4px, transparent 8px)`,
        };
      default:
        return {};
    }
  };

  // Render option value based on display type
  const renderOptionValue = (option: Option, val: OptionValue, optionIndex: number) => {
    const isSelected = selectedOptions[`option${optionIndex + 1}`] === val.value;
    const metadata = val.metadata as OptionValueMetadata | undefined;
    
    // Check if this variant is out of stock
    const matchingVariant = variants.find(v => {
      const optionKey = `option${optionIndex + 1}` as 'option1' | 'option2' | 'option3';
      return v[optionKey] === val.value;
    });
    const isOutOfStock = matchingVariant?.inventory !== null && 
                         matchingVariant?.inventory !== undefined && 
                         matchingVariant.inventory <= 0;
    
    const baseClasses = `
      relative flex items-center justify-center transition-all duration-150
      ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      ${isSelected ? 'ring-2 ring-black ring-offset-1' : 'hover:ring-1 hover:ring-gray-300'}
    `;
    
    // Color type - compact size
    if (option.displayType === 'color' && metadata?.color) {
      return (
        <button
          key={val.id}
          onClick={() => !isOutOfStock && handleOptionChange(optionIndex, val.value)}
          className={`${baseClasses} w-7 h-7 rounded-full border border-gray-200`}
          style={{ backgroundColor: metadata.color }}
          aria-label={val.value}
          title={val.value}
          disabled={isOutOfStock}
        >
          {isSelected && (
            <Check className="w-3 h-3 text-white drop-shadow-md" />
          )}
        </button>
      );
    }
    
    // Pattern type - compact size
    if (option.displayType === 'pattern' && metadata?.pattern) {
      return (
        <button
          key={val.id}
          onClick={() => !isOutOfStock && handleOptionChange(optionIndex, val.value)}
          className={`${baseClasses} w-7 h-7 rounded-full border border-gray-200`}
          style={getPatternStyle(metadata.pattern, metadata.color)}
          title={val.value}
          disabled={isOutOfStock}
        >
          {isSelected && (
            <Check className="w-3 h-3 text-gray-800" />
          )}
        </button>
      );
    }
    
    // Default button type - square, compact
    return (
      <button
        key={val.id}
        onClick={() => !isOutOfStock && handleOptionChange(optionIndex, val.value)}
        className={`
          ${baseClasses}
          min-w-[32px] h-8 px-2 text-[11px] border
          ${isSelected 
            ? 'bg-black text-white border-black' 
            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
          }
          ${isOutOfStock ? 'line-through' : ''}
        `}
        disabled={isOutOfStock}
      >
        {val.value}
      </button>
    );
  };

  const currentPrice = selectedVariant ? Number(selectedVariant.price) : productPrice;
  const isOutOfStock = selectedVariant?.inventory !== null && 
                       selectedVariant?.inventory !== undefined && 
                       selectedVariant.inventory <= 0;

  if (!isOpen) return null;

  // Prevent clicks from navigating to product page
  const handleContainerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div 
      className="absolute bottom-0 left-0 right-0 z-30 animate-in slide-in-from-bottom-4 duration-200 p-2"
      dir="rtl"
      onClick={handleContainerClick}
      onMouseDown={handleContainerClick}
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3 relative">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-1.5 left-1.5 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-3">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-2 text-red-500 text-xs">
            {error}
          </div>
        )}

        {/* Options - Horizontal scroll, RTL */}
        {!isLoading && !error && (
          <div className="space-y-2">
            {options.map((option, optionIndex) => (
              <div key={option.id} className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-gray-500 flex-shrink-0">
                  {option.name}
                </span>
                <div className="flex-1 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-1 justify-end">
                    {option.values.map((val) => renderOptionValue(option, val, optionIndex))}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add to Cart Button - inline */}
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || isOutOfStock || added || !store}
              className={`
                w-full py-2 px-3 font-medium text-xs flex items-center justify-center gap-1.5 transition-all mt-2
                ${added 
                  ? 'bg-green-500 text-white' 
                  : isOutOfStock
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800'
                }
                disabled:cursor-not-allowed
              `}
            >
              {added ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {t.product.addedToCart}
                </>
              ) : isOutOfStock ? (
                t.product.outOfStock
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {t.product.addToCart}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

