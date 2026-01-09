'use client';

/**
 * Cart Upsells Component
 * 
 * Displays product recommendations based on cart items
 * 
 * ⚡ Performance (REQUIREMENTS.md compliant):
 * - Lazy load: only fetch when cart has items
 * - Horizontal scroll: CSS-only, no JS carousel
 * - Minimal re-renders with useMemo
 */

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useStoreOptional } from '@/lib/store-context';

interface UpsellProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  comparePrice: string | null;
  imageUrl: string | null;
  hasVariants: boolean;
  variants?: {
    id: string;
    title: string;
    price: string;
    inventory: number | null;
    isActive: boolean;
  }[];
  options?: {
    name: string;
    values: string[];
  }[];
}

interface CartUpsellsProps {
  storeSlug: string;
}

export function CartUpsells({ storeSlug }: CartUpsellsProps) {
  const store = useStoreOptional();
  const [upsells, setUpsells] = useState<UpsellProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  // Get unique product IDs from cart
  const cartProductIds = useMemo(() => {
    if (!store?.cart) return [];
    return [...new Set(store.cart.map(item => item.productId))];
  }, [store?.cart]);

  // Fetch upsells when cart changes
  useEffect(() => {
    if (cartProductIds.length === 0) {
      setUpsells([]);
      return;
    }

    const fetchUpsells = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/storefront/${storeSlug}/cart/upsells?productIds=${cartProductIds.join(',')}`
        );
        if (res.ok) {
          const data = await res.json();
          setUpsells(data.upsells || []);
        }
      } catch (error) {
        console.error('Error fetching upsells:', error);
      }
      setIsLoading(false);
    };

    fetchUpsells();
  }, [cartProductIds.join(','), storeSlug]);

  // Handle add to cart
  const handleAddToCart = (product: UpsellProduct) => {
    if (!store) return;

    const selectedVariantId = selectedVariants[product.id];
    
    if (product.hasVariants && product.variants?.length) {
      // Find selected variant or first available
      const variant = selectedVariantId 
        ? product.variants.find(v => v.id === selectedVariantId)
        : product.variants[0];
      
      if (!variant) return;

      store.addToCart({
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        variantTitle: variant.title,
        price: Number(variant.price),
        image: product.imageUrl || '',
        trackInventory: variant.inventory !== null,
        maxQuantity: variant.inventory || undefined,
      }, 1);
    } else {
      store.addToCart({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.imageUrl || '',
      }, 1);
    }
  };

  if (!store || upsells.length === 0) return null;

  return (
    <div className="mt-6 pt-4 border-t border-gray-100">
      <h3 className="text-sm font-medium text-gray-700 mb-3">אולי יעניין אותך גם</h3>
      
      {/* Horizontal scroll container */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
        {upsells.map(product => (
          <div 
            key={product.id}
            className="shrink-0 w-[140px] bg-white border border-gray-100 rounded-lg overflow-hidden"
          >
            {/* Image */}
            <div className="aspect-square bg-gray-50 relative">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
                    <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.5" />
                    <path d="M21 15l-5-5L5 21" strokeWidth="1.5" />
                  </svg>
                </div>
              )}
              
              {/* Discount badge */}
              {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
                <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                  -{Math.round((1 - Number(product.price) / Number(product.comparePrice)) * 100)}%
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="p-2">
              <h4 className="text-xs font-medium text-gray-900 line-clamp-2 min-h-[32px]">
                {product.name}
              </h4>
              
              {/* Price */}
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm font-semibold text-gray-900">
                  ₪{Number(product.price).toFixed(2)}
                </span>
                {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
                  <span className="text-[10px] text-gray-400 line-through">
                    ₪{Number(product.comparePrice).toFixed(2)}
                  </span>
                )}
              </div>
              
              {/* Variant Selector (if has variants with options) */}
              {product.hasVariants && product.options && product.options.length > 0 && (
                <select
                  value={selectedVariants[product.id] || product.variants?.[0]?.id || ''}
                  onChange={(e) => setSelectedVariants(prev => ({
                    ...prev,
                    [product.id]: e.target.value
                  }))}
                  className="w-full mt-2 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                >
                  {product.variants?.map(variant => (
                    <option 
                      key={variant.id} 
                      value={variant.id}
                      disabled={variant.inventory !== null && variant.inventory <= 0}
                    >
                      {variant.title}
                      {variant.inventory !== null && variant.inventory <= 0 && ' (אזל)'}
                    </option>
                  ))}
                </select>
              )}
              
              {/* Add to Cart Button */}
              <button
                onClick={() => handleAddToCart(product)}
                disabled={isPending}
                className="w-full mt-2 py-1.5 bg-black text-white text-xs font-medium rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                הוסף לסל
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Hide scrollbar style */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

