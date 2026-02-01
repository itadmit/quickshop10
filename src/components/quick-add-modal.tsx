'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStoreOptional } from '@/lib/store-context';
import { tracker } from '@/lib/tracking';
import { X, ShoppingBag, Check } from 'lucide-react';
import { useTranslations } from '@/lib/translations/use-translations';

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
      relative flex items-center justify-center transition-all duration-200
      ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      ${isSelected ? 'ring-2 ring-black ring-offset-1' : 'hover:ring-1 hover:ring-gray-300'}
    `;
    
    // Color type
    if (option.displayType === 'color' && metadata?.color) {
      // בדיקה אם הערך הוא קוד צבע - אם כן, נציג את שם האופציה כ-tooltip
      const isColorCode = /^(rgb|rgba|hsl|hsla)\(|^#[0-9a-f]{3,8}$/i.test(val.value);
      const colorTooltip = isColorCode ? option.name : val.value;
      return (
        <button
          key={val.id}
          onClick={() => !isOutOfStock && handleOptionChange(optionIndex, val.value)}
          className={`${baseClasses} w-8 h-8 rounded-full border border-gray-200`}
          style={{ backgroundColor: metadata.color }}
          title={colorTooltip}
          aria-label={colorTooltip}
          disabled={isOutOfStock}
        >
          {isSelected && (
            <Check className="w-4 h-4 text-white drop-shadow-md" />
          )}
        </button>
      );
    }
    
    // Pattern type
    if (option.displayType === 'pattern' && metadata?.pattern) {
      return (
        <button
          key={val.id}
          onClick={() => !isOutOfStock && handleOptionChange(optionIndex, val.value)}
          className={`${baseClasses} w-8 h-8 rounded-full border border-gray-200`}
          style={getPatternStyle(metadata.pattern, metadata.color)}
          title={val.value}
          disabled={isOutOfStock}
        >
          {isSelected && (
            <Check className="w-4 h-4 text-gray-800" />
          )}
        </button>
      );
    }
    
    // Default button type
    return (
      <button
        key={val.id}
        onClick={() => !isOutOfStock && handleOptionChange(optionIndex, val.value)}
        className={`
          ${baseClasses}
          px-3 py-1.5 text-xs border
          ${isSelected 
            ? 'bg-black text-white border-black' 
            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
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

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-auto"
        dir="rtl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">בחרו אפשרויות</h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Product Info */}
          <div className="flex gap-4 mb-6">
            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={productImage || '/placeholder.svg'} 
                alt={productName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 line-clamp-2">{productName}</h4>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                ₪{currentPrice.toFixed(2)}
              </p>
              {selectedVariant && (
                <p className="text-xs text-gray-500 mt-0.5">{selectedVariant.title}</p>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Options */}
          {!isLoading && !error && options.map((option, optionIndex) => (
            <div key={option.id} className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {option.name}
              </label>
              <div className="flex flex-wrap gap-2">
                {option.values.map((val) => renderOptionValue(option, val, optionIndex))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer - Add to Cart Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || isOutOfStock || added || !store}
            className={`
              w-full py-3 px-4 font-medium text-sm flex items-center justify-center gap-2 transition-all
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
                <Check className="w-4 h-4" />
                {t.product.addedToCart}
              </>
            ) : isOutOfStock ? (
              t.product.outOfStock
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                {t.product.addToCart}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

