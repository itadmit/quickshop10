'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { searchProducts } from './actions';
import Image from 'next/image';

// Simple debounce hook
function useDebounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;
}

// ============================================
// Product Search Component
// Search products by name, SKU, or barcode
// ============================================

interface Product {
  id: string;
  name: string;
  price: string | null;
  comparePrice: string | null;
  imageUrl: string | null;
  sku: string | null;
  barcode: string | null;
  hasVariants: boolean;
  inventory: number | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductSearchProps {
  storeId: string;
  initialProducts: Product[];
  categories: Category[];
  onAddToCart: (product: Product) => void;
  onAddManualItem: (name: string, price: number, description?: string) => void;
}

export function ProductSearch({
  storeId,
  initialProducts,
  categories,
  onAddToCart,
  onAddManualItem,
}: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  
  // Manual item form
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualDescription, setManualDescription] = useState('');

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setProducts(initialProducts);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchProducts(storeId, searchQuery);
      setProducts(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [storeId, initialProducts]);

  // Debounced search
  const debouncedSearch = useDebounce(performSearch, 300);

  const handleSearch = (value: string) => {
    setQuery(value);
    debouncedSearch(value);
  };

  const handleAddManualItem = () => {
    const price = parseFloat(manualPrice);
    if (!manualName.trim() || isNaN(price) || price <= 0) return;

    onAddManualItem(manualName, price, manualDescription || undefined);
    setManualName('');
    setManualPrice('');
    setManualDescription('');
    setShowManualModal(false);
  };

  const formatPrice = (price: string | null) => {
    if (!price) return '₪0';
    return `₪${parseFloat(price).toLocaleString('he-IL')}`;
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {isSearching ? (
            <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="חיפוש מוצר, SKU או ברקוד..."
          className="w-full pr-10 pl-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow"
          autoFocus
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {products.map((product) => {
          const isOutOfStock = product.inventory !== null && product.inventory <= 0;
          const isLowStock = product.inventory !== null && product.inventory > 0 && product.inventory <= 5;
          
          return (
            <button
              key={product.id}
              onClick={() => !isOutOfStock && onAddToCart(product)}
              disabled={isOutOfStock}
              className={`group bg-white rounded-xl border p-3 transition-all text-right ${
                isOutOfStock 
                  ? 'border-gray-200 opacity-60 cursor-not-allowed' 
                  : 'border-gray-200 hover:border-gray-400 hover:shadow-md cursor-pointer'
              }`}
            >
              {/* Image */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2 relative">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={150}
                    height={150}
                    className={`w-full h-full object-cover transition-transform ${!isOutOfStock && 'group-hover:scale-105'}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {/* Out of stock overlay */}
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-1 rounded">
                      אזל מהמלאי
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                {product.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                {product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price || '0') && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatPrice(product.comparePrice)}
                  </span>
                )}
              </div>
              {/* Stock indicator */}
              {product.inventory !== null && (
                <p className={`text-xs mt-1 ${
                  isOutOfStock ? 'text-red-500' : isLowStock ? 'text-orange-500' : 'text-green-600'
                }`}>
                  {isOutOfStock ? 'אזל' : isLowStock ? `נותרו ${product.inventory}` : `במלאי: ${product.inventory}`}
                </p>
              )}
              {product.sku && (
                <p className="text-xs text-gray-400 mt-0.5">{product.sku}</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {products.length === 0 && !isSearching && (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p>לא נמצאו מוצרים</p>
        </div>
      )}

      {/* Add Manual Item Button */}
      <button
        onClick={() => setShowManualModal(true)}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>הוסף פריט ידני</span>
      </button>

      {/* Manual Item Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowManualModal(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">הוספת פריט ידני</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם הפריט *
                  </label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="לדוגמה: שירות תיקון"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מחיר *
                  </label>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">₪</span>
                    <input
                      type="number"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full pr-8 pl-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תיאור (אופציונלי)
                  </label>
                  <textarea
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    placeholder="תיאור קצר..."
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  onClick={handleAddManualItem}
                  disabled={!manualName.trim() || !manualPrice || parseFloat(manualPrice) <= 0}
                  className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  הוסף לעגלה
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

