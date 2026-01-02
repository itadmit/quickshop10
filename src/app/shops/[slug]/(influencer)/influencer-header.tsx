import Link from 'next/link';
import { InfluencerLogoutButton } from './logout-button';

interface InfluencerHeaderProps {
  storeName: string;
  storeSlug: string;
  influencer: {
    name: string;
    email: string;
  };
}

export function InfluencerHeader({ storeName, storeSlug, influencer }: InfluencerHeaderProps) {
  return (
    <header className="fixed top-0 right-0 left-0 h-14 bg-white border-b border-gray-200 z-50">
      <div className="h-full flex items-center justify-between px-4">
        {/* Logo / Store Name */}
        <div className="flex items-center gap-3">
          <Link 
            href={`/shops/${storeSlug}/influencer`}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-sm">👑</span>
            </div>
            <span className="font-semibold text-gray-900">{storeName}</span>
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-500">דשבורד משפיענים</span>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4">
          {/* View Store */}
          <Link
            href={`/shops/${storeSlug}`}
            target="_blank"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors hidden sm:flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            צפה בחנות
          </Link>

          {/* User Dropdown */}
          <div className="flex items-center gap-3">
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{influencer.name}</p>
              <p className="text-xs text-gray-500">{influencer.email}</p>
            </div>
            <InfluencerLogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}

