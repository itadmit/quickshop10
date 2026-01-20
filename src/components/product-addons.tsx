'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@/lib/format-price';

export interface AddonOption {
  label: string;
  value: string;
  priceAdjustment: number;
}

export interface ProductAddon {
  id: string;
  name: string;
  fieldType: 'text' | 'select' | 'checkbox' | 'radio' | 'date';
  placeholder?: string | null;
  options: AddonOption[];
  priceAdjustment: number;
  isRequired: boolean;
  maxLength?: number | null;
}

export interface SelectedAddon {
  addonId: string;
  name: string;
  value: string;
  displayValue: string;
  priceAdjustment: number;
}

interface ProductAddonsProps {
  addons: ProductAddon[];
  onChange: (selectedAddons: SelectedAddon[], totalAddonPrice: number) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export function ProductAddons({ addons, onChange, onValidationChange }: ProductAddonsProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Calculate selected addons and total price
  const calculateAddons = useCallback((currentValues: Record<string, string>) => {
    const selectedAddons: SelectedAddon[] = [];
    let total = 0;

    for (const addon of addons) {
      const value = currentValues[addon.id];
      
      if (!value) continue;

      if (addon.fieldType === 'checkbox') {
        if (value === 'true') {
          selectedAddons.push({
            addonId: addon.id,
            name: addon.name,
            value: 'true',
            displayValue: 'כן',
            priceAdjustment: addon.priceAdjustment,
          });
          total += addon.priceAdjustment;
        }
      } else if (addon.fieldType === 'select' || addon.fieldType === 'radio') {
        const option = addon.options.find(o => o.value === value);
        if (option) {
          selectedAddons.push({
            addonId: addon.id,
            name: addon.name,
            value: option.value,
            displayValue: option.label,
            priceAdjustment: option.priceAdjustment,
          });
          total += option.priceAdjustment;
        }
      } else if (addon.fieldType === 'text' || addon.fieldType === 'date') {
        if (value.trim()) {
          selectedAddons.push({
            addonId: addon.id,
            name: addon.name,
            value: value.trim(),
            displayValue: value.trim(),
            priceAdjustment: addon.priceAdjustment,
          });
          total += addon.priceAdjustment;
        }
      }
    }

    return { selectedAddons, total };
  }, [addons]);

  // Validate required fields
  const validateAddons = useCallback((currentValues: Record<string, string>) => {
    for (const addon of addons) {
      if (!addon.isRequired) continue;
      
      const value = currentValues[addon.id];
      
      if (addon.fieldType === 'checkbox') {
        // Checkbox required means it must be checked
        if (value !== 'true') return false;
      } else if (!value?.trim()) {
        return false;
      }
    }
    return true;
  }, [addons]);

  // Update parent when values change
  useEffect(() => {
    const { selectedAddons, total } = calculateAddons(values);
    onChange(selectedAddons, total);
    
    if (onValidationChange) {
      onValidationChange(validateAddons(values));
    }
  }, [values, calculateAddons, validateAddons, onChange, onValidationChange]);

  const handleChange = (addonId: string, value: string) => {
    setValues(prev => ({ ...prev, [addonId]: value }));
    setTouched(prev => ({ ...prev, [addonId]: true }));
  };

  const getError = (addon: ProductAddon) => {
    if (!addon.isRequired || !touched[addon.id]) return null;
    
    const value = values[addon.id];
    
    if (addon.fieldType === 'checkbox') {
      if (value !== 'true') return 'שדה חובה';
    } else if (!value?.trim()) {
      return 'שדה חובה';
    }
    
    return null;
  };

  if (addons.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-medium text-gray-700">תוספות</h3>
      
      {addons.map(addon => {
        const error = getError(addon);
        const value = values[addon.id] || '';
        
        return (
          <div key={addon.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-900">
                {addon.name}
                {addon.isRequired && <span className="text-red-500 mr-1">*</span>}
              </label>
              {(addon.fieldType === 'text' || addon.fieldType === 'date' || addon.fieldType === 'checkbox') && addon.priceAdjustment > 0 && (
                <span className="text-sm text-green-600 font-medium">+{formatPrice(addon.priceAdjustment)}</span>
              )}
            </div>

            {/* Text Input */}
            {addon.fieldType === 'text' && (
              <input
                type="text"
                value={value}
                onChange={(e) => handleChange(addon.id, e.target.value)}
                placeholder={addon.placeholder || ''}
                maxLength={addon.maxLength || undefined}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            )}

            {/* Date Input */}
            {addon.fieldType === 'date' && (
              <input
                type="date"
                value={value}
                onChange={(e) => handleChange(addon.id, e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            )}

            {/* Checkbox */}
            {addon.fieldType === 'checkbox' && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value === 'true'}
                  onChange={(e) => handleChange(addon.id, e.target.checked ? 'true' : '')}
                  className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm text-gray-700">
                  {addon.placeholder || 'כן, הוסף'}
                </span>
              </label>
            )}

            {/* Select Dropdown */}
            {addon.fieldType === 'select' && (
              <select
                value={value}
                onChange={(e) => handleChange(addon.id, e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">בחר...</option>
                {addon.options.map((option, optIdx) => (
                  <option key={`${addon.id}-${optIdx}`} value={option.value}>
                    {option.label}
                    {option.priceAdjustment > 0 && ` (+${formatPrice(option.priceAdjustment)})`}
                  </option>
                ))}
              </select>
            )}

            {/* Radio Buttons */}
            {addon.fieldType === 'radio' && (
              <div className="space-y-2">
                {addon.options.map((option, optIdx) => (
                  <label key={`${addon.id}-${optIdx}`} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`addon-${addon.id}`}
                      value={option.value}
                      checked={value === option.value}
                      onChange={(e) => handleChange(addon.id, e.target.value)}
                      className="w-4 h-4 border-gray-300 text-black focus:ring-black"
                    />
                    <span className="text-sm text-gray-700">
                      {option.label}
                      {option.priceAdjustment > 0 && (
                        <span className="text-green-600 mr-2">(+{formatPrice(option.priceAdjustment)})</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* Error Message */}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            
            {/* Max Length Indicator for text */}
            {addon.fieldType === 'text' && addon.maxLength && (
              <p className="mt-1 text-xs text-gray-400 text-left" dir="ltr">
                {value.length}/{addon.maxLength}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

