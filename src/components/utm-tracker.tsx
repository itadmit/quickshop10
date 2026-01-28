/**
 * UTM Tracking Utilities
 * Saves UTM parameters from URL to localStorage when user arrives
 * These are later used when creating an order to track traffic sources
 * 
 * NOTE: UTM capture is integrated into TrackingProvider for better performance
 */

const UTM_STORAGE_KEY = 'quickshop_utm';
const UTM_EXPIRY_HOURS = 24 * 7; // 7 days

export interface UTMData {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  timestamp: number;
}

// Save UTM data to localStorage
export function saveUTMData(data: Partial<UTMData>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = getUTMData();
    const newData: UTMData = {
      source: data.source || existing?.source || null,
      medium: data.medium || existing?.medium || null,
      campaign: data.campaign || existing?.campaign || null,
      content: data.content || existing?.content || null,
      term: data.term || existing?.term || null,
      timestamp: Date.now(),
    };
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(newData));
  } catch {
    // Ignore storage errors
  }
}

// Get UTM data from localStorage (returns null if expired)
export function getUTMData(): UTMData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    if (!stored) return null;
    
    const data: UTMData = JSON.parse(stored);
    
    // Check expiry
    const expiryMs = UTM_EXPIRY_HOURS * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > expiryMs) {
      localStorage.removeItem(UTM_STORAGE_KEY);
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

// Clear UTM data (call after order is placed)
export function clearUTMData(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(UTM_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

// Get UTM source for order (main field used in reports)
export function getUTMSource(): string | null {
  const data = getUTMData();
  return data?.source || null;
}

