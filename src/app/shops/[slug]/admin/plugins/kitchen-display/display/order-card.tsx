'use client';

import { memo } from 'react';
import { KitchenDisplayConfig, KitchenOrder } from '../actions';
import { Timer } from './timer';
import { User, Phone, FileText, Check, X, Printer } from 'lucide-react';

// ============================================
// Kitchen Display Order Card
// Client Component - נדרש עבור Timer
// Memoized למניעת רינדורים מיותרים
// ============================================

interface CustomStatus {
  id: string;
  name: string;
  color: string;
}

interface OrderCardProps {
  order: KitchenOrder;
  config: KitchenDisplayConfig;
  customStatuses: CustomStatus[];
  onApprove: (orderId: string) => void;
  onCancel: (orderId: string) => void;
  onPrint: (orderId: string) => void;
  cardSizeClass: string;
}

function OrderCardComponent({
  order,
  config,
  customStatuses,
  onApprove,
  onCancel,
  onPrint,
  cardSizeClass,
}: OrderCardProps) {
  // Get elapsed minutes for color
  const elapsedMinutes = Math.floor(
    (Date.now() - new Date(order.createdAt).getTime()) / 60000
  );

  // Timer color based on elapsed time
  const getTimerColorClass = () => {
    if (elapsedMinutes < config.warningTimeMinutes) {
      return 'text-green-400';
    } else if (elapsedMinutes < config.dangerTimeMinutes) {
      return 'text-yellow-400';
    } else {
      return 'text-red-400';
    }
  };

  // Border color based on elapsed time
  const getBorderColorClass = () => {
    if (elapsedMinutes < config.warningTimeMinutes) {
      return config.darkMode ? 'border-green-500/50' : 'border-green-400';
    } else if (elapsedMinutes < config.dangerTimeMinutes) {
      return config.darkMode ? 'border-yellow-500/50' : 'border-yellow-400';
    } else {
      return config.darkMode ? 'border-red-500/50' : 'border-red-400';
    }
  };

  // Get status display
  const getStatusDisplay = () => {
    if (order.customStatus) {
      const custom = customStatuses.find(s => s.id === order.customStatus);
      if (custom) {
        return { name: custom.name, color: custom.color };
      }
    }
    
    const statusMap: Record<string, { name: string; color: string }> = {
      pending: { name: 'ממתין', color: '#EAB308' },
      confirmed: { name: 'אושר', color: '#3B82F6' },
      processing: { name: 'בהכנה', color: '#A855F7' },
      shipped: { name: 'נשלח', color: '#22C55E' },
    };
    
    return statusMap[order.status] || { name: order.status, color: '#94A3B8' };
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div 
      className={`${cardSizeClass} rounded-2xl border-2 overflow-hidden transition-all hover:shadow-xl ${
        getBorderColorClass()
      } ${
        config.darkMode 
          ? 'bg-slate-800' 
          : 'bg-white shadow-lg'
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b ${
        config.darkMode 
          ? 'bg-slate-900/50 border-slate-700' 
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              elapsedMinutes < config.warningTimeMinutes 
                ? 'bg-green-400' 
                : elapsedMinutes < config.dangerTimeMinutes 
                  ? 'bg-yellow-400 animate-pulse' 
                  : 'bg-red-500 animate-pulse'
            }`} />
            <span className="text-lg font-bold">
              #{order.orderNumber}
            </span>
          </div>
          <Timer 
            createdAt={order.createdAt} 
            className={getTimerColorClass()} 
          />
        </div>
        
        {/* Status Badge */}
        <div className="mt-2">
          <span 
            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: statusDisplay.color }}
          >
            {statusDisplay.name}
          </span>
        </div>
      </div>

      {/* Customer Info */}
      {(config.showCustomerName || config.showCustomerPhone) && (
        <div className={`px-4 py-2 border-b ${
          config.darkMode ? 'border-slate-700' : 'border-slate-200'
        }`}>
          {config.showCustomerName && order.customerName && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              <span className="font-medium">{order.customerName}</span>
            </div>
          )}
          {config.showCustomerPhone && order.customerPhone && (
            <div className={`flex items-center gap-2 text-sm ${
              config.darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <Phone className="w-4 h-4" />
              <span dir="ltr">{order.customerPhone}</span>
            </div>
          )}
        </div>
      )}

      {/* Items */}
      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
        {order.items.map(item => (
          <div key={item.id} className="flex gap-3">
            {config.showProductImages && item.imageUrl && (
              <img 
                src={item.imageUrl} 
                alt={item.name}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium truncate">{item.name}</span>
                <span className={`font-bold flex-shrink-0 ${
                  config.darkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  x{item.quantity}
                </span>
              </div>
              
              {item.variantTitle && (
                <p className={`text-sm ${
                  config.darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {item.variantTitle}
                </p>
              )}
              
              {item.addons && item.addons.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {item.addons.map((addon, i) => (
                    <p key={i} className="text-sm text-blue-400">
                      + {addon}
                    </p>
                  ))}
                </div>
              )}
              
              {item.notes && (
                <p className="text-sm text-amber-400 mt-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {item.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Order Notes */}
      {config.showOrderNotes && order.note && (
        <div className={`px-4 py-2 border-t ${
          config.darkMode 
            ? 'bg-yellow-500/10 border-yellow-500/30' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <p className={`text-sm flex items-start gap-2 ${
            config.darkMode ? 'text-yellow-300' : 'text-yellow-800'
          }`}>
            <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {order.note}
          </p>
        </div>
      )}

      {/* Total */}
      <div className={`px-4 py-2 border-t ${
        config.darkMode ? 'border-slate-700' : 'border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <span className={config.darkMode ? 'text-slate-400' : 'text-slate-500'}>
            סה״כ:
          </span>
          <span className="text-xl font-bold">
            ₪{order.total}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className={`p-3 border-t ${
        config.darkMode ? 'border-slate-700' : 'border-slate-200'
      }`}>
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(order.id)}
            className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>אישור</span>
          </button>
          <button
            onClick={() => onCancel(order.id)}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>ביטול</span>
          </button>
          <button
            onClick={() => onPrint(order.id)}
            className={`p-2.5 rounded-xl transition-colors ${
              config.darkMode 
                ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
            title="הדפסה"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export const OrderCard = memo(OrderCardComponent);

