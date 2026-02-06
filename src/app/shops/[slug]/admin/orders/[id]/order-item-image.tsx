'use client';

import { useState, type ReactNode } from 'react';

interface Addon {
  name: string;
  value?: string;
  displayValue?: string;
  priceAdjustment: number;
}

interface OrderItemImageProps {
  imageUrl: string | null;
  name: string;
  variantTitle?: string | null;
  sku?: string | null;
  addons?: Addon[];
  /** Regular ReactNode children rendered after the name/variant/sku/addons */
  children?: ReactNode;
}

export function OrderItemImage({ imageUrl, name, variantTitle, sku, addons, children }: OrderItemImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasImage = !!imageUrl;

  return (
    <>
      {/* Thumbnail with magnify icon on hover */}
      {hasImage ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 bg-gray-50 rounded-lg shrink-0 overflow-hidden border border-gray-100 relative group cursor-pointer"
        >
          <img 
            src={imageUrl} 
            alt={name} 
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
            <svg 
              width="18" height="18" viewBox="0 0 24 24" 
              fill="none" stroke="white" strokeWidth="2" 
              strokeLinecap="round" strokeLinejoin="round"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-md"
            >
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </div>
        </button>
      ) : (
        <div className="w-12 h-12 bg-gray-50 rounded-lg shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center text-gray-300">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      )}

      {/* Product details */}
      <div className="flex-1 min-w-0">
        {/* Product name - clickable to open lightbox if image exists */}
        {hasImage ? (
          <p onClick={() => setIsOpen(true)} className="text-sm font-medium text-blue-600 hover:underline cursor-pointer truncate sm:whitespace-normal">{name}</p>
        ) : (
          <p className="text-sm font-medium text-gray-900 truncate sm:whitespace-normal">{name}</p>
        )}
        {variantTitle && (
          <p className="text-xs text-gray-500 mt-0.5">{variantTitle}</p>
        )}
        {sku && (
          <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">מק״ט: {sku}</p>
        )}
        {/* Addons display */}
        {addons && addons.length > 0 && (
          <div className="mt-1.5 space-y-0.5 text-xs bg-gray-50 p-1.5 rounded">
            {addons.map((addon, i) => (
              <div key={i} className="flex items-center gap-1 sm:gap-2 text-gray-600 flex-wrap">
                <span>{addon.name}:</span>
                <span className="text-gray-800">{addon.displayValue || addon.value || ''}</span>
                {addon.priceAdjustment > 0 && (
                  <span className="text-green-600">(+₪{addon.priceAdjustment.toFixed(2)})</span>
                )}
              </div>
            ))}
          </div>
        )}
        {/* Any extra server-rendered content */}
        {children}
      </div>

      {/* Lightbox modal */}
      {isOpen && hasImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Image + details container */}
          <div 
            className="relative max-w-2xl max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-3 -left-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10 cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            <img 
              src={imageUrl!} 
              alt={name} 
              className="rounded-xl shadow-2xl max-h-[70vh] object-contain bg-white"
            />
            
            {/* Product name + addons below image */}
            <div className="mt-3 text-center space-y-2">
              <p className="text-sm text-white/90 font-medium drop-shadow">{name}</p>
              {variantTitle && (
                <p className="text-xs text-white/60">{variantTitle}</p>
              )}
              {addons && addons.length > 0 && (
                <div className="inline-flex flex-col gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2.5 mt-1">
                  {addons.map((addon, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/80">
                      <span className="text-white/50">{addon.name}:</span>
                      <span className="text-white font-medium">{addon.displayValue || addon.value || ''}</span>
                      {addon.priceAdjustment > 0 && (
                        <span className="text-emerald-300">(+₪{addon.priceAdjustment.toFixed(2)})</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
