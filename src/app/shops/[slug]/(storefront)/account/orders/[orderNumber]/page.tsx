import { headers } from 'next/headers';
import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const metadata = {
  title: 'פרטי הזמנה',
  description: 'צפייה בפרטי הזמנה',
};

interface OrderDetailPageProps {
  params: Promise<{ slug: string; orderNumber: string }>;
}

export default async function CustomerOrderDetailPage({ params }: OrderDetailPageProps) {
  const { slug, orderNumber } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }
  
  const headersList = await headers();
  const basePath = headersList.get('x-custom-domain') ? '' : `/shops/${slug}`;
  
  // Check if logged in
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect(`${basePath}/login?callbackUrl=${encodeURIComponent(`${basePath}/account/orders/${orderNumber}`)}`);
  }

  // Fetch order with items
  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.orderNumber, orderNumber),
        eq(orders.customerId, customer.id)
      )
    )
    .limit(1);

  if (!order) {
    notFound();
  }

  // Fetch order items
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: 'ממתין לאישור', color: 'bg-amber-100 text-amber-700', icon: '⏳' },
    confirmed: { label: 'אושר', color: 'bg-blue-100 text-blue-700', icon: '✓' },
    processing: { label: 'בהכנה', color: 'bg-purple-100 text-purple-700', icon: '📦' },
    shipped: { label: 'נשלח', color: 'bg-indigo-100 text-indigo-700', icon: '🚚' },
    delivered: { label: 'נמסר', color: 'bg-green-100 text-green-700', icon: '✓' },
    cancelled: { label: 'בוטל', color: 'bg-red-100 text-red-700', icon: '✕' },
    refunded: { label: 'הוחזר', color: 'bg-gray-100 text-gray-700', icon: '↩' },
  };

  const status = statusLabels[order.status] || statusLabels.pending;
  const shippingAddress = order.shippingAddress as {
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    zipCode?: string;
    phone?: string;
  } | null;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            href={`${basePath}/account/orders`}
            className="text-sm text-gray-500 hover:text-black transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            חזרה להזמנות
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-light tracking-wide mb-2">
              הזמנה #{order.orderNumber}
            </h1>
            <p className="text-gray-500 text-sm">
              {new Date(order.createdAt).toLocaleDateString('he-IL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <span className={`text-sm px-4 py-2 rounded-full ${status.color}`}>
            {status.icon} {status.label}
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-medium">פריטים בהזמנה</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {items.map((item) => {
                  // Get addon info from properties
                  const props = item.properties as { 
                    addons?: Array<{name: string; displayValue: string; priceAdjustment: number}>; 
                    addonTotal?: number 
                  } | null;
                  const addonTotal = props?.addonTotal || 0;
                  const itemTotal = (Number(item.price) + addonTotal) * item.quantity;
                  
                  return (
                  <div key={item.id} className="flex gap-4 p-6">
                    <div className="w-20 h-24 bg-gray-100 rounded overflow-hidden shrink-0">
                      {item.imageUrl && (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      {item.variantTitle && (
                        <p className="text-sm text-gray-500 mt-1">{item.variantTitle}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">כמות: {item.quantity}</p>
                        
                        {/* Display addons if present */}
                        {props?.addons && props.addons.length > 0 && (
                          <div className="mt-2 space-y-0.5 text-xs bg-gray-50 p-2 rounded">
                            {props.addons.map((addon, i) => (
                              <div key={i} className="flex items-center justify-between text-gray-600">
                                <span>{addon.name}: <span className="text-gray-800">{addon.displayValue}</span></span>
                                {addon.priceAdjustment > 0 && (
                                  <span className="text-green-600">+₪{addon.priceAdjustment.toFixed(2)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">₪{Number(item.price).toFixed(2)}</p>
                        {(item.quantity > 1 || addonTotal > 0) && (
                        <p className="text-sm text-gray-500">
                            סה״כ: ₪{itemTotal.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Shipping Address */}
            {shippingAddress && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="font-medium mb-4">כתובת למשלוח</h2>
                <div className="text-gray-600 text-sm space-y-1">
                  <p className="font-medium text-black">
                    {shippingAddress.firstName} {shippingAddress.lastName}
                  </p>
                  <p>{shippingAddress.address}</p>
                  <p>{shippingAddress.city} {shippingAddress.zipCode}</p>
                  {shippingAddress.phone && <p>טלפון: {shippingAddress.phone}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
              <h2 className="font-medium mb-4">סיכום הזמנה</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">סכום לפני הנחות</span>
                  <span>₪{Number(order.subtotal).toFixed(2)}</span>
                </div>
                
                {/* Detailed discount breakdown - each type in its own row */}
                {((order.discountDetails as Array<{type: 'coupon' | 'auto' | 'gift_card' | 'credit' | 'member'; code?: string; name: string; description?: string; amount: number}>) || []).map((discount, idx) => (
                  <div 
                    key={idx} 
                    className={`flex justify-between ${
                      discount.type === 'gift_card' ? 'text-purple-600' :
                      discount.type === 'credit' ? 'text-blue-600' :
                      'text-green-600'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {discount.type === 'gift_card' && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
                        </svg>
                      )}
                      {discount.type === 'coupon' && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/>
                          <path d="M6 6h.008v.008H6V6z"/>
                        </svg>
                      )}
                      {discount.type === 'auto' && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
                        </svg>
                      )}
                      {discount.type === 'credit' && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/>
                        </svg>
                      )}
                      {discount.type === 'coupon' ? `קופון ${discount.code}${discount.description ? ` (${discount.description})` : ''}` :
                       discount.type === 'gift_card' ? `גיפט קארד ${discount.code}` :
                       discount.type === 'auto' ? `הנחה אוטומטית: ${discount.name}` :
                       discount.type === 'member' ? 'הנחת חברי מועדון' :
                       discount.type === 'credit' ? 'קרדיט' : discount.name}
                    </span>
                    <span>-₪{discount.amount.toFixed(2)}</span>
                  </div>
                ))}
                
                {/* Fallback for old orders without discountDetails */}
                {!((order.discountDetails as unknown[])?.length) && Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>הנחה {order.discountCode && `(${order.discountCode})`}</span>
                    <span>-₪{Number(order.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                
                {/* Credit used - only if not already in discountDetails */}
                {Number(order.creditUsed) > 0 && !((order.discountDetails as Array<{type: string}>)?.some(d => d.type === 'credit')) && (
                  <div className="flex justify-between text-blue-600">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/>
                      </svg>
                      קרדיט
                    </span>
                    <span>-₪{Number(order.creditUsed).toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-500">משלוח</span>
                  <span className={Number(order.shippingAmount) === 0 ? 'text-green-600 flex items-center gap-1' : ''}>
                    {Number(order.shippingAmount) > 0 
                      ? `₪${Number(order.shippingAmount).toFixed(2)}`
                      : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                          חינם
                        </>
                      )
                    }
                  </span>
                </div>
                
                <div className="flex justify-between pt-3 border-t border-gray-100 font-medium text-lg">
                  <span>סה״כ</span>
                  <span>₪{Number(order.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Order Timeline */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-medium mb-3">סטטוס הזמנה</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm">
                      ✓
                    </div>
                    <div>
                      <p className="text-sm font-medium">הזמנה התקבלה</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  </div>
                  
                  {['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status) && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm">
                        ✓
                      </div>
                      <div>
                        <p className="text-sm font-medium">הזמנה אושרה</p>
                      </div>
                    </div>
                  )}
                  
                  {['processing', 'shipped', 'delivered'].includes(order.status) && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm">
                        ✓
                      </div>
                      <div>
                        <p className="text-sm font-medium">בהכנה</p>
                      </div>
                    </div>
                  )}
                  
                  {['shipped', 'delivered'].includes(order.status) && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm">
                        ✓
                      </div>
                      <div>
                        <p className="text-sm font-medium">נשלח</p>
                      </div>
                    </div>
                  )}
                  
                  {order.status === 'delivered' && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm">
                        ✓
                      </div>
                      <div>
                        <p className="text-sm font-medium">נמסר</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Return/Exchange Button */}
              {['delivered', 'shipped', 'confirmed', 'processing'].includes(order.status) && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <Link
                    href={`${basePath}/account/orders/${orderNumber}/return`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 14l-4-4 4-4"/>
                      <path d="M5 10h11a4 4 0 1 1 0 8h-1"/>
                    </svg>
                    החזרה/החלפה
                  </Link>
                </div>
              )}

              {/* Need Help */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  שאלות לגבי ההזמנה?{' '}
                  <a href="#" className="text-black hover:underline">צור קשר</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

