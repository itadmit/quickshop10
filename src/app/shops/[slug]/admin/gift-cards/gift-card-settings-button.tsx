'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { GiftCardSettingsModal } from './settings/gift-card-settings-modal';
import type { GiftCardSettings } from './settings/types';

interface GiftCardSettingsButtonProps {
  storeId: string;
  storeSlug: string;
  initialSettings: GiftCardSettings;
}

export function GiftCardSettingsButton({
  storeId,
  storeSlug,
  initialSettings,
}: GiftCardSettingsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        <Settings className="w-4 h-4" />
        הגדרות
      </button>

      <GiftCardSettingsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        storeId={storeId}
        storeSlug={storeSlug}
        initialSettings={initialSettings}
      />
    </>
  );
}

