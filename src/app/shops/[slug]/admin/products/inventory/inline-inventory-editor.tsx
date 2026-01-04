'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateInventory } from './actions';

interface InlineInventoryEditorProps {
  itemId: string;
  currentInventory: number;
  isVariant: boolean;
  lowStockThreshold?: number;
}

export function InlineInventoryEditor({ 
  itemId, 
  currentInventory, 
  isVariant,
  lowStockThreshold = 5 
}: InlineInventoryEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentInventory.toString());
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset value when currentInventory changes
  useEffect(() => {
    setValue(currentInventory.toString());
  }, [currentInventory]);

  const handleSubmit = () => {
    const newInventory = parseInt(value);
    if (isNaN(newInventory) || newInventory < 0 || newInventory === currentInventory) {
      setValue(currentInventory.toString());
      setIsEditing(false);
      return;
    }

    startTransition(async () => {
      await updateInventory(itemId, newInventory, isVariant);
      setIsEditing(false);
      router.refresh();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setValue(currentInventory.toString());
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    // Small delay to allow click on buttons
    setTimeout(() => {
      if (isEditing && !isPending) {
        handleSubmit();
      }
    }, 150);
  };

  // Determine color based on inventory level
  const getColorClass = (inv: number) => {
    if (inv === 0) return 'text-red-600 bg-red-50';
    if (inv <= lowStockThreshold) return 'text-amber-600 bg-amber-50';
    return 'text-gray-900 bg-gray-50';
  };

  if (isEditing) {
    return (
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => setValue(String(Math.max(0, parseInt(value || '0') - 1)))}
          className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold transition-colors"
          disabled={isPending}
        >
          -
        </button>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            setValue(val);
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isPending}
          className="w-16 h-8 text-center text-sm font-medium border border-gray-300 rounded focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
        />
        <button
          type="button"
          onClick={() => setValue(String(parseInt(value || '0') + 1))}
          className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold transition-colors"
          disabled={isPending}
        >
          +
        </button>
        {isPending && (
          <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={`px-3 py-1.5 rounded-lg font-medium text-sm hover:ring-2 hover:ring-black/10 transition-all cursor-pointer ${getColorClass(currentInventory)}`}
      title="לחץ לעריכה"
    >
      {currentInventory}
    </button>
  );
}

