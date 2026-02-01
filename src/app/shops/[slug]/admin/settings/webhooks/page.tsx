import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { webhooks, webhookDeliveries } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { WebhookForm } from './webhook-form';
import { WebhookButtons } from './webhook-buttons';

export default async function WebhooksSettingsPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get webhooks with delivery stats
  const storeWebhooks = await db
    .select({
      webhook: webhooks,
      deliveryCount: sql<number>`(SELECT COUNT(*) FROM webhook_deliveries WHERE webhook_id = ${webhooks.id})::int`,
      successCount: sql<number>`(SELECT COUNT(*) FROM webhook_deliveries WHERE webhook_id = ${webhooks.id} AND status_code BETWEEN 200 AND 299)::int`,
    })
    .from(webhooks)
    .where(eq(webhooks.storeId, store.id))
    .orderBy(desc(webhooks.createdAt));

  const availableEvents = [
    { value: 'order.created', label: 'הזמנה חדשה' },
    { value: 'order.updated', label: 'עדכון הזמנה' },
    { value: 'order.cancelled', label: 'ביטול הזמנה' },
    { value: 'order.fulfilled', label: 'הזמנה נשלחה' },
    { value: 'product.created', label: 'מוצר חדש' },
    { value: 'product.updated', label: 'עדכון מוצר' },
    { value: 'product.deleted', label: 'מחיקת מוצר' },
    { value: 'inventory.low', label: 'מלאי נמוך' },
    { value: 'customer.created', label: 'לקוח חדש' },
    { value: 'refund.created', label: 'החזר כספי' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
          <p className="text-gray-500 text-sm mt-1">התחברות לשירותים חיצוניים באמצעות webhooks</p>
        </div>
        <Link
          href={`/shops/${slug}/admin/settings`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          → חזרה להגדרות
        </Link>
      </div>

      {/* Add Webhook Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">הוספת Webhook חדש</h2>
        <WebhookForm storeId={store.id} slug={slug} availableEvents={availableEvents} />
      </div>

      {/* Webhooks List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold">Webhooks פעילים ({storeWebhooks.length})</h2>
        </div>
        
        {storeWebhooks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <p>אין webhooks מוגדרים</p>
            <p className="text-sm mt-1">הוסף webhook כדי לקבל התראות על אירועים בחנות</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {storeWebhooks.map(({ webhook, deliveryCount, successCount }) => (
              <div key={webhook.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{webhook.name}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        webhook.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {webhook.isActive ? 'פעיל' : 'מושבת'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 font-mono break-all" dir="ltr">
                      {webhook.url}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(webhook.events as string[] || []).map((event) => (
                        <span key={event} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {availableEvents.find(e => e.value === event)?.label || event}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>{deliveryCount} קריאות</span>
                      <span className="text-green-600">{successCount} הצלחות</span>
                      <span className="text-red-600">{deliveryCount - successCount} כשלונות</span>
                      {webhook.lastTriggeredAt && (
                        <span>
                          אחרון: {new Date(webhook.lastTriggeredAt).toLocaleDateString('he-IL')}
                        </span>
                      )}
                    </div>
                  </div>
                  <WebhookButtons 
                    webhookId={webhook.id} 
                    slug={slug} 
                    isActive={webhook.isActive}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documentation */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-4">מידע טכני</h3>
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <p className="font-medium text-gray-900 mb-1">פורמט הבקשה</p>
            <p>כל webhook נשלח כבקשת POST עם body ב-JSON הכולל את פרטי האירוע.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">אימות חתימה</p>
            <p>אם הגדרת Secret, כל בקשה תכלול header בשם <code className="px-1 bg-gray-200 rounded">X-Webhook-Signature</code> עם חתימת HMAC-SHA256.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Retry Policy</p>
            <p>במקרה של כשל (status code שאינו 2xx), המערכת תנסה שוב עד 3 פעמים עם exponential backoff.</p>
          </div>
        </div>
      </div>
    </div>
  );
}











