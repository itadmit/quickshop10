'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateShippingSettings } from './actions';

interface ShippingRate {
  id: string;
  name: string;
  price: number;
  freeAbove: number | null;
  estimatedDays: string;
}

interface ShippingSettingsFormProps {
  storeId: string;
  settings: Record<string, unknown>;
}

export function ShippingSettingsForm({ storeId, settings }: ShippingSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const defaultRates: ShippingRate[] = [
    { id: '1', name: 'משלוח רגיל', price: 29, freeAbove: 200, estimatedDays: '3-5 ימי עסקים' },
  ];

  const [rates, setRates] = useState<ShippingRate[]>(
    (settings.rates as ShippingRate[]) || defaultRates
  );
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    (settings.freeShippingThreshold as number) || 200
  );
  const [enableFreeShipping, setEnableFreeShipping] = useState(
    (settings.enableFreeShipping as boolean) ?? true
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);

    startTransition(async () => {
      const result = await updateShippingSettings(storeId, {
        rates,
        freeShippingThreshold,
        enableFreeShipping,
      });
      if (result.success) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  const addRate = () => {
    setRates([
      ...rates,
      {
        id: Date.now().toString(),
        name: '',
        price: 0,
        freeAbove: null,
        estimatedDays: '',
      },
    ]);
  };

  const removeRate = (id: string) => {
    if (rates.length > 1) {
      setRates(rates.filter(r => r.id !== id));
    }
  };

  const updateRate = (id: string, field: keyof ShippingRate, value: string | number | null) => {
    setRates(rates.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Free Shipping */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">משלוח חינם</h2>
            <p className="text-sm text-gray-500">הצע משלוח חינם מעל סכום מסוים</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enableFreeShipping}
              onChange={(e) => setEnableFreeShipping(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
          </label>
        </div>

        {enableFreeShipping && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              משלוח חינם בהזמנות מעל
            </label>
            <div className="relative w-40">
              <input
                type="number"
                min="0"
                step="1"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₪</span>
            </div>
          </div>
        )}
      </div>

      {/* Shipping Rates */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">תעריפי משלוח</h2>
          <button
            type="button"
            onClick={addRate}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            + הוסף תעריף
          </button>
        </div>

        <div className="space-y-4">
          {rates.map((rate, index) => (
            <div
              key={rate.id}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">תעריף {index + 1}</h3>
                {rates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRate(rate.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם *
                  </label>
                  <input
                    type="text"
                    required
                    value={rate.name}
                    onChange={(e) => updateRate(rate.id, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                    placeholder="משלוח רגיל"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מחיר *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={rate.price}
                      onChange={(e) => updateRate(rate.id, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                      placeholder="29"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₪</span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    זמן משלוח משוער
                  </label>
                  <input
                    type="text"
                    value={rate.estimatedDays}
                    onChange={(e) => updateRate(rate.id, 'estimatedDays', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                    placeholder="3-5 ימי עסקים"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">טיפים</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• משלוח חינם הוא דרך מצוינת להגדיל את סכום ההזמנה הממוצע</li>
          <li>• ציין זמני משלוח ריאליסטיים כדי לבנות אמון</li>
          <li>• אפשר להציע מספר אפשרויות משלוח (רגיל, מהיר, איסוף עצמי)</li>
        </ul>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isPending ? 'שומר...' : 'שמור שינויים'}
        </button>
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            נשמר בהצלחה
          </span>
        )}
      </div>
    </form>
  );
}


