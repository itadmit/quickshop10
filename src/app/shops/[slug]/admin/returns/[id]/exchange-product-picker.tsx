'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createExchangeOrder } from '../actions';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string | null;
  hasVariants: boolean;
}

interface Variant {
  id: string;
  title: string | null;
  price: string | null;
}

interface ExchangeProductPickerProps {
  storeSlug: string;
  requestId: string;
  originalValue: number;
  products: Product[];
}

export function ExchangeProductPicker({ 
  storeSlug, 
  requestId, 
  originalValue,
  products 
}: ExchangeProductPickerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter products by search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load variants when product is selected
  useEffect(() => {
    if (selectedProduct?.hasVariants) {
      setLoadingVariants(true);
      fetch(`/api/products/${selectedProduct.id}/variants`)
        .then(res => res.json())
        .then(data => {
          setVariants(data.variants || []);
          setLoadingVariants(false);
        })
        .catch(() => {
          setVariants([]);
          setLoadingVariants(false);
        });
    } else {
      setVariants([]);
      setSelectedVariant(null);
    }
  }, [selectedProduct]);

  const handleCreateExchange = () => {
    if (!selectedProduct) {
      setError('יש לבחור מוצר להחלפה');
      return;
    }

    if (selectedProduct.hasVariants && !selectedVariant) {
      setError('יש לבחור וריאנט');
      return;
    }

    setError('');
    startTransition(async () => {
      const result = await createExchangeOrder({
        storeSlug,
        requestId,
        newProductId: selectedProduct.id,
        newVariantId: selectedVariant || undefined,
      });

      if (result.success) {
        let message = `הזמנת החלפה #${result.orderNumber} נוצרה בהצלחה!`;
        
        if (result.priceDifference && result.priceDifference > 0) {
          message += ` נשלח ללקוח לינק לתשלום הפרש של ₪${result.priceDifference.toFixed(0)}`;
        } else if (result.creditIssued) {
          message += ` הוזן ללקוח קרדיט של ₪${result.creditIssued.toFixed(0)}`;
        }
        
        setSuccess(message);
        router.refresh();
      } else {
        setError(result.error || 'אירעה שגיאה');
      }
    });
  };

  const getNewPrice = () => {
    if (selectedVariant) {
      const variant = variants.find(v => v.id === selectedVariant);
      return Number(variant?.price) || Number(selectedProduct?.price) || 0;
    }
    return Number(selectedProduct?.price) || 0;
  };

  const priceDifference = selectedProduct ? getNewPrice() - originalValue : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="font-medium mb-4">בחר מוצר להחלפה</h2>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חפש מוצר..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
        />
      </div>

      {/* Product List */}
      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg mb-4">
        {filteredProducts.length === 0 ? (
          <p className="p-4 text-center text-gray-500 text-sm">לא נמצאו מוצרים</p>
        ) : (
          filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => {
                setSelectedProduct(product);
                setSelectedVariant(null);
              }}
              className={`w-full p-3 flex items-center gap-3 border-b border-gray-100 last:border-0 transition-colors cursor-pointer ${
                selectedProduct?.id === product.id ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
              <div className="flex-1 text-right">
                <p className="text-sm font-medium">{product.name}</p>
                <p className="text-xs text-gray-500">₪{Number(product.price).toFixed(0)}</p>
              </div>
              {selectedProduct?.id === product.id && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))
        )}
      </div>

      {/* Variant Selection */}
      {selectedProduct?.hasVariants && (
        <div className="mb-4">
          <label className="block text-sm text-gray-500 mb-2">בחר וריאנט:</label>
          {loadingVariants ? (
            <p className="text-sm text-gray-500">טוען...</p>
          ) : variants.length === 0 ? (
            <p className="text-sm text-gray-500">אין וריאנטים זמינים</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariant(variant.id)}
                  className={`px-3 py-1.5 text-sm border rounded-lg transition-colors cursor-pointer ${
                    selectedVariant === variant.id
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {variant.title || 'ברירת מחדל'}
                  {variant.price && ` - ₪${Number(variant.price).toFixed(0)}`}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Price Difference Summary */}
      {selectedProduct && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">ערך מקורי:</span>
            <span>₪{originalValue.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">מחיר מוצר חדש:</span>
            <span>₪{getNewPrice().toFixed(0)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between font-medium">
              <span>{priceDifference >= 0 ? 'הפרש לתשלום:' : 'זיכוי ללקוח:'}</span>
              <span className={priceDifference > 0 ? 'text-orange-600' : priceDifference < 0 ? 'text-green-600' : ''}>
                ₪{Math.abs(priceDifference).toFixed(0)}
              </span>
            </div>
          </div>
          
          {priceDifference > 0 && (
            <p className="text-xs text-orange-600 mt-2">
              * יישלח ללקוח לינק לתשלום ההפרש
            </p>
          )}
          {priceDifference < 0 && (
            <p className="text-xs text-green-600 mt-2">
              * קרדיט יוזן לחשבון הלקוח
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
          {success}
        </div>
      )}

      <button
        onClick={handleCreateExchange}
        disabled={isPending || !selectedProduct || (selectedProduct.hasVariants && !selectedVariant)}
        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors cursor-pointer"
      >
        {isPending ? 'יוצר הזמנת החלפה...' : 'צור הזמנת החלפה'}
      </button>
    </div>
  );
}

