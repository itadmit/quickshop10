'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { updateProductsOrder } from './actions';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string | null;
  inventory: number | null;
  trackInventory: boolean;
  isActive: boolean;
  image: string | null;
}

interface ProductsReorderListProps {
  products: Product[];
  categoryId: string;
  storeSlug: string;
  totalProducts: number;
  perPage: number;
}

export function ProductsReorderList({ 
  products: initialProducts, 
  categoryId, 
  storeSlug,
  totalProducts,
  perPage 
}: ProductsReorderListProps) {
  const [products, setProducts] = useState(initialProducts);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const draggedItemRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    
    // Add dragging class for visual feedback
    const target = e.target as HTMLElement;
    setTimeout(() => {
      target.style.opacity = '0.5';
    }, 0);
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    setDraggedIndex(null);
    setDropTargetIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex !== null && draggedIndex !== index) {
      setDropTargetIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDropTargetIndex(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDropTargetIndex(null);
      return;
    }

    // Reorder array
    const newProducts = [...products];
    const [draggedItem] = newProducts.splice(draggedIndex, 1);
    newProducts.splice(dropIndex, 0, draggedItem);
    
    setProducts(newProducts);
    setDraggedIndex(null);
    setDropTargetIndex(null);

    // Save to server
    setIsSaving(true);
    try {
      const productIds = newProducts.map(p => p.id);
      await updateProductsOrder(categoryId, productIds);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save order:', error);
      // Revert on error
      setProducts(initialProducts);
    } finally {
      setIsSaving(false);
    }
  }, [draggedIndex, products, categoryId, initialProducts]);

  // Touch support
  const handleTouchStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (draggedIndex === null) return;
    
    const touch = e.touches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    
    for (const el of elements) {
      const dataIndex = el.getAttribute('data-index');
      if (dataIndex !== null) {
        const index = parseInt(dataIndex, 10);
        if (index !== draggedIndex) {
          setDropTargetIndex(index);
        }
        break;
      }
    }
  }, [draggedIndex]);

  const handleTouchEnd = useCallback(() => {
    if (draggedIndex !== null && dropTargetIndex !== null && draggedIndex !== dropTargetIndex) {
      const newProducts = [...products];
      const [draggedItem] = newProducts.splice(draggedIndex, 1);
      newProducts.splice(dropTargetIndex, 0, draggedItem);
      setProducts(newProducts);
      
      // Save
      setIsSaving(true);
      const productIds = newProducts.map(p => p.id);
      updateProductsOrder(categoryId, productIds)
        .then(() => {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        })
        .catch(() => setProducts(initialProducts))
        .finally(() => setIsSaving(false));
    }
    
    setDraggedIndex(null);
    setDropTargetIndex(null);
  }, [draggedIndex, dropTargetIndex, products, categoryId, initialProducts]);

  if (products.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">אין מוצרים בקטגוריה זו</p>
        <Link 
          href={`/shops/${storeSlug}/admin/products/new`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-900 hover:text-gray-700 mt-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          הוסף מוצר
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Saving indicator */}
      {(isSaving || saveSuccess) && (
        <div className={`absolute top-2 left-2 z-10 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
          saveSuccess ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {isSaving ? (
            <>
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              שומר...
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              נשמר
            </>
          )}
        </div>
      )}

      {/* Products list */}
      <div 
        className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            data-index={index}
            ref={draggedIndex === index ? draggedItemRef : null}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onTouchStart={() => handleTouchStart(index)}
            className={`relative transition-all duration-150 ${
              draggedIndex === index 
                ? 'opacity-50 scale-[0.98]' 
                : ''
            }`}
          >
            {/* Drop indicator - top */}
            {dropTargetIndex === index && draggedIndex !== null && draggedIndex > index && (
              <div className="absolute -top-[2px] left-4 right-4 z-20">
                <div className="h-1 bg-blue-500 rounded-full shadow-sm" />
                <div className="absolute -left-1 -top-1.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>
            )}

            {/* Product row */}
            <div className={`flex items-center gap-3 px-4 py-3 transition-colors ${
              dropTargetIndex === index 
                ? 'bg-blue-50' 
                : draggedIndex === index 
                  ? 'bg-gray-100' 
                  : 'bg-white hover:bg-gray-50'
            }`}>
              {/* Drag handle */}
              <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 -mr-1">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="9" cy="6" r="2" />
                  <circle cx="15" cy="6" r="2" />
                  <circle cx="9" cy="12" r="2" />
                  <circle cx="15" cy="12" r="2" />
                  <circle cx="9" cy="18" r="2" />
                  <circle cx="15" cy="18" r="2" />
                </svg>
              </div>

              {/* Index number */}
              <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                {index + 1}
              </div>

              {/* Product image */}
              <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/shops/${storeSlug}/admin/products/${product.id}`}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block"
                >
                  {product.name}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">
                    ₪{Number(product.price || 0).toLocaleString()}
                  </span>
                  {product.trackInventory && (
                    <span className={`text-xs ${
                      (product.inventory ?? 0) === 0 ? 'text-red-500' : 
                      (product.inventory ?? 0) <= 5 ? 'text-amber-500' : 'text-gray-400'
                    }`}>
                      • מלאי: {product.inventory ?? 0}
                    </span>
                  )}
                </div>
              </div>

              {/* Status */}
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                product.isActive 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {product.isActive ? 'פעיל' : 'טיוטה'}
              </span>
            </div>

            {/* Drop indicator - bottom */}
            {dropTargetIndex === index && draggedIndex !== null && draggedIndex < index && (
              <div className="absolute -bottom-[2px] left-4 right-4 z-20">
                <div className="h-1 bg-blue-500 rounded-full shadow-sm" />
                <div className="absolute -left-1 -bottom-1.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer info */}
      {totalProducts > perPage && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            מציג {Math.min(products.length, perPage)} מתוך {totalProducts} מוצרים
          </p>
        </div>
      )}
    </div>
  );
}

