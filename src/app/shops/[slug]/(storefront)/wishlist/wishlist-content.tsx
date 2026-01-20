'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useWishlistOptional } from '@/components/wishlist-provider';
import type { WishlistItem } from '@/lib/actions/wishlist';
import { formatPrice } from '@/lib/format-price';

interface WishlistPageContentProps {
  initialItems: WishlistItem[];
  basePath: string;
  isLoggedIn: boolean;
  storeId: string;
  storeCurrency: string;
}

// localStorage key for guest wishlist
const STORAGE_KEY = 'quickshop_wishlist';

export function WishlistPageContent({ 
  initialItems, 
  basePath, 
  isLoggedIn,
  storeId,
  storeCurrency,
}: WishlistPageContentProps) {
  const wishlist = useWishlistOptional();
  const [guestItems, setGuestItems] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load guest wishlist from localStorage
  useEffect(() => {
    if (!isLoggedIn) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setGuestItems(parsed);
          }
        }
      } catch {
        // Ignore errors
      }
    }
    setIsHydrated(true);
  }, [isLoggedIn]);

  const handleRemove = async (productId: string) => {
    if (wishlist) {
      await wishlist.toggle(productId);
    }
  };

  // If not logged in, show guest experience
  if (!isLoggedIn) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          התחבר לצפייה ברשימת המשאלות
        </h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          {isHydrated && guestItems.length > 0 
            ? `יש לך ${guestItems.length} מוצרים שמורים. התחבר כדי לשמור אותם ולסנכרן בין מכשירים.`
            : 'כדי לשמור מוצרים לרשימת המשאלות ולסנכרן בין מכשירים, צריך להתחבר.'}
        </p>
        
        <div className="flex gap-3 justify-center">
          <Link
            href={`${basePath}/login`}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            התחברות
          </Link>
          <Link
            href={`${basePath}/register`}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            הרשמה
          </Link>
        </div>
      </div>
    );
  }

  // Empty state for logged in users
  if (initialItems.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          רשימת המשאלות ריקה
        </h2>
        <p className="text-gray-500 mb-6">
          לחץ על הלב ליד מוצרים שאהבת כדי להוסיף אותם לרשימה
        </p>
        
        <Link
          href={`${basePath}/products`}
          className="inline-flex px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          לכל המוצרים
        </Link>
      </div>
    );
  }

  // Wishlist grid
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {initialItems.map((item) => (
        <div
          key={item.id}
          className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
        >
          <Link href={`${basePath}/product/${item.productSlug}`}>
            <div className="aspect-square relative bg-gray-100">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.productName}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          </Link>

          <div className="p-4">
            <Link href={`${basePath}/product/${item.productSlug}`}>
              <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-gray-600 transition-colors">
                {item.productName}
              </h3>
              {item.variantTitle && (
                <p className="text-sm text-gray-500 mt-1">{item.variantTitle}</p>
              )}
            </Link>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-semibold text-gray-900">
                {formatPrice(Number(item.price || 0), { currency: storeCurrency })}
              </span>
              {item.comparePrice && Number(item.comparePrice) > Number(item.price || 0) && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(Number(item.comparePrice), { currency: storeCurrency })}
                </span>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <Link
                href={`${basePath}/product/${item.productSlug}`}
                className="flex-1 py-2 px-4 bg-black text-white text-sm text-center rounded-lg hover:bg-gray-800 transition-colors"
              >
                לצפייה במוצר
              </Link>
              <button
                type="button"
                onClick={() => handleRemove(item.productId)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="הסר מרשימת המשאלות"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

