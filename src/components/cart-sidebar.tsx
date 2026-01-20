'use client';

import { useStoreOptional } from '@/lib/store-context';
import Link from 'next/link';
import { tracker } from '@/lib/tracking';
import { CartUpsells } from './cart-upsells';
import { CartBundleComponents } from './cart-bundle-components';
import { useCartTranslations, useTranslations, type CartTranslations } from '@/lib/translations/use-translations';
import type { DeepPartial } from '@/lib/translations/types';

interface CartSidebarProps {
  basePath?: string;
  storeSlug?: string;
  freeShippingThreshold?: number; // סף למשלוח חינם (אם הוגדר)
  /** Optional translations - falls back to Hebrew if not provided */
  translations?: DeepPartial<CartTranslations> | null;
}

export function CartSidebar({ basePath = '', storeSlug, freeShippingThreshold, translations }: CartSidebarProps) {
  const store = useStoreOptional();
  
  // 🌍 Translations with Hebrew fallback
  const t = useCartTranslations(translations);
  const { direction } = useTranslations();
  
  // SSR safety - don't render if store context not available
  if (!store) return null;
  
  const { cart, cartOpen, cartTotal, closeCart, removeFromCart, updateQuantity, formatPrice } = store;
  const checkoutUrl = basePath ? `${basePath}/checkout` : '/checkout';
  
  // חישוב כמה נשאר למשלוח חינם
  const remainingForFreeShipping = freeShippingThreshold && freeShippingThreshold > cartTotal 
    ? freeShippingThreshold - cartTotal 
    : 0;
  const freeShippingProgress = freeShippingThreshold 
    ? Math.min(100, (cartTotal / freeShippingThreshold) * 100) 
    : 0;

  // Track remove from cart
  const handleRemove = (item: typeof cart[0]) => {
    tracker.removeFromCart({
      id: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    });
    removeFromCart(item.id);
  };

  // Track quantity update
  const handleUpdateQuantity = (item: typeof cart[0], newQuantity: number) => {
    if (newQuantity === 0) {
      handleRemove(item);
      return;
    }
    tracker.updateCart(item.productId, item.quantity, newQuantity);
    updateQuantity(item.id, newQuantity);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          cartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCart}
      />
      
      {/* Sidebar */}
      <div 
        className={`fixed top-0 h-full w-full max-w-[420px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] flex flex-col ${
          direction === 'rtl' 
            ? `left-0 ${cartOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `right-0 ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`
        }`}
        dir={direction}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 shrink-0">
          <h2 className="font-display text-xl tracking-[0.1em] font-light">{t.title}</h2>
          <button 
            onClick={closeCart}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-black transition-colors cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-8 py-6 min-h-0">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <svg 
                width="64" 
                height="64" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#d1d5db" 
                strokeWidth="0.8"
                className="mx-auto mb-6"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <p className="text-gray-400 text-sm tracking-wide">{t.empty}</p>
            </div>
          ) : (
            <>
            <ul className="space-y-6 mb-4">
              {cart.map(item => (
                <li key={item.id} className="flex gap-5 pb-6 border-b border-gray-100 last:border-0">
                  {/* Product Image */}
                  <div className="w-24 h-28 bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-black mb-1">{item.name}</h3>
                      {item.variantTitle && (
                        <p className="text-xs text-gray-500 mb-1">{item.variantTitle}</p>
                      )}
                      <div className="flex flex-col gap-1">
                        {/* Price - show discounted price if available */}
                        <div className="flex items-center gap-2">
                          {item.discountedPrice ? (
                            <>
                              <p className="text-sm text-green-600 font-medium">{formatPrice(item.discountedPrice)}</p>
                              <p className="text-xs text-gray-400 line-through">{formatPrice(item.price)}</p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">{formatPrice(item.price)}</p>
                          )}
                        </div>
                        
                        {/* Discount Badges - separate badge for each discount */}
                        {item.automaticDiscountName && (
                          <div className="flex flex-wrap gap-1">
                            {item.automaticDiscountName.split(' + ').map((name, i) => (
                              <span key={i} className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Addons Display */}
                        {item.addons && item.addons.length > 0 && (
                          <div className="mt-1.5 space-y-0.5">
                            {item.addons.map((addon, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">{addon.name}: <span className="text-gray-700">{addon.displayValue}</span></span>
                                {addon.priceAdjustment > 0 && (
                                  <span className="text-green-600">+{formatPrice(addon.priceAdjustment)}</span>
                                )}
                              </div>
                            ))}
                            {item.addonTotal && item.addonTotal > 0 && (
                              <div className="text-xs text-gray-400 pt-0.5 border-t border-gray-100">
                                {t.addons}: +{formatPrice(item.addonTotal)}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* 📦 Bundle Components */}
                        {item.isBundle && (
                          <CartBundleComponents productId={item.productId} />
                        )}
                        
                        {/* 🎁 Gift Card Details */}
                        {item.isGiftCard && item.giftCardDetails && (
                          <div className="mt-2 bg-purple-50 border border-purple-100 rounded-md p-2 space-y-1">
                            <div className="flex items-center gap-1 text-xs text-purple-700">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                              </svg>
                              <span className="font-medium">{t.giftCard}</span>
                            </div>
                            <p className="text-[11px] text-purple-600">
                              <span className="text-gray-500">{t.giftCardFor}:</span> {item.giftCardDetails.recipientName}
                            </p>
                            <p className="text-[11px] text-purple-600 dir-ltr text-right">
                              <span className="text-gray-500">{t.giftCardEmail}:</span> {item.giftCardDetails.recipientEmail}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Quantity Controls - Hidden for gift cards */}
                    <div className="flex items-center justify-between mt-3">
                      {item.isGiftCard ? (
                        // Gift cards don't have quantity controls - each is unique
                        <span className="text-xs text-gray-400">×1</span>
                      ) : (
                        <div className="flex items-center border border-gray-200">
                          <button
                            onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black transition-colors cursor-pointer"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          {/* כפתור + עם בדיקת מלאי מקומית ⚡ */}
                          {(() => {
                            const atMax = item.trackInventory && 
                              item.maxQuantity !== null && 
                              item.maxQuantity !== undefined && 
                              item.quantity >= item.maxQuantity;
                            return (
                              <button
                                onClick={() => !atMax && handleUpdateQuantity(item, item.quantity + 1)}
                                disabled={atMax}
                                className={`w-8 h-8 flex items-center justify-center transition-colors cursor-pointer ${
                                  atMax 
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-gray-500 hover:text-black'
                                }`}
                                title={atMax ? t.maxQuantityReached : undefined}
                              >
                                +
                              </button>
                            );
                          })()}
                        </div>
                      )}
                      <button
                        onClick={() => handleRemove(item)}
                        className="text-[11px] tracking-wide text-gray-400 hover:text-black underline underline-offset-4 transition-colors cursor-pointer"
                      >
                        {t.remove}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            {storeSlug && <CartUpsells storeSlug={storeSlug} />}
            </>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="shrink-0 px-8 py-6 bg-white border-t border-gray-100">
            {/* Free Shipping Progress Indicator */}
            {freeShippingThreshold && freeShippingThreshold > 0 && (
              <div className="mb-4">
                {remainingForFreeShipping > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                          <rect x="1" y="6" width="15" height="12" rx="2"/>
                          <path d="M16 16h4l3-3v-3h-7"/>
                          <circle cx="5.5" cy="18.5" r="2.5"/>
                          <circle cx="18.5" cy="18.5" r="2.5"/>
                        </svg>
                        {(() => {
                          const parts = t.freeShippingProgress.split('{{amount}}');
                          return <>{parts[0]}<span className="font-medium text-black">{formatPrice(remainingForFreeShipping)}</span>{parts[1]}</>;
                        })()}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all duration-300"
                        style={{ width: `${freeShippingProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{t.freeShippingReached} 🎉</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm text-gray-500 tracking-wide">{t.total}</span>
              <span className="text-lg font-display">{formatPrice(cartTotal)}</span>
            </div>
            <Link 
              href={checkoutUrl}
              onClick={closeCart}
              className="btn-primary w-full"
            >
              {t.checkout}
            </Link>
            <button 
              onClick={closeCart}
              className="w-full mt-3 text-[11px] tracking-[0.15em] uppercase text-gray-500 hover:text-black underline underline-offset-4 transition-colors py-2 cursor-pointer"
            >
              {t.continueShopping}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
