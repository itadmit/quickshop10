'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createDraft, searchProductsForDraft, type SearchProductResult } from '../actions';
import { Search, X, Plus, Minus, Package } from 'lucide-react';
import Image from 'next/image';

interface DraftItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export default function NewDraftOrderPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [shipping, setShipping] = useState(0);
  
  // Items
  const [items, setItems] = useState<DraftItem[]>([]);
  
  // Product search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProductResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualItem, setManualItem] = useState({ name: '', price: 0, quantity: 1 });

  // Debounced search
  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    const result = await searchProductsForDraft(slug, query);
    if (result.success && result.products) {
      setSearchResults(result.products);
    }
    setIsSearching(false);
  }, [slug]);

  // Add product from search
  const addProduct = (product: SearchProductResult, variantId?: string, variantTitle?: string, variantPrice?: number) => {
    const name = variantTitle ? `${product.name} - ${variantTitle}` : product.name;
    const price = variantPrice ?? product.price;
    
    // Check if already in items
    const existingIndex = items.findIndex(
      item => item.productId === product.id && item.variantId === variantId
    );
    
    if (existingIndex >= 0) {
      // Increment quantity
      setItems(items.map((item, i) => 
        i === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      // Add new item
      setItems([
        ...items,
        {
          productId: product.id,
          variantId,
          name,
          price,
          quantity: 1,
          imageUrl: product.imageUrl || undefined,
        },
      ]);
    }
    
    setSearchQuery('');
    setSearchResults([]);
  };

  // Add manual item
  const addManualItem = () => {
    if (!manualItem.name || manualItem.price <= 0) return;
    
    setItems([
      ...items,
      {
        productId: `manual-${Date.now()}`,
        name: manualItem.name,
        price: manualItem.price,
        quantity: manualItem.quantity,
      },
    ]);
    setManualItem({ name: '', price: 0, quantity: 1 });
    setShowManualAdd(false);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    setItems(items.map((item, i) => (i === index ? { ...item, quantity } : item)));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + shipping;

  const handleSubmit = () => {
    if (items.length === 0) {
      alert('יש להוסיף לפחות פריט אחד');
      return;
    }

    startTransition(async () => {
      const result = await createDraft(slug, {
        customerName,
        customerEmail,
        customerPhone,
        items,
        notes,
        shipping,
      });

      if (result.success) {
        router.push(`/shops/${slug}/admin/orders/drafts`);
      } else {
        alert(result.error);
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">הזמנה חדשה</h1>
          <p className="text-gray-500 text-sm mt-1">יצירת הזמנה ידנית</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">פרטי לקוח</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="שם הלקוח"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="050-0000000"
                />
              </div>
            </div>
          </div>

          {/* Product Search */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">מוצרים</h2>
              <button
                onClick={() => setShowManualAdd(!showManualAdd)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {showManualAdd ? 'חיפוש מוצר' : '+ הוספה ידנית'}
              </button>
            </div>

            {showManualAdd ? (
              // Manual Add Form
              <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                <h3 className="text-sm font-medium mb-3">הוספה ידנית</h3>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={manualItem.name}
                      onChange={(e) => setManualItem({ ...manualItem, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      placeholder="שם המוצר"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      value={manualItem.price || ''}
                      onChange={(e) => setManualItem({ ...manualItem, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      placeholder="מחיר"
                      min="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={manualItem.quantity}
                      onChange={(e) => setManualItem({ ...manualItem, quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      placeholder="כמות"
                      min="1"
                    />
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={addManualItem}
                      className="w-full px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      הוסף
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Product Search
              <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="חפש מוצר לפי שם או מק״ט..."
                />
                
                {/* Search Results Dropdown */}
                {searchQuery.length >= 2 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center text-gray-500">מחפש...</div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">לא נמצאו מוצרים</div>
                    ) : (
                      searchResults.map((product) => (
                        <div key={product.id} className="border-b border-gray-100 last:border-0">
                          {product.variants.length > 0 ? (
                            // Product with variants
                            <div>
                              <div className="flex items-center gap-3 p-3 bg-gray-50">
                                {product.imageUrl ? (
                                  <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    width={40}
                                    height={40}
                                    className="rounded object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                    <Package className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{product.name}</p>
                                  <p className="text-xs text-gray-500">{product.variants.length} וריאנטים</p>
                                </div>
                              </div>
                              {product.variants.map((variant) => (
                                <button
                                  key={variant.id}
                                  onClick={() => addProduct(product, variant.id, variant.title, variant.price)}
                                  className="w-full flex items-center justify-between px-4 py-2 pr-14 hover:bg-gray-50 text-sm"
                                >
                                  <span>{variant.title}</span>
                                  <span className="text-gray-600">{formatCurrency(variant.price)}</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            // Simple product
                            <button
                              onClick={() => addProduct(product)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50"
                            >
                              {product.imageUrl ? (
                                <Image
                                  src={product.imageUrl}
                                  alt={product.name}
                                  width={40}
                                  height={40}
                                  className="rounded object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 text-right">
                                <p className="font-medium text-sm">{product.name}</p>
                                {product.sku && (
                                  <p className="text-xs text-gray-500">מק״ט: {product.sku}</p>
                                )}
                              </div>
                              <span className="font-medium">{formatCurrency(product.price)}</span>
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Items List */}
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>חפש מוצרים או הוסף ידנית</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={40}
                          height={40}
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(item.price)} ליחידה</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateItemQuantity(index, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateItemQuantity(index, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="font-medium w-20 text-left">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <button
                        onClick={() => removeItem(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">הערות</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              rows={3}
              placeholder="הערות פנימיות להזמנה..."
            />
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
            <h2 className="font-semibold mb-4">סיכום</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">סה״כ מוצרים ({items.length})</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">משלוח</span>
                <input
                  type="number"
                  value={shipping || ''}
                  onChange={(e) => setShipping(Number(e.target.value))}
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-left"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-lg">
                <span>סה״כ</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSubmit}
                disabled={isPending || items.length === 0}
                className="w-full px-4 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'יוצר הזמנה...' : 'צור הזמנה'}
              </button>
              <button
                onClick={() => router.back()}
                className="w-full px-4 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
