'use client';

/**
 * Shipping Providers Manager
 * Client Component - only for interactivity (toggle, configure)
 * Follows REQUIREMENTS.md: minimal client-side JS
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ShippingProviderInfo, ShippingProviderType } from '@/lib/shipping/types';
import type { shippingProviders } from '@/lib/db/schema';
import { ShippingProviderConfigModal } from './provider-config-modal';
import { Package, MapPin, RotateCcw, Truck, Clock, CreditCard } from 'lucide-react';

// Type for configured provider from database
type ShippingProvider = typeof shippingProviders.$inferSelect;

interface ShippingProvidersManagerProps {
  storeId: string;
  storeSlug: string;
  configuredProviders: ShippingProvider[];
  availableProviders: ShippingProviderInfo[];
}

export function ShippingProvidersManager({
  storeId,
  storeSlug,
  configuredProviders,
  availableProviders,
}: ShippingProvidersManagerProps) {
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = useState<ShippingProviderInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Get configured provider by type
  const getConfiguredProvider = (type: ShippingProviderType): ShippingProvider | undefined => {
    return configuredProviders.find(p => p.provider === type);
  };

  // Toggle provider active status
  const handleToggleActive = async (provider: ShippingProvider) => {
    setIsLoading(provider.id);
    try {
      const response = await fetch(`/api/shops/${storeSlug}/settings/shipping/${provider.provider}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !provider.isActive }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to toggle provider:', error);
    } finally {
      setIsLoading(null);
    }
  };

  // Set as default provider
  const handleSetDefault = async (provider: ShippingProvider) => {
    setIsLoading(provider.id);
    try {
      const response = await fetch(`/api/shops/${storeSlug}/settings/shipping/${provider.provider}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to set default:', error);
    } finally {
      setIsLoading(null);
    }
  };

  // Open config modal
  const handleConfigureProvider = (providerInfo: ShippingProviderInfo) => {
    setSelectedProvider(providerInfo);
    setIsModalOpen(true);
  };

  // Provider logo/icon colors
  const getProviderStyles = (type: ShippingProviderType) => {
    const styles: Record<ShippingProviderType, { bg: string; text: string }> = {
      focus: { bg: 'bg-blue-100', text: 'text-blue-600' },
      cheetah: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
      hfd: { bg: 'bg-green-100', text: 'text-green-600' },
      boxit: { bg: 'bg-purple-100', text: 'text-purple-600' },
      baldar: { bg: 'bg-orange-100', text: 'text-orange-600' },
      manual: { bg: 'bg-gray-100', text: 'text-gray-600' },
    };
    return styles[type] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  };

  return (
    <div className="space-y-4">
      {/* Providers List */}
      {availableProviders.map((providerInfo) => {
        const configured = getConfiguredProvider(providerInfo.type);
        const isActive = configured?.isActive || false;
        const isDefault = configured?.isDefault || false;
        const styles = getProviderStyles(providerInfo.type);

        return (
          <div
            key={providerInfo.type}
            className={`
              relative bg-white border rounded-xl p-5 transition-all
              ${isActive ? 'border-green-500 shadow-sm' : 'border-gray-200'}
            `}
          >
            <div className="flex items-start justify-between">
              {/* Provider Info */}
              <div className="flex items-start gap-4">
                {/* Logo placeholder */}
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold
                  ${styles.bg} ${styles.text}
                `}>
                  <Truck className="w-6 h-6" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{providerInfo.nameHe}</h3>
                    {isDefault && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        ברירת מחדל
                      </span>
                    )}
                    {isActive && !isDefault && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        פעיל
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{providerInfo.descriptionHe}</p>
                  
                  {/* Supported Features */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {providerInfo.supportedFeatures.tracking && (
                      <FeatureBadge icon={<Package className="w-3 h-3" />} label="מעקב" />
                    )}
                    {providerInfo.supportedFeatures.labels && (
                      <FeatureBadge icon={<Package className="w-3 h-3" />} label="מדבקות" />
                    )}
                    {providerInfo.supportedFeatures.pickupPoints && (
                      <FeatureBadge icon={<MapPin className="w-3 h-3" />} label="נקודות איסוף" />
                    )}
                    {providerInfo.supportedFeatures.cod && (
                      <FeatureBadge icon={<CreditCard className="w-3 h-3" />} label="תשלום במסירה" />
                    )}
                    {providerInfo.supportedFeatures.returns && (
                      <FeatureBadge icon={<RotateCcw className="w-3 h-3" />} label="החזרות" />
                    )}
                    {providerInfo.supportedFeatures.scheduling && (
                      <FeatureBadge icon={<Clock className="w-3 h-3" />} label="תזמון" />
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {configured ? (
                  <>
                    {/* Toggle Active */}
                    <button
                      onClick={() => handleToggleActive(configured)}
                      disabled={isLoading === configured.id}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0
                        ${isActive ? 'bg-green-500' : 'bg-gray-200'}
                        ${isLoading === configured.id ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      dir="ltr"
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                          ${isActive ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>

                    {/* Config Button */}
                    <button
                      onClick={() => handleConfigureProvider(providerInfo)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="הגדרות"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>

                    {/* Set Default */}
                    {isActive && !isDefault && (
                      <button
                        onClick={() => handleSetDefault(configured)}
                        disabled={isLoading === configured.id}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        הגדר כברירת מחדל
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => handleConfigureProvider(providerInfo)}
                    className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    הגדר
                  </button>
                )}
              </div>
            </div>

            {/* Test Mode Indicator */}
            {configured?.testMode && isActive && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">מצב בדיקות פעיל</span>
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  משלוחים לא יישלחו באמת. החלף למצב Production למשלוחים אמיתיים.
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* No Default Warning */}
      {configuredProviders.length > 0 && !configuredProviders.some(p => p.isDefault && p.isActive) && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
          <div className="flex items-center gap-2 text-amber-700">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">לא הוגדר ספק משלוחים ברירת מחדל</span>
          </div>
          <p className="text-sm text-amber-600 mt-1">
            הפעל לפחות ספק משלוחים אחד והגדר אותו כברירת מחדל כדי ליצור משלוחים אוטומטית.
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 טיפים</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• חבר את חברת המשלוחים שלך ליצירת משלוחים אוטומטית</li>
          <li>• קבל מספר מעקב ומדבקות ישירות מתוך QuickShop</li>
          <li>• לקוחות יקבלו עדכונים אוטומטיים על סטטוס המשלוח</li>
          <li>• השתמש במצב בדיקות לפני חיבור לסביבת Production</li>
        </ul>
      </div>

      {/* Config Modal */}
      {selectedProvider && (
        <ShippingProviderConfigModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProvider(null);
          }}
          providerInfo={selectedProvider}
          existingConfig={getConfiguredProvider(selectedProvider.type)}
          storeSlug={storeSlug}
        />
      )}
    </div>
  );
}

function FeatureBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
      {icon}
      {label}
    </span>
  );
}

