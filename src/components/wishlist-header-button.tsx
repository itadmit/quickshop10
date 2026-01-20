'use client';

import Link from 'next/link';
import { useWishlistOptional } from './wishlist-provider';

interface WishlistHeaderButtonProps {
  basePath: string;
}

export function WishlistHeaderButton({ basePath }: WishlistHeaderButtonProps) {
  const wishlist = useWishlistOptional();
  const count = wishlist?.count ?? 0;

  return (
    <Link
      href={`${basePath}/wishlist`}
      className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      aria-label={`רשימת משאלות${count > 0 ? ` (${count})` : ''}`}
    >
      <svg
        className="w-6 h-6"
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
      
      {/* Badge with count */}
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

