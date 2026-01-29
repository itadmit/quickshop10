'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createDraft, completeDraft, searchProductsForDraft, type SearchProductResult } from '../actions';
import { Search, X, Plus, Minus, Package, Mail, Truck, Bell, CheckCircle2, MapPin } from 'lucide-react';
import Image from 'next/image';

interface ShippingAddress {
  city: string;
  street: string;
  houseNumber?: string;
  apartment?: string;
  floor?: string;
  zipCode?: string;
}

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
  
  // Shipping method & address
  const [shippingMethod, setShippingMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    city: '',
    street: '',
    houseNumber: '',
    apartment: '',
    floor: '',
    zipCode: '',
  });
  
  // Order options
  const [createAsOrder, setCreateAsOrder] = useState(false); // Create directly as order (not draft)
  const [executePostActions, setExecutePostActions] = useState(true); // Execute post-payment actions
  
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
      // Create draft first
      const draftResult = await createDraft(slug, {
        customerName,
        customerEmail,
        customerPhone,
        items,
        notes,
        shipping,
        shippingAddress: shippingMethod === 'delivery' ? shippingAddress as Record<string, unknown> : undefined,
      });

      if (!draftResult.success) {
        alert(draftResult.error);
        return;
      }

      // If createAsOrder is true, complete the draft immediately
      if (createAsOrder && draftResult.draftId) {
        const completeResult = await completeDraft(draftResult.draftId, slug, {
          executePostActions,
        });

        if (completeResult.success) {
          router.push(`/shops/${slug}/admin/orders`);
        } else {
          alert(completeResult.error);
        }
      } else {
        router.push(`/shops/${slug}/admin/orders/drafts`);
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 2,
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

            {/* Shipping Method */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-3">אופציית משלוח</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShippingMethod('pickup');
                    setShipping(0);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    shippingMethod === 'pickup'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  איסוף עצמי
                </button>
                <button
                  type="button"
                  onClick={() => setShippingMethod('delivery')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    shippingMethod === 'delivery'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  משלוח
                </button>
              </div>

              {/* Delivery Address */}
              {shippingMethod === 'delivery' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4" />
                    כתובת למשלוח
                  </div>
                  
                  {/* City */}
                  <input
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    placeholder="עיר *"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  />
                  
                  {/* Street + House Number */}
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                      placeholder="רחוב *"
                      className="col-span-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    />
                    <input
                      type="text"
                      value={shippingAddress.houseNumber}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, houseNumber: e.target.value })}
                      placeholder="מס׳ בית"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>

                  {/* Apartment + Floor + Zip */}
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={shippingAddress.apartment}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, apartment: e.target.value })}
                      placeholder="דירה"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    />
                    <input
                      type="text"
                      value={shippingAddress.floor}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, floor: e.target.value })}
                      placeholder="קומה"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    />
                    <input
                      type="text"
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                      placeholder="מיקוד"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}
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

          {/* Order Options */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">אפשרויות הזמנה</h2>
            
            {/* Create as order toggle */}
            <div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-100">
              <input
                type="checkbox"
                id="createAsOrder"
                checked={createAsOrder}
                onChange={(e) => setCreateAsOrder(e.target.checked)}
                className="mt-1 w-4 h-4 text-black border-gray-300 rounded focus:ring-black cursor-pointer"
              />
              <label htmlFor="createAsOrder" className="cursor-pointer flex-1">
                <span className="font-medium text-gray-900">צור כהזמנה מושלמת</span>
                <p className="text-sm text-gray-500 mt-0.5">
                  ההזמנה תיוצר ישירות בסטטוס &quot;אושרה&quot; ולא כטיוטה
                </p>
              </label>
            </div>

            {/* Post-payment actions - only shown when createAsOrder is true */}
            {createAsOrder && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 mb-2">פעולות אוטומטיות:</p>
                
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="executePostActions"
                    checked={executePostActions}
                    onChange={(e) => setExecutePostActions(e.target.checked)}
                    className="mt-1 w-4 h-4 text-black border-gray-300 rounded focus:ring-black cursor-pointer"
                  />
                  <label htmlFor="executePostActions" className="cursor-pointer flex-1">
                    <span className="font-medium text-gray-900">בצע פעולות אחרי הזמנה</span>
                    <p className="text-sm text-gray-500 mt-0.5">
                      כמו בהזמנה רגילה מהחנות
                    </p>
                  </label>
                </div>

                {/* Actions breakdown */}
                {executePostActions && (
                  <div className="mr-7 mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span>שליחת מייל אישור ללקוח</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Truck className="w-4 h-4 text-green-500" />
                      <span>שליחה אוטומטית לחברת משלוחים</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Bell className="w-4 h-4 text-orange-500" />
                      <span>הפעלת אוטומציות (SMS, Webhooks)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="w-4 h-4 text-purple-500" />
                      <span>עדכון מלאי</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-teal-500" />
                      <span>תיעוד לסטטיסטיקות ו-tracking</span>
                    </div>
                  </div>
                )}
              </div>
            )}
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
                className={`w-full px-4 py-3 font-medium rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors ${
                  createAsOrder
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {isPending 
                  ? 'יוצר הזמנה...' 
                  : createAsOrder 
                    ? 'צור והשלם הזמנה' 
                    : 'צור טיוטה'}
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
