/**
 * Admin Dashboard Loading State
 * Shows skeleton UI while dashboard loads
 * 
 * Performance: 
 * - Pure Server Component (no JS)
 * - Minimal HTML (~1KB)
 * - Instant display (no hydration)
 */

export default function AdminLoading() {
  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header skeleton */}
      <div className="h-16 border-b bg-white/80 backdrop-blur-sm flex items-center px-6 gap-4">
        <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" />
        <div className="flex-1" />
        <div className="w-32 h-8 rounded-lg bg-gray-200 animate-pulse" />
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 p-6 space-y-6">
        {/* Page title skeleton */}
        <div className="flex items-center justify-between">
          <div className="w-48 h-8 rounded-lg bg-gray-200 animate-pulse" />
          <div className="w-32 h-10 rounded-lg bg-gray-200 animate-pulse" />
        </div>
        
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className="bg-white rounded-xl border p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-24 h-4 rounded bg-gray-200 animate-pulse" />
                <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
              </div>
              <div className="w-20 h-8 rounded bg-gray-200 animate-pulse" />
              <div className="w-16 h-3 rounded bg-gray-100 animate-pulse" />
            </div>
          ))}
        </div>
        
        {/* Table skeleton */}
        <div className="bg-white rounded-xl border overflow-hidden">
          {/* Table header */}
          <div className="border-b bg-gray-50 px-5 py-3 flex gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i}
                className="w-24 h-4 rounded bg-gray-200 animate-pulse"
                style={{ width: i === 1 ? '8rem' : i === 2 ? '12rem' : '6rem' }}
              />
            ))}
          </div>
          
          {/* Table rows */}
          {[1, 2, 3, 4, 5].map((row) => (
            <div 
              key={row}
              className="border-b last:border-0 px-5 py-4 flex gap-4 items-center"
            >
              <div className="w-32 h-4 rounded bg-gray-200 animate-pulse" />
              <div className="w-48 h-4 rounded bg-gray-200 animate-pulse" />
              <div className="w-24 h-4 rounded bg-gray-200 animate-pulse" />
              <div className="w-20 h-6 rounded-full bg-gray-200 animate-pulse" />
              <div className="w-24 h-4 rounded bg-gray-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Loading indicator at bottom */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-full px-5 py-2.5 flex items-center gap-3 border">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
        <span className="text-sm text-gray-600 font-medium">טוען...</span>
      </div>
    </div>
  );
}

