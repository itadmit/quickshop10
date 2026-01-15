import { getStoreBySlug, getProductsByStore } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getReturnRequestById } from '@/lib/db/queries/returns';
import { ReturnRequestActions } from './return-actions';
import { ExchangeProductPicker } from './exchange-product-picker';
import { db } from '@/lib/db';
import { productImages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const metadata = {
  title: 'פרטי בקשה',
  description: 'צפייה וטיפול בבקשת החזרה',
};

interface ReturnDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

interface PreferredExchangeProduct {
  productId: string;
  productName: string;
  variantId?: string;
  variantTitle?: string;
  price: number;
  imageUrl?: string | null;
}

interface ResolutionDetails {
  preferredExchangeProduct?: PreferredExchangeProduct;
}

const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'ממתין לבדיקה', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '⏳' },
  under_review: { label: 'בבדיקה', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '🔍' },
  approved: { label: 'אושר', color: 'bg-green-100 text-green-700 border-green-200', icon: '✓' },
  rejected: { label: 'נדחה', color: 'bg-red-100 text-red-700 border-red-200', icon: '✕' },
  awaiting_shipment: { label: 'ממתין לשליחת המוצר', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '📦' },
  item_received: { label: 'המוצר התקבל', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: '📬' },
  completed: { label: 'הושלם', color: 'bg-green-100 text-green-700 border-green-200', icon: '✓' },
  cancelled: { label: 'בוטל', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: '✕' },
};

const typeLabels: Record<string, string> = {
  return: 'החזרה',
  exchange: 'החלפה',
};

const reasonLabels: Record<string, string> = {
  wrong_size: 'מידה לא מתאימה',
  defective: 'פגם במוצר',
  not_as_described: 'לא כמתואר',
  changed_mind: 'שינוי דעה',
  wrong_item: 'קיבלתי מוצר שגוי',
  damaged_shipping: 'נזק במשלוח',
  other: 'אחר',
};

const resolutionLabels: Record<string, string> = {
  exchange: 'החלפה למוצר אחר',
  store_credit: 'קרדיט לחנות',
  refund: 'זיכוי כספי',
  partial_refund: 'זיכוי חלקי',
};

export default async function ReturnDetailPage({ params }: ReturnDetailPageProps) {
  const { slug, id } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }

  const request = await getReturnRequestById(id, store.id);
  if (!request) {
    notFound();
  }

  const status = statusLabels[request.status] || statusLabels.pending;
  const items = (request.items as Array<{ name: string; quantity: number; price: number; imageUrl?: string }>) || [];

  const canProcess = ['pending', 'under_review'].includes(request.status);
  const canComplete = ['approved', 'awaiting_shipment', 'item_received'].includes(request.status);
  
  // Check if exchange product picker should be shown
  const showExchangePicker = request.status === 'approved' && 
                             request.finalResolution === 'exchange' && 
                             !request.exchangeOrderId;
  
  // Fetch products for exchange picker (only if needed)
  let exchangeProducts: { id: string; name: string; price: string; image: string | null; hasVariants: boolean }[] = [];
  if (showExchangePicker) {
    const allProducts = await getProductsByStore(store.id);
    // Get primary images for products
    const imageResults = await db
      .select({ productId: productImages.productId, url: productImages.url })
      .from(productImages)
      .where(eq(productImages.isPrimary, true));
    const imageMap = new Map(imageResults.map(i => [i.productId, i.url]));
    
    exchangeProducts = allProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price || '0',
      image: imageMap.get(p.id) || null,
      hasVariants: Boolean(p.hasVariants),
    }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/shops/${slug}/admin/returns`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-light">בקשה {request.requestNumber}</h1>
            <p className="text-sm text-gray-500 mt-1">
              מהזמנה #{request.orderNumber} • {new Date(request.createdAt).toLocaleDateString('he-IL')}
            </p>
          </div>
        </div>
        <span className={`text-sm px-4 py-2 rounded-full border ${status.color}`}>
          {status.icon} {status.label}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-medium">פרטי הבקשה</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">סוג בקשה</label>
                  <p className="font-medium">{typeLabels[request.type]}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">סיבה</label>
                  <p className="font-medium">{reasonLabels[request.reason]}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">פתרון מבוקש</label>
                  <p className="font-medium">{resolutionLabels[request.requestedResolution]}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">ערך הפריטים</label>
                  <p className="font-medium">₪{Number(request.totalValue).toFixed(2)}</p>
                </div>
              </div>

              {request.reasonDetails && (
                <div>
                  <label className="text-sm text-gray-500">פרטים נוספים מהלקוח</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{request.reasonDetails}</p>
                </div>
              )}

              {/* Customer's Preferred Exchange Product */}
              {request.requestedResolution === 'exchange' && 
               (request.resolutionDetails as ResolutionDetails)?.preferredExchangeProduct && (
                <div className="pt-4 border-t border-gray-100">
                  <label className="text-sm text-gray-500 mb-2 block">מוצר להחלפה שהלקוח בחר</label>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    {(request.resolutionDetails as ResolutionDetails).preferredExchangeProduct!.imageUrl ? (
                      <img 
                        src={(request.resolutionDetails as ResolutionDetails).preferredExchangeProduct!.imageUrl!} 
                        alt={(request.resolutionDetails as ResolutionDetails).preferredExchangeProduct!.productName}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-blue-900 truncate">
                        {(request.resolutionDetails as ResolutionDetails).preferredExchangeProduct!.productName}
                      </p>
                      {(request.resolutionDetails as ResolutionDetails).preferredExchangeProduct!.variantTitle && (
                        <p className="text-xs text-blue-600">
                          {(request.resolutionDetails as ResolutionDetails).preferredExchangeProduct!.variantTitle}
                        </p>
                      )}
                      <p className="text-xs text-blue-600">
                        ₪{(request.resolutionDetails as ResolutionDetails).preferredExchangeProduct!.price.toFixed(2)}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">העדפת הלקוח</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-medium">פריטים בבקשה</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4">
                  <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden shrink-0">
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
                    <p className="text-sm text-gray-500 mt-1">כמות: {item.quantity}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">₪{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="font-medium mb-4">פרטי לקוח</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">שם</label>
                <p className="font-medium">{request.customerName} {request.customerLastName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">אימייל</label>
                <p className="font-medium">{request.customerEmail}</p>
              </div>
              {request.customerPhone && (
                <div>
                  <label className="text-sm text-gray-500">טלפון</label>
                  <p className="font-medium">{request.customerPhone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Resolution Details (if completed) */}
          {request.finalResolution && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="font-medium text-green-800 mb-4">פתרון שניתן</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-green-600">סוג פתרון</label>
                  <p className="font-medium text-green-800">{resolutionLabels[request.finalResolution]}</p>
                </div>
                {request.creditIssued && Number(request.creditIssued) > 0 && (
                  <div>
                    <label className="text-sm text-green-600">קרדיט שניתן</label>
                    <p className="font-medium text-green-800">₪{Number(request.creditIssued).toFixed(2)}</p>
                  </div>
                )}
                {request.refundAmount && Number(request.refundAmount) > 0 && (
                  <div>
                    <label className="text-sm text-green-600">סכום זיכוי</label>
                    <p className="font-medium text-green-800">₪{Number(request.refundAmount).toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Actions */}
        <div className="lg:col-span-1 space-y-4">
          <ReturnRequestActions
            storeSlug={slug}
            request={{
              id: request.id,
              orderId: request.orderId,
              status: request.status,
              type: request.type,
              requestedResolution: request.requestedResolution,
              totalValue: request.totalValue,
              customerId: request.customerId,
              internalNotes: request.internalNotes,
            }}
            canProcess={canProcess}
            canComplete={canComplete}
          />
          
          {/* Exchange Product Picker - shown when approved for exchange */}
          {showExchangePicker && (
            <ExchangeProductPicker
              storeSlug={slug}
              requestId={request.id}
              originalValue={Number(request.totalValue)}
              products={exchangeProducts}
            />
          )}
        </div>
      </div>
    </div>
  );
}

