import { headers } from 'next/headers';
import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCustomerReturnRequests } from '@/lib/db/queries/returns';

export const metadata = {
  title: 'הבקשות שלי',
  description: 'צפייה בבקשות החזרה והחלפה',
};

interface ReturnsPageProps {
  params: Promise<{ slug: string }>;
}

const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'ממתין לבדיקה', color: 'bg-amber-100 text-amber-700', icon: '⏳' },
  under_review: { label: 'בבדיקה', color: 'bg-blue-100 text-blue-700', icon: '🔍' },
  approved: { label: 'אושר', color: 'bg-green-100 text-green-700', icon: '✓' },
  rejected: { label: 'נדחה', color: 'bg-red-100 text-red-700', icon: '✕' },
  awaiting_shipment: { label: 'ממתין לשליחה', color: 'bg-purple-100 text-purple-700', icon: '📦' },
  item_received: { label: 'המוצר התקבל', color: 'bg-indigo-100 text-indigo-700', icon: '📬' },
  completed: { label: 'הושלם', color: 'bg-green-100 text-green-700', icon: '✓' },
  cancelled: { label: 'בוטל', color: 'bg-gray-100 text-gray-600', icon: '✕' },
};

const typeLabels: Record<string, string> = {
  return: 'החזרה',
  exchange: 'החלפה',
};

const resolutionLabels: Record<string, string> = {
  exchange: 'החלפה למוצר אחר',
  store_credit: 'קרדיט לחנות',
  refund: 'זיכוי כספי',
  partial_refund: 'זיכוי חלקי',
};

export default async function CustomerReturnsPage({ params }: ReturnsPageProps) {
  const { slug } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }
  
  const headersList = await headers();
  const basePath = headersList.get('x-custom-domain') ? '' : `/shops/${slug}`;
  
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect(`${basePath}/login?callbackUrl=${encodeURIComponent(`${basePath}/account/returns`)}`);
  }

  const requests = await getCustomerReturnRequests(customer.id, store.id);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            href={`${basePath}/account`}
            className="text-sm text-gray-500 hover:text-black transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            חזרה לחשבון
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-light tracking-wide mb-2">
            הבקשות שלי
          </h1>
          <p className="text-gray-500 text-sm">
            צפייה במצב בקשות החזרה והחלפה
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                <path d="M9 14l-4-4 4-4"/>
                <path d="M5 10h11a4 4 0 1 1 0 8h-1"/>
              </svg>
            </div>
            <h2 className="text-lg font-medium mb-2">אין בקשות</h2>
            <p className="text-gray-500 text-sm mb-6">
              לא הגשת עדיין בקשות החזרה או החלפה
            </p>
            <Link
              href={`${basePath}/account/orders`}
              className="inline-block px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              עבור להזמנות
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const status = statusLabels[request.status] || statusLabels.pending;
              const items = (request.items as Array<{ name: string; quantity: number; price: number; imageUrl?: string }>) || [];
              
              return (
                <div
                  key={request.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="font-medium">בקשה #{request.requestNumber}</h2>
                          <span className={`text-xs px-2.5 py-1 rounded-full ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          מהזמנה #{request.orderNumber} • {new Date(request.createdAt).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                      <div className="text-left">
                        <span className="text-xs text-gray-500 block mb-1">{typeLabels[request.type]}</span>
                        <span className="font-medium">₪{Number(request.totalValue).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div className="flex items-center gap-3 mb-4">
                      {items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="w-12 h-14 bg-gray-100 rounded overflow-hidden">
                          {item.imageUrl && (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ))}
                      {items.length > 3 && (
                        <div className="w-12 h-14 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">
                          +{items.length - 3}
                        </div>
                      )}
                      <div className="flex-1 text-sm text-gray-600">
                        {items.map(i => i.name).join(', ')}
                      </div>
                    </div>

                    {/* Resolution Info */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-sm text-gray-500">
                        פתרון מבוקש: {resolutionLabels[request.requestedResolution]}
                      </span>
                      
                      {/* Show final resolution if completed */}
                      {request.status === 'completed' && request.finalResolution && (
                        <span className="text-sm text-green-600">
                          {request.creditIssued && Number(request.creditIssued) > 0 && `קרדיט: ₪${Number(request.creditIssued).toFixed(2)}`}
                          {request.refundAmount && Number(request.refundAmount) > 0 && `זיכוי: ₪${Number(request.refundAmount).toFixed(2)}`}
                        </span>
                      )}

                      {/* Customer notes */}
                      {request.customerNotes && (
                        <span className="text-sm text-blue-600">
                          💬 יש הודעה חדשה
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

