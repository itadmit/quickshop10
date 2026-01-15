/**
 * Payment Form Skeleton
 * Shows while payment form (Hosted Fields) is loading
 * Fixed height to prevent CLS (Cumulative Layout Shift)
 */

export function PaymentFormSkeleton() {
  return (
    <div 
      className="space-y-4 animate-pulse" 
      style={{ minHeight: '320px' }}
      aria-label="טוען טופס תשלום..."
    >
      {/* Card Number */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-12 bg-gray-100 border border-gray-200 rounded-lg" />
      </div>
      
      {/* Expiry + CVV row */}
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-12 bg-gray-100 border border-gray-200 rounded-lg" />
        </div>
        <div className="w-24 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-12" />
          <div className="h-12 bg-gray-100 border border-gray-200 rounded-lg" />
        </div>
      </div>
      
      {/* Social ID */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-20" />
        <div className="h-12 bg-gray-100 border border-gray-200 rounded-lg" />
      </div>
      
      {/* Installments */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-12 bg-gray-100 border border-gray-200 rounded-lg" />
      </div>
      
      {/* Submit Button */}
      <div className="h-14 bg-blue-200 rounded-lg mt-6" />
    </div>
  );
}

/**
 * Inline Payment Loading Indicator
 * Shows during payment processing
 */
export function PaymentProcessingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full" />
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">מעבד תשלום</h3>
        <p className="text-sm text-gray-500">אנא המתן, התשלום בטיפול...</p>
      </div>
    </div>
  );
}

