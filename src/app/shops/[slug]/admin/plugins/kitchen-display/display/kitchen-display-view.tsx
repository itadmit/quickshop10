'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getKitchenOrders, updateOrderStatus, KitchenDisplayConfig, KitchenOrder } from '../actions';
import { OrderCard } from './order-card';
import { SoundAlert } from './sound-alert';
import { 
  Monitor, Bell, BellOff, Maximize, Settings, 
  RefreshCw, PartyPopper, Loader2
} from 'lucide-react';

// ============================================
// Kitchen Display View Component
// Client Component - נדרש עבור polling, timers, audio
// Full screen display with auto-refresh
// ============================================

interface CustomStatus {
  id: string;
  name: string;
  color: string;
}

interface KitchenDisplayViewProps {
  storeId: string;
  storeName: string;
  storeSlug: string;
  config: KitchenDisplayConfig;
  customStatuses: CustomStatus[];
  initialOrders: KitchenOrder[];
}

export function KitchenDisplayView({
  storeId,
  storeName,
  storeSlug,
  config,
  customStatuses,
  initialOrders,
}: KitchenDisplayViewProps) {
  const [orders, setOrders] = useState<KitchenOrder[]>(initialOrders);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(!config.soundEnabled);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [processedOrderIds, setProcessedOrderIds] = useState<Set<string>>(
    new Set(initialOrders.map(o => o.id))
  );
  const [newOrderIds, setNewOrderIds] = useState<string[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const freshOrders = await getKitchenOrders(storeId, config);
      
      // Find new orders
      const newIds = freshOrders
        .filter(o => !processedOrderIds.has(o.id))
        .map(o => o.id);
      
      if (newIds.length > 0) {
        setNewOrderIds(newIds);
        // Add to processed set
        setProcessedOrderIds(prev => {
          const next = new Set(prev);
          newIds.forEach(id => next.add(id));
          return next;
        });
      }
      
      setOrders(freshOrders);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('[Kitchen Display] Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storeId, config, processedOrderIds]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(fetchOrders, config.refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [fetchOrders, config.refreshInterval]);

  // Handle approve
  const handleApprove = useCallback(async (orderId: string) => {
    // Optimistic update - remove from list
    setOrders(prev => prev.filter(o => o.id !== orderId));
    
    const result = await updateOrderStatus(orderId, storeId, 'approve', config);
    
    if (!result.success) {
      // Revert on error
      await fetchOrders();
      alert('שגיאה באישור ההזמנה');
    }
  }, [storeId, config, fetchOrders]);

  // Handle cancel
  const handleCancel = useCallback(async (orderId: string) => {
    if (!confirm('האם לבטל את ההזמנה?')) return;
    
    // Optimistic update - remove from list
    setOrders(prev => prev.filter(o => o.id !== orderId));
    
    const result = await updateOrderStatus(orderId, storeId, 'cancel', config);
    
    if (!result.success) {
      // Revert on error
      await fetchOrders();
      alert('שגיאה בביטול ההזמנה');
    }
  }, [storeId, config, fetchOrders]);

  // Handle print
  const handlePrint = useCallback((orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('לא ניתן לפתוח חלון הדפסה');
      return;
    }

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleString('he-IL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <title>הזמנה #${order.orderNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 10px;
            max-width: 80mm;
            margin: 0 auto;
            font-size: 12px;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .store-name {
            font-size: 18px;
            font-weight: bold;
          }
          .order-number {
            font-size: 16px;
            margin-top: 5px;
          }
          .date {
            color: #666;
            margin-top: 5px;
          }
          .customer {
            border-bottom: 1px dashed #ccc;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .items {
            margin-bottom: 10px;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .item-name {
            flex: 1;
          }
          .item-qty {
            margin-left: 10px;
          }
          .addon {
            padding-right: 15px;
            color: #666;
            font-size: 11px;
          }
          .total {
            border-top: 2px dashed #000;
            padding-top: 10px;
            font-size: 16px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
          }
          .notes {
            margin-top: 10px;
            padding: 8px;
            background: #f5f5f5;
            border-radius: 4px;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="store-name">🏪 ${storeName}</div>
          <div class="order-number">הזמנה #${order.orderNumber}</div>
          <div class="date">${formatDate(order.createdAt)}</div>
        </div>
        
        <div class="customer">
          ${order.customerName ? `<div>👤 ${order.customerName}</div>` : ''}
          ${order.customerPhone ? `<div>📱 ${order.customerPhone}</div>` : ''}
        </div>
        
        <div class="items">
          ${order.items.map(item => `
            <div class="item">
              <span class="item-name">${item.name}</span>
              <span class="item-qty">x${item.quantity}</span>
            </div>
            ${item.addons.map(addon => `<div class="addon">+ ${addon}</div>`).join('')}
            ${item.notes ? `<div class="addon">📝 ${item.notes}</div>` : ''}
          `).join('')}
        </div>
        
        <div class="total">
          <span>סה״כ:</span>
          <span>₪${order.total}</span>
        </div>
        
        ${order.note ? `
          <div class="notes">
            📝 ${order.note}
          </div>
        ` : ''}
        
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }, [orders, storeName]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Handle sound played
  const handleSoundPlayed = useCallback((playedIds: string[]) => {
    setNewOrderIds(prev => prev.filter(id => !playedIds.includes(id)));
  }, []);

  // Card size classes
  const cardSizeClasses = {
    small: 'w-64',
    medium: 'w-80',
    large: 'w-96',
  };

  // Background classes
  const bgClasses = config.darkMode 
    ? 'bg-slate-900 text-white' 
    : 'bg-slate-100 text-slate-900';

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen ${bgClasses}`}
    >
      {/* Sound Alert Component */}
      <SoundAlert
        enabled={config.soundEnabled && !soundMuted}
        volume={config.soundVolume}
        newOrderIds={newOrderIds}
        onPlayed={handleSoundPlayed}
      />

      {/* Header */}
      <header className={`sticky top-0 z-50 px-6 py-4 border-b ${
        config.darkMode 
          ? 'bg-slate-800/95 backdrop-blur border-slate-700' 
          : 'bg-white/95 backdrop-blur border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              config.darkMode ? 'bg-orange-500/20' : 'bg-orange-100'
            }`}>
              <Monitor className={`w-6 h-6 ${config.darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
            </div>
            <div>
              <h1 className="text-xl font-bold">מסך מטבח</h1>
              <p className={`text-sm ${config.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {storeName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Order Count */}
            <div className={`px-4 py-2 rounded-xl font-medium ${
              config.darkMode ? 'bg-slate-700' : 'bg-slate-200'
            }`}>
              <span className="text-2xl font-bold">{orders.length}</span>
              <span className={`text-sm mr-2 ${config.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                הזמנות
              </span>
            </div>

            {/* Last Refresh */}
            <div className={`text-sm flex items-center gap-2 ${config.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>עדכון: {lastRefresh.toLocaleTimeString('he-IL')}</span>
              {isLoading && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundMuted(!soundMuted)}
              className={`p-3 rounded-xl transition-colors ${
                config.darkMode 
                  ? 'hover:bg-slate-700' 
                  : 'hover:bg-slate-200'
              }`}
              title={soundMuted ? 'הפעל התראות' : 'השתק התראות'}
            >
              {soundMuted ? (
                <BellOff className="w-5 h-5" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className={`p-3 rounded-xl transition-colors ${
                config.darkMode 
                  ? 'hover:bg-slate-700' 
                  : 'hover:bg-slate-200'
              }`}
              title={isFullscreen ? 'צא ממסך מלא' : 'מסך מלא'}
            >
              <Maximize className="w-5 h-5" />
            </button>

            {/* Settings Link */}
            <a
              href={`/shops/${storeSlug}/admin/plugins/kitchen-display`}
              className={`p-3 rounded-xl transition-colors ${
                config.darkMode 
                  ? 'hover:bg-slate-700' 
                  : 'hover:bg-slate-200'
              }`}
              title="הגדרות"
            >
              <Settings className="w-5 h-5" />
            </a>

            {/* Refresh */}
            <button
              onClick={fetchOrders}
              disabled={isLoading}
              className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                config.darkMode 
                  ? 'bg-slate-700 hover:bg-slate-600' 
                  : 'bg-slate-200 hover:bg-slate-300'
              } ${isLoading ? 'opacity-50' : ''}`}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              רענן
            </button>
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      <main className="p-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
              config.darkMode ? 'bg-green-500/20' : 'bg-green-100'
            }`}>
              <PartyPopper className={`w-10 h-10 ${config.darkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <h2 className="text-2xl font-bold mb-2">אין הזמנות בהמתנה</h2>
            <p className={config.darkMode ? 'text-slate-400' : 'text-slate-500'}>
              הזמנות חדשות יופיעו כאן אוטומטית
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {orders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                config={config}
                customStatuses={customStatuses}
                onApprove={handleApprove}
                onCancel={handleCancel}
                onPrint={handlePrint}
                cardSizeClass={cardSizeClasses[config.cardSize]}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

