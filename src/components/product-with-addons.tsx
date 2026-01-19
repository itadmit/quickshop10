'use client';

import { useState, useCallback } from 'react';
import { useStoreOptional } from '@/lib/store-context';
import { ProductAddons, type ProductAddon, type SelectedAddon } from './product-addons';
import { ProductWaitlistForm } from './product-waitlist-form';
import { formatPrice } from '@/lib/format-price';

interface ProductWithAddonsProps {
  productId: string;
  productName: string;
  productSlug: string;
  basePrice: number;
  finalPrice: number;
  image: string;
  sku?: string;
  inventory: number | null;
  trackInventory: boolean;
  allowBackorder: boolean;
  addons: ProductAddon[];
  automaticDiscountName?: string;
  discountedPrice?: number;
  categoryIds?: string[];
  className?: string;
  showDecimalPrices?: boolean;
  storeSlug: string; // Add store slug for waitlist
  isBundle?: boolean; // Bundle support
}

export function ProductWithAddons({
  productId,
  productName,
  productSlug,
  basePrice,
  finalPrice,
  image,
  sku,
  inventory,
  trackInventory,
  allowBackorder,
  addons,
  automaticDiscountName,
  discountedPrice,
  categoryIds,
  className = '',
  showDecimalPrices = false,
  storeSlug,
  isBundle = false,
}: ProductWithAddonsProps) {
  const store = useStoreOptional();
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [addonTotal, setAddonTotal] = useState(0);
  const [isValid, setIsValid] = useState(addons.every(a => !a.isRequired));
  const [isPending, setIsPending] = useState(false);

  const handleAddonsChange = useCallback((addons: SelectedAddon[], total: number) => {
    setSelectedAddons(addons);
    setAddonTotal(total);
  }, []);

  const handleValidationChange = useCallback((valid: boolean) => {
    setIsValid(valid);
  }, []);

  // Calculate total price including addons
  const totalPrice = finalPrice + addonTotal;
  const format = (p: number) => formatPrice(p, { showDecimal: showDecimalPrices });

  // Check if out of stock
  const outOfStock = trackInventory && !allowBackorder && (inventory === null || inventory <= 0);

  const handleAddToCart = async () => {
    if (!store || outOfStock || !isValid) return;

    setIsPending(true);

    try {
      store.addToCart({
        productId,
        name: productName,
        image,
        price: basePrice, // Original price (addons are extra)
        sku,
        automaticDiscountNames: automaticDiscountName ? [automaticDiscountName] : undefined,
        discountedPrice: discountedPrice,
        categoryIds,
        isBundle, // Bundle support
        // Store addons info
        addons: selectedAddons.length > 0 ? selectedAddons : undefined,
        addonTotal: addonTotal > 0 ? addonTotal : undefined,
      }, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={className}>
      {/* Addons Section */}
      {addons.length > 0 && (
        <ProductAddons
          addons={addons}
          onChange={handleAddonsChange}
          onValidationChange={handleValidationChange}
        />
      )}

      {/* Price Summary with Addons */}
      {addonTotal > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>מחיר מוצר:</span>
            <span>{format(finalPrice)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
            <span>תוספות:</span>
            <span className="text-green-600">+{format(addonTotal)}</span>
          </div>
          <div className="flex items-center justify-between font-medium text-gray-900 mt-2 pt-2 border-t border-gray-200">
            <span>סה"כ:</span>
            <span className="text-lg">{format(totalPrice)}</span>
          </div>
        </div>
      )}

      {/* Add to Cart Button or Waitlist Form */}
      {outOfStock ? (
        <div className="mt-4">
          <ProductWaitlistForm
            storeSlug={storeSlug}
            productId={productId}
          />
        </div>
      ) : (
        <button
          onClick={handleAddToCart}
          disabled={!isValid || isPending}
          className={`w-full py-4 px-6 text-white font-medium rounded-lg transition-all duration-200 ${
            !isValid
              ? 'bg-gray-400 cursor-not-allowed'
              : isPending
              ? 'bg-gray-600 cursor-wait'
              : 'bg-black hover:bg-gray-800 active:scale-[0.98]'
          }`}
        >
          {!isValid ? (
            'נא למלא שדות חובה'
          ) : isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              מוסיף...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z" />
                <path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z" />
                <path d="M1 1H5L7.68 14.39C7.77 14.83 8.02 15.22 8.38 15.5C8.74 15.78 9.19 15.93 9.64 15.92H19.4C19.84 15.92 20.27 15.76 20.62 15.49C20.96 15.21 21.19 14.83 21.29 14.4L23 6H6" />
              </svg>
              הוסף לסל{addonTotal > 0 ? ` - ${format(totalPrice)}` : ''}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

