'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTaxRate } from './actions';

interface TaxRateFormProps {
  storeId: string;
  slug: string;
}

export function TaxRateForm({ storeId, slug }: TaxRateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [rate, setRate] = useState('18');
  const [country, setCountry] = useState('IL');
  const [region, setRegion] = useState('');
  const [includeInPrice, setIncludeInPrice] = useState(true);
  const [applyToShipping, setApplyToShipping] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !rate) return;

    startTransition(async () => {
      const result = await createTaxRate(storeId, slug, {
        name,
        rate,
        country: country || null,
        region: region || null,
        includeInPrice,
        applyToShipping,
        isDefault,
      });

      if (result.success) {
        setName('');
        setRate('18');
        setCountry('IL');
        setRegion('');
        setIncludeInPrice(true);
        setApplyToShipping(false);
        setIsDefault(false);
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
            placeholder="מע״מ ישראל"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שיעור (%)</label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
            placeholder="18"
            min="0"
            max="100"
            step="0.001"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">מדינה</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          >
            <option value="">כל המדינות</option>
            <option value="IL">ישראל</option>
            <option value="US">ארה״ב</option>
            <option value="GB">בריטניה</option>
            <option value="DE">גרמניה</option>
            <option value="FR">צרפת</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">אזור</label>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
            placeholder="אופציונלי"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeInPrice}
            onChange={(e) => setIncludeInPrice(e.target.checked)}
            className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
          />
          <span className="text-sm">כלול במחיר המוצר</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={applyToShipping}
            onChange={(e) => setApplyToShipping(e.target.checked)}
            className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
          />
          <span className="text-sm">החל על משלוח</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
          />
          <span className="text-sm">ברירת מחדל</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending || !name || !rate}
        className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
      >
        {isPending ? 'מוסיף...' : 'הוסף שיעור מס'}
      </button>
    </form>
  );
}


