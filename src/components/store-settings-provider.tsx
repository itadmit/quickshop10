'use client';

import { useEffect } from 'react';

interface StoreSettingsProviderProps {
  showDecimalPrices: boolean;
  currency: string;
  children: React.ReactNode;
}

const SETTINGS_KEY = 'quickshop_settings';

/**
 * קומפוננט שמעדכן את הגדרות החנות ב-localStorage
 * כשהגדרות החנות משתנות (מהשרת), הקומפוננט מעדכן את ה-localStorage
 * וה-Context ישתמש בהן
 */
export function StoreSettingsProvider({ 
  showDecimalPrices, 
  currency, 
  children 
}: StoreSettingsProviderProps) {
  useEffect(() => {
    // שמירת ההגדרות ב-localStorage
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      showDecimalPrices,
      currency,
    }));
    
    // Trigger event for any listening components to update
    window.dispatchEvent(new CustomEvent('store-settings-updated', {
      detail: { showDecimalPrices, currency }
    }));
  }, [showDecimalPrices, currency]);

  return <>{children}</>;
}









