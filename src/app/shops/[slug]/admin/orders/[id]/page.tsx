import { getStoreBySlug, getOrderDetails } from '@/lib/db/queries';
import { markOrderAsRead, getOrderShipments } from '@/lib/actions/orders';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/admin/ui';
import { OrderDetailActions, FulfillButton } from '@/components/admin/order-detail-actions';
import { calculateItemDiscounts, type OrderItemWithDiscount } from '@/lib/order-item-discount';
import { CustomStatusSelector, CustomStatusBadge } from '@/components/admin/custom-status-selector';

interface OrderPageProps {
  params: Promise<{ slug: string; id: string }>;
}

const statusLabels: Record<string, string> = {
  pending: 'ממתין',
  confirmed: 'אושר',
  processing: 'בטיפול',
  shipped: 'נשלח',
  delivered: 'נמסר',
  cancelled: 'בוטל',
  refunded: 'הוחזר',
};

const fulfillmentLabels: Record<string, string> = {
  unfulfilled: 'לא נשלח',
  partial: 'נשלח חלקית',
  fulfilled: 'נשלח',
};

const financialLabels: Record<string, string> = {
  pending: 'ממתין לתשלום',
  paid: 'שולם',
  partially_paid: 'שולם חלקית',
  refunded: 'הוחזר',
  partially_refunded: 'הוחזר חלקית',
};

function formatDate(date: Date) {
  return date.toLocaleDateString('he-IL', { 
    day: 'numeric', 
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default async function OrderDetailsPage({ params }: OrderPageProps) {
  const { slug, id } = await params;
  
  // Get store first (cached, so fast)
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get order details (uses parallel queries internally + cached)
  const orderData = await getOrderDetails(store.id, id);
  
  // Mark as read in background (non-blocking) if not already read
  if (orderData && !orderData.isRead) {
    markOrderAsRead(id, slug).catch(() => {}); // Fire and forget
  }

  if (!orderData) {
    notFound();
  }

  // Use order alias for cleaner code
  const order = orderData;

  // Get all shipments for this order (for exchanges there may be multiple)
  const orderShipments = await getOrderShipments(id);

  // Get custom order statuses from store settings
  const customStatuses = (store.customOrderStatuses as Array<{
    id: string;
    name: string;
    color: string;
  }>) || [];

  // Get current custom status object
  const currentCustomStatus = customStatuses.find(s => s.id === order.customStatus);

  // Calculate per-item discounts (for showing strikethrough prices)
  const itemsWithDiscounts = await calculateItemDiscounts(
    store.id,
    order.items.map(item => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      variantTitle: item.variantTitle,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
      imageUrl: item.imageUrl,
      properties: item.properties as Record<string, unknown> | null,
    })),
    order.discountCode,
    order.discountDetails as Array<{type: 'coupon' | 'auto' | 'gift_card' | 'credit' | 'member'; code?: string; name: string; description?: string; amount: number}> | null
  );

  const shippingAddress = order.shippingAddress as {
    firstName?: string;
    lastName?: string;
    address?: string;
    address1?: string;
    address2?: string;
    city?: string;
    zip?: string;
    zipCode?: string;
    phone?: string;
  } | null;

  return (
    <div className="space-y-6 pb-12">
      {/* Back Link */}
      <Link 
        href={`/shops/${slug}/admin/orders`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
        הזמנות
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-gray-900">
            #{order.orderNumber}
          </h1>
          <Badge 
            variant={order.financialStatus === 'paid' ? 'success' : order.financialStatus === 'partially_paid' ? 'warning' : 'default'}
          >
            {financialLabels[order.financialStatus!]}
          </Badge>
          <Badge 
            variant={order.status === 'cancelled' ? 'error' : order.fulfillmentStatus === 'fulfilled' ? 'success' : order.fulfillmentStatus === 'partial' ? 'warning' : 'default'}
          >
            {order.status === 'cancelled' ? statusLabels.cancelled : fulfillmentLabels[order.fulfillmentStatus!]}
          </Badge>
          {/* Custom workflow status badge */}
          {currentCustomStatus && (
            <CustomStatusBadge status={currentCustomStatus} />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Custom Status Selector - only show if store has custom statuses */}
          {customStatuses.length > 0 && (
            <CustomStatusSelector
              orderId={order.id}
              storeSlug={slug}
              customStatuses={customStatuses}
              currentStatusId={order.customStatus}
            />
          )}
          <OrderDetailActions 
            orderId={order.id}
            storeSlug={slug}
            fulfillmentStatus={order.fulfillmentStatus!}
            financialStatus={order.financialStatus!}
            status={order.status!}
            shipment={orderShipments[0] || null}
          />
        </div>
      </div>

      {/* Subtitle */}
      <div className="flex items-center gap-2">
        <p className="text-sm text-gray-500">
          {formatDate(new Date(order.createdAt!))} מ-{
            order.utmSource === 'manual' ? 'הזמנה ידנית' :
            order.utmSource === 'pos' ? 'קופה (POS)' :
            'Online Store'
          }
        </p>
        {order.utmSource === 'manual' && (
          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
            ידני
          </span>
        )}
        {order.utmSource === 'pos' && (
          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
            POS
          </span>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Column - Order Details */}
        <div className="col-span-8 space-y-4">
          {/* Fulfillment Card */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${order.fulfillmentStatus === 'fulfilled' ? 'bg-gray-400' : 'bg-yellow-400'}`}></span>
                <h3 className="text-sm font-semibold text-gray-900">
                  {order.fulfillmentStatus === 'fulfilled' ? 'נשלח' : 'לא נשלח'} ({order.items.length})
                </h3>
              </div>
              <FulfillButton 
                orderId={order.id}
                storeSlug={slug}
                fulfillmentStatus={order.fulfillmentStatus!}
                status={order.status!}
              />
            </div>
            
            <div className="divide-y divide-gray-50">
              {itemsWithDiscounts.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-center gap-4">
                  {/* Image */}
                  <div className="w-10 h-10 bg-gray-50 rounded shrink-0 overflow-hidden border border-gray-100">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">{item.name}</p>
                    {item.variantTitle && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.variantTitle}</p>
                    )}
                    {item.sku && (
                      <p className="text-xs text-gray-400 mt-0.5">מק״ט: {item.sku}</p>
                    )}
                    {/* Display addons if present */}
                    {(() => {
                      const props = item.properties as { addons?: Array<{name: string; displayValue: string; priceAdjustment: number}>; addonTotal?: number } | null;
                      if (props?.addons && props.addons.length > 0) {
                        return (
                          <div className="mt-1.5 space-y-0.5 text-xs bg-gray-50 p-1.5 rounded">
                            {props.addons.map((addon, i) => (
                              <div key={i} className="flex items-center gap-2 text-gray-600">
                                <span>{addon.name}:</span>
                                <span className="text-gray-800">{addon.displayValue}</span>
                                {addon.priceAdjustment > 0 && (
                                  <span className="text-green-600">(+₪{addon.priceAdjustment.toFixed(2)})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Price & Quantity - with discount indication */}
                  <div className="text-left flex items-center gap-6">
                    {item.hasDiscount ? (
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-400 line-through">₪{Number(item.price).toFixed(2)}</span>
                        <span className="text-sm text-emerald-600 font-medium">₪{item.discountedPrice?.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">₪{Number(item.price).toFixed(2)}</span>
                    )}
                    <span className="text-sm text-gray-500">×{item.quantity}</span>
                    {item.hasDiscount ? (
                      <div className="flex flex-col items-end w-20">
                        <span className="text-xs text-gray-400 line-through">₪{Number(item.total).toFixed(2)}</span>
                        <span className="text-sm font-medium text-emerald-600">₪{item.discountedTotal?.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-900 w-20 text-left">₪{Number(item.total).toFixed(2)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${order.financialStatus === 'paid' ? 'bg-gray-400' : 'bg-yellow-400'}`}></span>
                <h3 className="text-sm font-semibold text-gray-900">
                  {order.financialStatus === 'paid' ? 'שולם' : order.financialStatus === 'refunded' ? 'הוחזר' : 'ממתין לתשלום'}
                </h3>
              </div>
              {/* Payment method info */}
              {(() => {
                const paymentDetails = order.paymentDetails as { 
                  cardLastFour?: string; 
                  cardBrand?: string; 
                  approvalNumber?: string;
                  provider?: string;
                } | null;
                if (paymentDetails?.cardLastFour || order.paymentMethod) {
                  return (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="1" y="4" width="22" height="16" rx="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                      {paymentDetails?.cardBrand && <span>{paymentDetails.cardBrand}</span>}
                      {paymentDetails?.cardLastFour && <span className="font-mono">•••• {paymentDetails.cardLastFour}</span>}
                      {!paymentDetails?.cardLastFour && order.paymentMethod && (
                        <span>{order.paymentMethod === 'credit_card' ? 'כרטיס אשראי' : order.paymentMethod}</span>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            
            <div className="px-4 py-3 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">סכום לפני הנחות</span>
                <span className="text-gray-600">{order.items.length} פריטים</span>
                <span className="text-gray-900">₪{Number(order.subtotal).toFixed(2)}</span>
              </div>
              
              {/* Detailed discount breakdown */}
              {(order.discountDetails as Array<{type: string; code?: string; name: string; description?: string; amount: number}> | null)?.map((discount, idx) => (
                <div key={idx} className={`flex justify-between ${
                  discount.type === 'gift_card' ? 'text-purple-600' : 
                  discount.type === 'credit' ? 'text-blue-600' : 'text-emerald-600'
                }`}>
                  <span className="flex items-center gap-1.5">
                    {discount.type === 'coupon' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                        <line x1="7" y1="7" x2="7.01" y2="7"/>
                      </svg>
                    )}
                    {discount.type === 'gift_card' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="8" width="18" height="12" rx="2"/>
                        <path d="M12 8V3M12 3L9 6M12 3l3 3"/>
                      </svg>
                    )}
                    {discount.type === 'auto' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                    )}
                    {discount.type === 'member' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    )}
                    {discount.type === 'credit' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                        <path d="M6 12h4"/>
                      </svg>
                    )}
                    {discount.type === 'coupon' ? `קופון ${discount.code}` :
                     discount.type === 'gift_card' ? `גיפט קארד ${discount.code}` :
                     discount.type === 'auto' ? `הנחה אוטומטית: ${discount.name}` :
                     discount.type === 'member' ? 'הנחת חברי מועדון' :
                     discount.type === 'credit' ? 'קרדיט' : discount.name}
                    {discount.description && (
                      <span className="text-xs opacity-75">({discount.description})</span>
                    )}
                  </span>
                  <span></span>
                  <span>-₪{discount.amount.toFixed(2)}</span>
                </div>
              ))}
              
              {/* Fallback for old orders without discountDetails */}
              {!(order.discountDetails as unknown[])?.length && Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>הנחה {order.discountCode && `(${order.discountCode})`}</span>
                  <span></span>
                  <span>-₪{Number(order.discountAmount).toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">משלוח</span>
                <span className="text-gray-400 text-sm">{order.shippingMethod || 'רגיל'}</span>
                <span className={Number(order.shippingAmount) === 0 ? 'text-emerald-600' : 'text-gray-900'}>
                  {Number(order.shippingAmount) === 0 ? '✓ חינם' : `₪${Number(order.shippingAmount).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between pt-2.5 border-t border-gray-100 font-semibold">
                <span className="text-gray-900">סה״כ</span>
                <span></span>
                <span className="text-gray-900">₪{Number(order.total).toFixed(2)}</span>
              </div>
              {order.financialStatus === 'paid' && (
                <div className="flex justify-between pt-2.5 border-t border-gray-100 text-gray-500">
                  <span>שולם על ידי הלקוח</span>
                  <span></span>
                  <span>₪{Number(order.total).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">ציר זמן</h3>
            </div>
            <div className="px-4 py-3">
              <div className="space-y-3">
                {order.status === 'cancelled' && (
                  <div className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">הזמנה בוטלה</p>
                      <p className="text-xs text-gray-400">{formatDate(new Date(order.updatedAt!))}</p>
                    </div>
                  </div>
                )}
                {order.financialStatus === 'refunded' && (
                  <div className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">תשלום הוחזר</p>
                      <p className="text-xs text-gray-400">{formatDate(new Date(order.updatedAt!))}</p>
                    </div>
                  </div>
                )}
                {order.fulfillmentStatus === 'fulfilled' && (
                  <div className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">הזמנה נשלחה</p>
                      <p className="text-xs text-gray-400">{formatDate(new Date(order.updatedAt!))}</p>
                    </div>
                  </div>
                )}
                {(order.financialStatus === 'paid' || order.financialStatus === 'refunded') && (
                  <div className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">תשלום ₪{Number(order.total).toFixed(2)} התקבל</p>
                      <p className="text-xs text-gray-400">{formatDate(new Date(order.createdAt!))}</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">הזמנה #{order.orderNumber} נוצרה</p>
                    <p className="text-xs text-gray-400">{formatDate(new Date(order.createdAt!))}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Customer & Shipping */}
        <div className="col-span-4 space-y-4">
          {/* Shipment Error Alert */}
          {order.shipmentError && (
            <div className={`rounded-lg border overflow-hidden ${
              // Check if it's an auto-retryable error
              ['fetch failed', 'timeout', 'network'].some(e => order.shipmentError?.toLowerCase().includes(e))
                ? 'bg-amber-50 border-amber-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="px-4 py-3 flex items-start gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 mt-0.5 ${
                  ['fetch failed', 'timeout', 'network'].some(e => order.shipmentError?.toLowerCase().includes(e))
                    ? 'text-amber-500'
                    : 'text-red-500'
                }`}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div className="flex-1">
                  <h3 className={`text-sm font-semibold ${
                    ['fetch failed', 'timeout', 'network'].some(e => order.shipmentError?.toLowerCase().includes(e))
                      ? 'text-amber-800'
                      : 'text-red-800'
                  }`}>
                    שגיאת שליחה אוטומטית
                  </h3>
                  <p className={`text-sm mt-1 ${
                    ['fetch failed', 'timeout', 'network'].some(e => order.shipmentError?.toLowerCase().includes(e))
                      ? 'text-amber-700'
                      : 'text-red-700'
                  }`}>
                    {order.shipmentError}
                  </p>
                  
                  {/* Helpful explanation based on error type */}
                  <div className={`mt-2 text-xs p-2 rounded ${
                    ['fetch failed', 'timeout', 'network'].some(e => order.shipmentError?.toLowerCase().includes(e))
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {order.shipmentError?.includes('ישוב שגוי') && (
                      <div className="flex items-start gap-2">
                        <span>💡</span>
                        <span><strong>צריך תיקון ידני:</strong> הישוב/העיר שהלקוח הזין לא מוכר למערכת המשלוחים. יש לבדוק ולתקן את כתובת המשלוח.</span>
                      </div>
                    )}
                    {order.shipmentError?.includes('אזור הובלה') && (
                      <div className="flex items-start gap-2">
                        <span>💡</span>
                        <span><strong>צריך תיקון ידני:</strong> אזור המשלוח לא מוגדר או לא נתמך. יש לבדוק את הגדרות אזורי המשלוח.</span>
                      </div>
                    )}
                    {['fetch failed', 'timeout', 'network'].some(e => order.shipmentError?.toLowerCase().includes(e)) && (
                      <div className="flex items-start gap-2">
                        <span>🔄</span>
                        <span><strong>ינוסה שוב אוטומטית:</strong> בעיית תקשורת זמנית עם חברת המשלוחים. המערכת תנסה שוב בקרוב.</span>
                      </div>
                    )}
                    {!order.shipmentError?.includes('ישוב שגוי') && 
                     !order.shipmentError?.includes('אזור הובלה') &&
                     !['fetch failed', 'timeout', 'network'].some(e => order.shipmentError?.toLowerCase().includes(e)) && (
                      <div className="flex items-start gap-2">
                        <span>⚠️</span>
                        <span><strong>שגיאה לא מזוהה:</strong> ניתן לנסות לשלוח שוב ידנית מהתפריט למעלה.</span>
                      </div>
                    )}
                  </div>
                  
                  {order.shipmentErrorAt && (
                    <p className={`text-xs mt-2 ${
                      ['fetch failed', 'timeout', 'network'].some(e => order.shipmentError?.toLowerCase().includes(e))
                        ? 'text-amber-500'
                        : 'text-red-500'
                    }`}>
                      {new Date(order.shipmentErrorAt).toLocaleDateString('he-IL', { 
                        day: 'numeric', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Shipments Info */}
          {orderShipments.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-green-500">
                  <rect x="1" y="3" width="15" height="13" rx="2"/>
                  <path d="M16 8h4l3 3v5a2 2 0 01-2 2h-1"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                <h3 className="text-sm font-semibold text-gray-900">
                  {orderShipments.length > 1 ? `משלוחים (${orderShipments.length})` : 'משלוח'}
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {orderShipments.map((shipment, index) => (
                  <div key={shipment.id} className="px-4 py-3 space-y-3">
                    {orderShipments.length > 1 && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          shipment.statusDescription?.includes('איסוף') 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {shipment.statusDescription?.includes('איסוף') ? '📦 איסוף' : '🚚 מסירה'}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">מספר מעקב</span>
                      <span className="text-sm font-mono font-medium text-gray-900 select-all">
                        {shipment.trackingNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">ספק</span>
                      <span className="text-sm text-gray-700">{shipment.provider}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">סטטוס</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        {shipment.status === 'created' ? 'נוצר' : 
                         shipment.status === 'in_transit' ? 'בדרך' :
                         shipment.status === 'delivered' ? 'נמסר' : shipment.status}
                      </span>
                    </div>
                    {/* Generate correct label URL for Focus (ship_print_ws endpoint) */}
                    {shipment.trackingNumber && (
                      <a
                        href={shipment.provider === 'focus' 
                          ? `https://focusdelivery.co.il/RunCom.Server/Request.aspx?APPNAME=run&PRGNAME=ship_print_ws&ARGUMENTS=-N${shipment.trackingNumber},-A,-A,-A,-A,-A,-A,-N,-A${order.orderNumber}`
                          : shipment.labelUrl || '#'
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                          shipment.statusDescription?.includes('איסוף')
                            ? 'bg-orange-500 hover:bg-orange-600'
                            : 'bg-gray-900 hover:bg-gray-800'
                        }`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M6 9V2h12v7"/>
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                          <rect x="6" y="14" width="12" height="8"/>
                        </svg>
                        {shipment.statusDescription?.includes('איסוף') ? 'הדפס מדבקת איסוף' : 'הדפס מדבקת משלוח'}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">הערות</h3>
              <button className="text-xs font-medium text-gray-500 hover:text-gray-700 cursor-pointer">
                ערוך
              </button>
            </div>
            <div className="px-4 py-3">
              {order.note ? (
                <p className="text-sm text-gray-700">{order.note}</p>
              ) : (
                <p className="text-sm text-gray-400">אין הערות</p>
              )}
            </div>
          </div>

          {/* Customer Card */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">לקוח</h3>
            </div>
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                  {order.customer?.firstName?.[0]}{order.customer?.lastName?.[0]}
                </div>
                <Link 
                  href={`/shops/${slug}/admin/contacts?type=customer&search=${encodeURIComponent(order.customer?.email || '')}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {order.customer?.firstName} {order.customer?.lastName}
                </Link>
              </div>
              
              <div className="pt-3 border-t border-gray-50">
                <h4 className="text-xs font-medium text-gray-500 mb-2">פרטי קשר</h4>
                <div className="space-y-1.5">
                  <a 
                    href={`mailto:${order.customer?.email}`}
                    className="text-sm text-blue-600 hover:underline block"
                  >
                    {order.customer?.email}
                  </a>
                  {order.customer?.phone && (
                    <p className="text-sm text-gray-600">{order.customer.phone}</p>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              {shippingAddress && (
                <div className="pt-3 border-t border-gray-50">
                  <h4 className="text-xs font-medium text-gray-500 mb-2">כתובת למשלוח</h4>
                  <div className="text-sm text-gray-700 space-y-0.5">
                    <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                    <p>{shippingAddress.address || shippingAddress.address1}</p>
                    {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
                    <p>{shippingAddress.city} {shippingAddress.zip || shippingAddress.zipCode}</p>
                    {shippingAddress.phone && (
                      <p className="pt-1">{shippingAddress.phone}</p>
                    )}
                  </div>
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(`${shippingAddress.address || shippingAddress.address1}, ${shippingAddress.city}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-xs text-blue-600 hover:underline"
                  >
                    צפה במפה
                  </a>
                </div>
              )}

              {/* Billing Address */}
              <div className="pt-3 border-t border-gray-50">
                <h4 className="text-xs font-medium text-gray-500 mb-2">כתובת לחיוב</h4>
                <p className="text-sm text-gray-500">זהה לכתובת המשלוח</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">תגיות</h3>
            </div>
            <div className="px-4 py-3">
              <button className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                הוסף תגית
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
