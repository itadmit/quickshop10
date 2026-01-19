'use client';

import { useStoreOptional } from '@/lib/store-context';

export function CartButton() {
  const store = useStoreOptional();
  
  // SSR safety - show placeholder if store context not available yet
  if (!store) {
    return (
      <button className="relative group flex items-center gap-3 opacity-50">
        <span className="text-[11px] tracking-[0.2em] uppercase text-gray-600 hidden sm:block">
          עגלה
        </span>
        <div className="relative">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5"
            className="text-gray-800"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
      </button>
    );
  }
  
  const { cartCount, openCart } = store;
  
  return (
    <button 
      onClick={openCart}
      className="relative group flex items-center gap-2 cursor-pointer"
    >
      <span className="text-[11px] tracking-[0.2em] uppercase text-gray-600 group-hover:text-black transition-colors duration-300 hidden sm:block">
        עגלה
      </span>
      <div className="relative w-9 h-9 flex items-center justify-center">
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5"
          className="text-gray-800 group-hover:text-black transition-colors"
        >
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[9px] font-medium rounded-full flex items-center justify-center">
            {cartCount > 99 ? '99' : cartCount}
          </span>
        )}
      </div>
    </button>
  );
}
