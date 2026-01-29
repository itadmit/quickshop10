'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Check, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  hasVariants: boolean;
  imageUrl: string | null;
}

interface Variant {
  id: string;
  title: string | null;
  price: string | null;
  inventory: number | null;
  allowBackorder: boolean;
}

interface SelectedExchangeProduct {
  productId: string;
  productName: string;
  variantId?: string;
  variantTitle?: string;
  price: number;
  imageUrl: string | null;
}

interface ExchangeProductPickerProps {
  storeSlug: string;
  onSelect: (product: SelectedExchangeProduct | null) => void;
  selectedProduct: SelectedExchangeProduct | null;
}

export function ExchangeProductPicker({ 
  storeSlug, 
  onSelect,
  selectedProduct 
}: ExchangeProductPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchQuery.length < 2) {
      setProducts([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/storefront/${storeSlug}/exchange-products?q=${encodeURIComponent(searchQuery)}&limit=20`
        );
        const data = await res.json();
        setProducts(data.products || []);
        setShowResults(true);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, storeSlug]);

  // Load initial products on focus (popular/recent)
  const handleFocus = useCallback(async () => {
    if (products.length === 0 && searchQuery.length < 2) {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/storefront/${storeSlug}/exchange-products?limit=10`
        );
        const data = await res.json();
        setProducts(data.products || []);
        setShowResults(true);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    } else {
      setShowResults(true);
    }
  }, [products.length, searchQuery.length, storeSlug]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
        setSelectedProductForVariant(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load variants when product is selected
  useEffect(() => {
    if (selectedProductForVariant?.hasVariants) {
      setLoadingVariants(true);
      fetch(`/api/products/${selectedProductForVariant.id}/variants`)
        .then(res => res.json())
        .then(data => {
          // Filter to only show in-stock variants
          const inStockVariants = (data.variants || []).filter((v: Variant) => 
            v.allowBackorder || (v.inventory !== null && v.inventory > 0)
          );
          setVariants(inStockVariants);
          setLoadingVariants(false);
        })
        .catch(() => {
          setVariants([]);
          setLoadingVariants(false);
        });
    } else {
      setVariants([]);
    }
  }, [selectedProductForVariant]);

  const handleSelectProduct = (product: Product) => {
    if (product.hasVariants) {
      setSelectedProductForVariant(product);
    } else {
      onSelect({
        productId: product.id,
        productName: product.name,
        price: Number(product.price),
        imageUrl: product.imageUrl,
      });
      setShowResults(false);
      setSearchQuery('');
    }
  };

  const handleSelectVariant = (variant: Variant) => {
    if (!selectedProductForVariant) return;
    
    onSelect({
      productId: selectedProductForVariant.id,
      productName: selectedProductForVariant.name,
      variantId: variant.id,
      variantTitle: variant.title || undefined,
      price: Number(variant.price || selectedProductForVariant.price),
      imageUrl: selectedProductForVariant.imageUrl,
    });
    setShowResults(false);
    setSelectedProductForVariant(null);
    setSearchQuery('');
  };

  const handleClear = () => {
    onSelect(null);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Selected Product Display */}
      {selectedProduct ? (
        <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          {selectedProduct.imageUrl ? (
            <img 
              src={selectedProduct.imageUrl} 
              alt={selectedProduct.productName}
              className="w-12 h-12 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
              <Package className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{selectedProduct.productName}</p>
            {selectedProduct.variantTitle && (
              <p className="text-xs text-gray-500">{selectedProduct.variantTitle}</p>
            )}
            <p className="text-xs text-gray-500">₪{selectedProduct.price.toFixed(2)}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      ) : (
        <>
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleFocus}
              placeholder="חפש מוצר להחלפה..."
              className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
            />
            {loading && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Results Dropdown */}
          {showResults && (
            <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {selectedProductForVariant ? (
                // Variant Selection
                <div>
                  <div className="p-3 border-b border-gray-100 bg-gray-50">
                    <button
                      type="button"
                      onClick={() => setSelectedProductForVariant(null)}
                      className="text-sm text-gray-500 hover:text-black flex items-center gap-1 cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                      חזרה למוצרים
                    </button>
                    <p className="font-medium mt-1">{selectedProductForVariant.name}</p>
                  </div>
                  
                  {loadingVariants ? (
                    <div className="p-4 text-center">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto" />
                    </div>
                  ) : variants.length === 0 ? (
                    <p className="p-4 text-center text-gray-500 text-sm">אין וריאנטים במלאי</p>
                  ) : (
                    variants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => handleSelectVariant(variant)}
                        className="w-full p-3 text-right hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 cursor-pointer"
                      >
                        <p className="text-sm font-medium">{variant.title || 'ברירת מחדל'}</p>
                        <p className="text-xs text-gray-500">₪{Number(variant.price).toFixed(2)}</p>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                // Product List
                <>
                  {products.length === 0 && !loading ? (
                    <p className="p-4 text-center text-gray-500 text-sm">
                      {searchQuery.length < 2 ? 'הקלד לחיפוש...' : 'לא נמצאו מוצרים'}
                    </p>
                  ) : (
                    products.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSelectProduct(product)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 cursor-pointer"
                      >
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 text-right min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>₪{Number(product.price).toFixed(2)}</span>
                            {product.hasVariants && (
                              <span className="text-gray-400">• בחר וריאנט</span>
                            )}
                          </div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 rotate-180">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </button>
                    ))
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}








