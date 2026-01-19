'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import Image from 'next/image';
import { 
  getBundleData, 
  saveBundleSettings, 
  removeBundleFromProduct,
  getAvailableProductsForBundle,
  calculateBundlePrice,
  type BundleComponentWithProduct,
  type BundleSettings,
  type BundleComponentInput 
} from '@/app/shops/[slug]/admin/products/bundle-actions';

interface AvailableProduct {
  id: string;
  name: string;
  price: string | null;
  sku: string | null;
  inventory: number | null;
  hasVariants: boolean;
  primaryImage: string | null;
  variants: {
    id: string;
    title: string;
    price: string | null;
    sku: string | null;
    inventory: number | null;
  }[];
}

interface BundleEditorProps {
  productId: string;
  storeId: string;
  storeSlug: string;
  isBundle: boolean;
  onBundleChange?: (isBundle: boolean) => void;
}

export function BundleEditor({ productId, storeId, storeSlug, isBundle: initialIsBundle, onBundleChange }: BundleEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [isBundle, setIsBundle] = useState(initialIsBundle);
  const [isLoading, setIsLoading] = useState(true);
  
  // Bundle settings
  const [bundleType, setBundleType] = useState<'fixed' | 'mix_match'>('fixed');
  const [pricingType, setPricingType] = useState<BundleSettings['pricingType']>('fixed');
  const [discountValue, setDiscountValue] = useState<number | null>(null);
  const [minSelections, setMinSelections] = useState(1);
  const [maxSelections, setMaxSelections] = useState<number | null>(null);
  const [showComponentsInCart, setShowComponentsInCart] = useState(true);
  const [showComponentsOnPage, setShowComponentsOnPage] = useState(true);
  
  // Components
  const [components, setComponents] = useState<BundleComponentInput[]>([]);
  const [componentsData, setComponentsData] = useState<BundleComponentWithProduct[]>([]);
  
  // Available products for selection
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  
  // Pricing calculation
  const [priceInfo, setPriceInfo] = useState<{
    componentsTotal: number;
    bundlePrice: number | null;
    savings: number;
    savingsPercentage: number;
  } | null>(null);

  // Load bundle data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Load existing bundle data if exists
        if (initialIsBundle) {
          const bundleData = await getBundleData(productId);
          if (bundleData) {
            setBundleType(bundleData.bundle.bundleType || 'fixed');
            setPricingType(bundleData.bundle.pricingType || 'fixed');
            setDiscountValue(bundleData.bundle.discountValue ? parseFloat(bundleData.bundle.discountValue) : null);
            setMinSelections(bundleData.bundle.minSelections || 1);
            setMaxSelections(bundleData.bundle.maxSelections || null);
            setShowComponentsInCart(bundleData.bundle.showComponentsInCart);
            setShowComponentsOnPage(bundleData.bundle.showComponentsOnPage);
            setComponentsData(bundleData.components);
            setComponents(bundleData.components.map(c => ({
              productId: c.productId,
              variantId: c.variantId,
              quantity: c.quantity,
              isDefault: c.isDefault,
              isRequired: c.isRequired,
              priceOverride: c.priceOverride ? parseFloat(c.priceOverride) : null,
              sortOrder: c.sortOrder,
            })));
          }
          
          // Calculate pricing
          const pricing = await calculateBundlePrice(productId);
          setPriceInfo(pricing);
        }
        
        // Load available products
        const products = await getAvailableProductsForBundle(storeId, productId);
        setAvailableProducts(products);
      } catch (error) {
        console.error('Error loading bundle data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [productId, storeId, initialIsBundle]);

  // Save bundle settings
  const handleSave = useCallback(async () => {
    startTransition(async () => {
      const settings: BundleSettings = {
        bundleType,
        pricingType,
        discountValue,
        minSelections,
        maxSelections,
        showComponentsInCart,
        showComponentsOnPage,
      };
      
      const result = await saveBundleSettings(productId, storeSlug, settings, components);
      
      if (result.success) {
        // Reload pricing
        const pricing = await calculateBundlePrice(productId);
        setPriceInfo(pricing);
      } else {
        alert(result.error || 'שגיאה בשמירת ה-Bundle');
      }
    });
  }, [bundleType, pricingType, discountValue, minSelections, maxSelections, showComponentsInCart, showComponentsOnPage, components, productId, storeSlug]);

  // Toggle bundle mode
  const handleToggleBundle = async (enabled: boolean) => {
    if (!enabled && isBundle) {
      // Confirm removal
      if (!confirm('האם אתה בטוח שברצונך להסיר את ה-Bundle? כל הרכיבים יימחקו.')) {
        return;
      }
      
      startTransition(async () => {
        const result = await removeBundleFromProduct(productId, storeSlug);
        if (result.success) {
          setIsBundle(false);
          setComponents([]);
          setComponentsData([]);
          setPriceInfo(null);
          onBundleChange?.(false);
        }
      });
    } else {
      setIsBundle(enabled);
      onBundleChange?.(enabled);
    }
  };

  // Add component
  const addComponent = (product: AvailableProduct, variantId?: string) => {
    const variant = variantId ? product.variants.find(v => v.id === variantId) : null;
    
    const newComponent: BundleComponentInput = {
      productId: product.id,
      variantId: variantId || null,
      quantity: 1,
      isDefault: true,
      isRequired: false,
      priceOverride: null,
      sortOrder: components.length,
    };
    
    const newComponentData: BundleComponentWithProduct = {
      id: `temp-${Date.now()}`,
      bundleId: '',
      productId: product.id,
      variantId: variantId || null,
      quantity: 1,
      isDefault: true,
      isRequired: false,
      priceOverride: null,
      sortOrder: components.length,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        sku: product.sku,
        inventory: product.inventory,
        primaryImage: product.primaryImage,
      },
      variant: variant ? {
        id: variant.id,
        title: variant.title,
        price: variant.price,
        sku: variant.sku,
        inventory: variant.inventory,
      } : null,
    };
    
    setComponents([...components, newComponent]);
    setComponentsData([...componentsData, newComponentData]);
    setShowProductSearch(false);
    setSearchQuery('');
  };

  // Update component quantity
  const updateComponentQuantity = (index: number, quantity: number) => {
    setComponents(prev => prev.map((c, i) => i === index ? { ...c, quantity: Math.max(1, quantity) } : c));
    setComponentsData(prev => prev.map((c, i) => i === index ? { ...c, quantity: Math.max(1, quantity) } : c));
  };

  // Remove component
  const removeComponent = (index: number) => {
    setComponents(prev => prev.filter((_, i) => i !== index));
    setComponentsData(prev => prev.filter((_, i) => i !== index));
  };

  // Filter available products
  const filteredProducts = availableProducts.filter(p => {
    // Exclude already added products (unless they have multiple variants)
    const isAdded = components.some(c => c.productId === p.id && !c.variantId);
    if (isAdded && !p.hasVariants) return false;
    
    // Search filter
    if (searchQuery) {
      return p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return true;
  });

  // Calculate total components price
  const componentsTotal = componentsData.reduce((total, c) => {
    const price = c.priceOverride 
      ? parseFloat(c.priceOverride)
      : c.variant?.price 
        ? parseFloat(c.variant.price)
        : c.product.price 
          ? parseFloat(c.product.price)
          : 0;
    return total + (price * c.quantity);
  }, 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Bundle (מוצר מורכב)</h2>
        </div>
        <div className="p-4 flex items-center justify-center">
          <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-gray-900 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">Bundle (מוצר מורכב)</h2>
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded">חדש</span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isBundle}
            onChange={(e) => handleToggleBundle(e.target.checked)}
            disabled={isPending}
            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span className="text-sm text-gray-600">מוצר זה הוא Bundle</span>
        </label>
      </div>
      
      {isBundle && (
        <div className="p-4 space-y-5">
          {/* Bundle Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">סוג Bundle</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBundleType('fixed')}
                className={`p-3 border rounded-lg text-right transition-colors ${
                  bundleType === 'fixed' 
                    ? 'border-purple-500 bg-purple-50 text-purple-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">Bundle קבוע</div>
                <div className="text-xs text-gray-500 mt-1">רכיבים קבועים מראש</div>
              </button>
              <button
                type="button"
                onClick={() => setBundleType('mix_match')}
                className={`p-3 border rounded-lg text-right transition-colors ${
                  bundleType === 'mix_match' 
                    ? 'border-purple-500 bg-purple-50 text-purple-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">Mix & Match</div>
                <div className="text-xs text-gray-500 mt-1">לקוח בוחר מתוך רשימה</div>
              </button>
            </div>
          </div>

          {/* Components */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">רכיבי ה-Bundle</label>
              <button
                type="button"
                onClick={() => setShowProductSearch(true)}
                className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                הוסף מוצר
              </button>
            </div>
            
            {/* Product Search */}
            {showProductSearch && (
              <div className="mb-3 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חפש מוצר להוספה..."
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-colors text-sm"
                />
                
                {/* Results */}
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredProducts.slice(0, 15).map(product => (
                    <div key={product.id}>
                      {product.hasVariants ? (
                        // Show variants
                        product.variants
                          .filter(v => !components.some(c => c.variantId === v.id))
                          .map(variant => (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() => addComponent(product, variant.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-right hover:bg-gray-50 transition-colors"
                            >
                              {product.primaryImage ? (
                                <Image
                                  src={product.primaryImage}
                                  alt={product.name}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 object-cover rounded"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
                                  </svg>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm truncate">{product.name}</div>
                                <div className="text-xs text-gray-500">{variant.title}</div>
                              </div>
                              {variant.price && (
                                <span className="text-xs text-gray-500">₪{variant.price}</span>
                              )}
                            </button>
                          ))
                      ) : (
                        // Simple product
                        <button
                          type="button"
                          onClick={() => addComponent(product)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-right hover:bg-gray-50 transition-colors"
                        >
                          {product.primaryImage ? (
                            <Image
                              src={product.primaryImage}
                              alt={product.name}
                              width={32}
                              height={32}
                              className="w-8 h-8 object-cover rounded"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
                              </svg>
                            </div>
                          )}
                          <span className="flex-1 text-sm truncate">{product.name}</span>
                          {product.price && (
                            <span className="text-xs text-gray-500">₪{product.price}</span>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="px-3 py-4 text-sm text-gray-500 text-center">
                      לא נמצאו מוצרים
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductSearch(false);
                      setSearchQuery('');
                    }}
                    className="w-full px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 border-t"
                  >
                    סגור
                  </button>
                </div>
              </div>
            )}
            
            {/* Components List */}
            {componentsData.length > 0 ? (
              <div className="space-y-2">
                {componentsData.map((component, index) => (
                  <div key={component.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {component.product.primaryImage ? (
                      <Image
                        src={component.product.primaryImage}
                        alt={component.product.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{component.product.name}</div>
                      {component.variant && (
                        <div className="text-xs text-gray-500">{component.variant.title}</div>
                      )}
                      <div className="text-xs text-gray-400">
                        מחיר: ₪{component.variant?.price || component.product.price || '0'}
                      </div>
                    </div>
                    
                    {/* Quantity */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateComponentQuantity(index, component.quantity - 1)}
                        disabled={component.quantity <= 1}
                        className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{component.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateComponentQuantity(index, component.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeComponent(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                {/* Total */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200">
                  <span className="text-sm text-gray-600">סה"כ ערך רכיבים:</span>
                  <span className="text-sm font-semibold">₪{componentsTotal.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-sm text-gray-500 mb-2">אין רכיבים ב-Bundle</p>
                <button
                  type="button"
                  onClick={() => setShowProductSearch(true)}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  הוסף מוצר ראשון
                </button>
              </div>
            )}
          </div>

          {/* Display Settings */}
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">הגדרות תצוגה</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showComponentsOnPage}
                  onChange={(e) => setShowComponentsOnPage(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-600">הצג רכיבים בעמוד מוצר</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showComponentsInCart}
                  onChange={(e) => setShowComponentsInCart(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-600">הצג רכיבים בסל קניות</span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || components.length === 0}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  שומר...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  שמור הגדרות Bundle
                </>
              )}
            </button>
            {priceInfo && priceInfo.savings > 0 && (
              <p className="text-xs text-center text-green-600 mt-2">
                💰 הלקוחות חוסכים ₪{priceInfo.savings.toFixed(2)} ({priceInfo.savingsPercentage}%)
              </p>
            )}
          </div>
        </div>
      )}
      
      {!isBundle && (
        <div className="p-4">
          <p className="text-xs text-gray-500">
            הפוך מוצר זה ל-Bundle כדי לשלב מספר מוצרים במחיר אחד. 
            כשלקוח רוכש Bundle, המלאי יורד מכל הרכיבים.
          </p>
        </div>
      )}
    </div>
  );
}

