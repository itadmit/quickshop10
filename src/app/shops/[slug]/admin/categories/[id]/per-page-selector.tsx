'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface PerPageSelectorProps {
  currentValue: number;
}

export function PerPageSelector({ currentValue }: PerPageSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('perPage', e.target.value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">הצג:</span>
      <select
        value={currentValue}
        onChange={handleChange}
        className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
      >
        <option value="20">20</option>
        <option value="50">50</option>
        <option value="100">100</option>
        <option value="200">200</option>
      </select>
    </div>
  );
}

