'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Search, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface SearchButtonProps {
  basePath: string;
  storeId: string;
}

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: string | null;
  image: string | null;
}

// Lightweight client component for search with live results
export function SearchButton({ basePath, storeId }: SearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Live search with debounce
  const searchProducts = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&storeId=${storeId}&limit=6`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data.products || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchProducts(query);
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchProducts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`${basePath}/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery('');
      setResults([]);
    }
  };

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const formatPrice = (price: string | null) => {
    if (!price) return '';
    return `₪${Number(price).toFixed(2)}`;
  };

  // Search Modal - rendered via portal to body
  const searchModal = isOpen && mounted ? createPortal(
    <div 
      className="fixed inset-0 z-[9999] bg-black/50 flex items-start justify-center pt-16 sm:pt-24"
      onClick={() => setIsOpen(false)}
      dir="rtl"
    >
      <div 
        className="bg-white w-full max-w-2xl mx-4 rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <form onSubmit={handleSubmit} className="flex items-center border-b border-gray-100">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-4 text-gray-400 hover:text-black transition-colors cursor-pointer"
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            type="submit"
            className="p-4 text-gray-400 hover:text-black transition-colors cursor-pointer"
            aria-label="חפש"
          >
            <Search className="w-5 h-5" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="חפש מוצרים..."
            className="flex-1 px-4 py-4 text-lg outline-none text-right"
          />
        </form>

        {/* Live Results */}
        {(results.length > 0 || isLoading) && (
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`${basePath}/product/${product.slug}`}
                    onClick={handleResultClick}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Search className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                      {product.price && (
                        <p className="text-sm text-gray-600 mt-1">{formatPrice(product.price)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* View All Results */}
            {results.length > 0 && query.trim() && (
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={handleSubmit}
                  className="w-full py-3 text-center text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer"
                >
                  הצג את כל התוצאות עבור &quot;{query}&quot;
                </button>
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {query.length >= 2 && !isLoading && results.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            לא נמצאו תוצאות עבור &quot;{query}&quot;
          </div>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center text-gray-600 hover:text-black transition-colors cursor-pointer"
        aria-label="חיפוש"
      >
        <Search className="w-[18px] h-[18px]" />
      </button>

      {searchModal}
    </>
  );
}
