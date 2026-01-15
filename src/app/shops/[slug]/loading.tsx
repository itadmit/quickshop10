/**
 * Shop Loading State
 * Minimal spinner while shop pages load
 */

export default function ShopLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50" dir="rtl">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
        <span className="text-sm text-gray-500 font-medium">טוען...</span>
      </div>
    </div>
  );
}

