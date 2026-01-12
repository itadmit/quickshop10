'use client';

import { useState, useEffect } from 'react';
import { trackShipment, type TrackingResult } from './actions';

interface TrackingFormProps {
  storeId: string;
  storeSlug: string;
  initialOrderNumber?: string;
  initialTrackingNumber?: string;
  primaryColor: string;
}

export function TrackingForm({ 
  storeId, 
  storeSlug,
  initialOrderNumber, 
  initialTrackingNumber,
  primaryColor 
}: TrackingFormProps) {
  const [searchType, setSearchType] = useState<'order' | 'tracking'>(
    initialTrackingNumber ? 'tracking' : 'order'
  );
  const [inputValue, setInputValue] = useState(initialOrderNumber || initialTrackingNumber || '');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-search if initial values provided
  useEffect(() => {
    if (initialOrderNumber || initialTrackingNumber) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    if (!inputValue.trim()) {
      setError('נא להזין מספר הזמנה או מספר מעקב');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const trackingResult = await trackShipment({
        storeId,
        orderNumber: searchType === 'order' ? inputValue.trim() : undefined,
        trackingNumber: searchType === 'tracking' ? inputValue.trim() : undefined,
      });

      if (!trackingResult.success) {
        setError(trackingResult.error || 'לא נמצא משלוח');
      } else {
        setResult(trackingResult);
      }
    } catch (err) {
      setError('אירעה שגיאה בחיפוש');
      console.error('Tracking error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'created':
        return { label: 'נוצר', color: 'bg-blue-100 text-blue-700', icon: '📦' };
      case 'picked_up':
        return { label: 'נאסף', color: 'bg-purple-100 text-purple-700', icon: '🚚' };
      case 'in_transit':
        return { label: 'בדרך', color: 'bg-yellow-100 text-yellow-700', icon: '🚛' };
      case 'out_for_delivery':
        return { label: 'יוצא לחלוקה', color: 'bg-orange-100 text-orange-700', icon: '📬' };
      case 'delivered':
        return { label: 'נמסר', color: 'bg-green-100 text-green-700', icon: '✅' };
      case 'returned':
        return { label: 'הוחזר', color: 'bg-red-100 text-red-700', icon: '↩️' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700', icon: '📦' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Type Toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          type="button"
          onClick={() => {
            setSearchType('order');
            setInputValue('');
            setResult(null);
            setError(null);
          }}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all cursor-pointer ${
            searchType === 'order'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          מספר הזמנה
        </button>
        <button
          type="button"
          onClick={() => {
            setSearchType('tracking');
            setInputValue('');
            setResult(null);
            setError(null);
          }}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all cursor-pointer ${
            searchType === 'tracking'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          מספר מעקב
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={searchType === 'order' ? 'הזינו מספר הזמנה...' : 'הזינו מספר מעקב...'}
          className="w-full px-4 py-3 pr-12 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
          style={{ 
            '--tw-ring-color': primaryColor,
          } as React.CSSProperties}
          dir="ltr"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
      </div>

      {/* Search Button */}
      <button
        type="button"
        onClick={handleSearch}
        disabled={isLoading}
        className="w-full py-3 px-6 text-white font-medium rounded-xl transition-all disabled:opacity-50 cursor-pointer"
        style={{ backgroundColor: primaryColor }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            מחפש...
          </span>
        ) : 'חפש משלוח'}
      </button>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && result.success && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Status Header */}
          <div className="p-6 border-b border-gray-100" style={{ backgroundColor: `${primaryColor}08` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">סטטוס משלוח</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getStatusInfo(result.status || 'created').icon}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusInfo(result.status || 'created').color}`}>
                    {result.statusDescription || getStatusInfo(result.status || 'created').label}
                  </span>
                </div>
              </div>
              {result.trackingNumber && (
                <div className="text-left">
                  <p className="text-xs text-gray-500 mb-1">מספר מעקב</p>
                  <p className="font-mono font-medium text-gray-900">{result.trackingNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            {result.orderNumber && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">מספר הזמנה</span>
                <span className="font-medium">#{result.orderNumber}</span>
              </div>
            )}
            
            {result.provider && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">חברת משלוחים</span>
                <span className="font-medium">{result.provider === 'focus' ? 'Focus Delivery' : result.provider}</span>
              </div>
            )}

            {result.estimatedDelivery && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">מועד משוער</span>
                <span className="font-medium">
                  {new Date(result.estimatedDelivery).toLocaleDateString('he-IL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </span>
              </div>
            )}

            {result.lastUpdate && (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500">עדכון אחרון</span>
                <span className="text-sm text-gray-600">
                  {new Date(result.lastUpdate).toLocaleDateString('he-IL', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Tracking Events */}
          {result.events && result.events.length > 0 && (
            <div className="border-t border-gray-100">
              <div className="p-4 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900">היסטוריית משלוח</h3>
              </div>
              <div className="p-4 space-y-4">
                {result.events.map((event, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="relative">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: index === 0 ? primaryColor : '#d1d5db' }}
                      />
                      {index < result.events!.length - 1 && (
                        <div className="absolute top-3 right-1 w-0.5 h-full bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-gray-900">{event.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(event.timestamp).toLocaleDateString('he-IL', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {event.location && ` • ${event.location}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

