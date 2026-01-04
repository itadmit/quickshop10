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
              <path d="M19 12H5M12 19l-7-7 7-7"/>
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
                {items.map((item) => (
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
                    </div>
                    <div className="text-left">
                      <p className="font-medium">₪{Number(item.price).toFixed(0)}</p>
                      {item.quantity > 1 && (
                        <p className="text-sm text-gray-500">
                          סה״כ: ₪{(Number(item.price) * item.quantity).toFixed(0)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
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
                  <span className="text-gray-500">סכום ביניים</span>
                  <span>₪{Number(order.subtotal).toFixed(0)}</span>
                </div>
                
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>הנחה</span>
                    <span>-₪{Number(order.discountAmount).toFixed(0)}</span>
                  </div>
                )}
                
                {Number(order.creditUsed) > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>קרדיט</span>
                    <span>-₪{Number(order.creditUsed).toFixed(0)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-500">משלוח</span>
                  <span>
                    {Number(order.shippingAmount) > 0 
                      ? `₪${Number(order.shippingAmount).toFixed(0)}`
                      : 'חינם'
                    }
                  </span>
                </div>
                
                <div className="flex justify-between pt-3 border-t border-gray-100 font-medium text-lg">
                  <span>סה״כ</span>
                  <span>₪{Number(order.total).toFixed(0)}</span>
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

