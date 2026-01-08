'use client';

import { useStoreOptional } from '@/lib/store-context';
import Link from 'next/link';
import { tracker } from '@/lib/tracking';

interface CartSidebarProps {
  basePath?: string;
}

export function CartSidebar({ basePath = '' }: CartSidebarProps) {
  const store = useStoreOptional();
  
  // SSR safety - don't render if store context not available
  if (!store) return null;
  
  const { cart, cartOpen, cartTotal, closeCart, removeFromCart, updateQuantity, formatPrice } = store;
  const checkoutUrl = basePath ? `${basePath}/checkout` : '/checkout';

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
        className={`fixed top-0 left-0 h-full w-full max-w-[420px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
          cartOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <h2 className="font-display text-xl tracking-[0.1em] font-light">עגלת קניות</h2>
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
        <div className="flex-1 overflow-y-auto px-8 py-6" style={{ maxHeight: 'calc(100vh - 220px)' }}>
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
              <p className="text-gray-400 text-sm tracking-wide">העגלה שלך ריקה</p>
            </div>
          ) : (
            <ul className="space-y-6">
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
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">{formatPrice(item.price)}</p>
                        {item.automaticDiscountName && (
                          <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                            {item.automaticDiscountName}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
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
                              title={atMax ? 'הגעת למקסימום הזמין' : undefined}
                            >
                              +
                            </button>
                          );
                        })()}
                      </div>
                      <button
                        onClick={() => handleRemove(item)}
                        className="text-[11px] tracking-wide text-gray-400 hover:text-black underline underline-offset-4 transition-colors cursor-pointer"
                      >
                        הסר
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 px-8 py-6 bg-white border-t border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm text-gray-500 tracking-wide">סה״כ</span>
              <span className="text-lg font-display">{formatPrice(cartTotal)}</span>
            </div>
            <Link 
              href={checkoutUrl}
              onClick={closeCart}
              className="btn-primary w-full"
            >
              המשך לתשלום
            </Link>
            <button 
              onClick={closeCart}
              className="w-full mt-3 text-[11px] tracking-[0.15em] uppercase text-gray-500 hover:text-black underline underline-offset-4 transition-colors py-2 cursor-pointer"
            >
              המשך בקניות
            </button>
          </div>
        )}
      </div>
    </>
  );
}
