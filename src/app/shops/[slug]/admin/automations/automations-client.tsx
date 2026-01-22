'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Automation } from '@/lib/db/schema';

interface Props {
  automations: Automation[];
  slug: string;
  hasCrmPlugin: boolean;
  customerTags: Array<{ id: string; label: string; color: string }>;
}

// Trigger type labels
const TRIGGER_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  'order.created': { label: 'הזמנה חדשה', icon: '🛒', color: 'bg-green-100 text-green-800' },
  'order.paid': { label: 'תשלום התקבל', icon: '💳', color: 'bg-emerald-100 text-emerald-800' },
  'order.fulfilled': { label: 'הזמנה נשלחה', icon: '📦', color: 'bg-blue-100 text-blue-800' },
  'order.cancelled': { label: 'הזמנה בוטלה', icon: '❌', color: 'bg-red-100 text-red-800' },
  'customer.created': { label: 'לקוח חדש', icon: '👤', color: 'bg-purple-100 text-purple-800' },
  'customer.tag_added': { label: 'תגית נוספה', icon: '🏷️', color: 'bg-indigo-100 text-indigo-800' },
  'product.low_stock': { label: 'מלאי נמוך', icon: '⚠️', color: 'bg-amber-100 text-amber-800' },
  'cart.abandoned': { label: 'עגלה נטושה', icon: '🛒', color: 'bg-orange-100 text-orange-800' },
};

// Action type labels
const ACTION_LABELS: Record<string, { label: string; icon: string }> = {
  'send_email': { label: 'שלח אימייל', icon: '📧' },
  'change_order_status': { label: 'שנה סטטוס הזמנה', icon: '📋' },
  'add_customer_tag': { label: 'הוסף תגית', icon: '🏷️' },
  'remove_customer_tag': { label: 'הסר תגית', icon: '🏷️' },
  'update_marketing_consent': { label: 'עדכן הסכמת שיווק', icon: '✉️' },
  'webhook_call': { label: 'קרא ל-Webhook', icon: '🔗' },
  'crm.create_task': { label: 'צור משימה (CRM)', icon: '✅' },
  'crm.add_note': { label: 'הוסף הערה (CRM)', icon: '📝' },
};

export default function AutomationsClient({ automations, slug, hasCrmPlugin, customerTags }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function toggleAutomation(id: string, isActive: boolean) {
    startTransition(async () => {
      await fetch(`/api/shops/${slug}/automations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      router.refresh();
    });
  }

  async function deleteAutomation(id: string) {
    if (!confirm('האם למחוק את האוטומציה?')) return;
    
    startTransition(async () => {
      await fetch(`/api/shops/${slug}/automations/${id}`, {
        method: 'DELETE',
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* New Automation Button */}
      <button
        onClick={() => setShowNewForm(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        אוטומציה חדשה
      </button>

      {/* New Automation Form Modal */}
      {showNewForm && (
        <NewAutomationForm
          slug={slug}
          hasCrmPlugin={hasCrmPlugin}
          customerTags={customerTags}
          onClose={() => setShowNewForm(false)}
          onSuccess={() => {
            setShowNewForm(false);
            router.refresh();
          }}
        />
      )}

      {/* Automations List */}
      <div className="space-y-3">
        {automations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="8" width="14" height="12" rx="2"/>
                <path d="M9 8V6a3 3 0 016 0v2"/>
                <circle cx="9" cy="13" r="1.5" fill="currentColor"/>
                <circle cx="15" cy="13" r="1.5" fill="currentColor"/>
                <path d="M10 17h4"/>
                <path d="M2 12h3"/>
                <path d="M19 12h3"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">אין אוטומציות עדיין</h3>
            <p className="text-sm text-slate-500 mb-4">צור את האוטומציה הראשונה שלך</p>
          </div>
        ) : (
          automations.map((automation) => (
            <AutomationCard
              key={automation.id}
              automation={automation}
              onToggle={toggleAutomation}
              onDelete={deleteAutomation}
              onEdit={() => setEditingId(automation.id)}
              isPending={isPending}
            />
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingId && (
        <EditAutomationForm
          automationId={editingId}
          slug={slug}
          hasCrmPlugin={hasCrmPlugin}
          customerTags={customerTags}
          onClose={() => setEditingId(null)}
          onSuccess={() => {
            setEditingId(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// Automation Card Component
function AutomationCard({
  automation,
  onToggle,
  onDelete,
  onEdit,
  isPending,
}: {
  automation: Automation;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
  isPending: boolean;
}) {
  const trigger = TRIGGER_LABELS[automation.triggerType] || { label: automation.triggerType, icon: '⚡', color: 'bg-gray-100 text-gray-800' };
  const action = ACTION_LABELS[automation.actionType] || { label: automation.actionType, icon: '⚙️' };

  return (
    <div className={`bg-white rounded-2xl border ${automation.isActive ? 'border-slate-200' : 'border-slate-200/50 opacity-60'} p-5 transition-all hover:shadow-sm`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${trigger.color}`}>
              {trigger.icon} {trigger.label}
            </span>
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
              {action.icon} {action.label}
            </span>
            {automation.isBuiltIn && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                מובנה
              </span>
            )}
          </div>

          {/* Name & Description */}
          <h3 className="text-base font-medium text-slate-900">{automation.name}</h3>
          {automation.description && (
            <p className="text-sm text-slate-500 mt-1">{automation.description}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span>הופעל {automation.totalRuns} פעמים</span>
            {automation.totalSuccesses > 0 && (
              <span className="text-green-600">✓ {automation.totalSuccesses} הצלחות</span>
            )}
            {automation.totalFailures > 0 && (
              <span className="text-red-600">✗ {automation.totalFailures} כישלונות</span>
            )}
            {automation.delayMinutes > 0 && (
              <span>⏱️ השהייה: {automation.delayMinutes} דקות</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Toggle */}
          <button
            onClick={() => onToggle(automation.id, !automation.isActive)}
            disabled={isPending}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              automation.isActive ? 'bg-green-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                automation.isActive ? 'right-0.5' : 'right-5'
              }`}
            />
          </button>

          {/* Edit */}
          <button
            onClick={onEdit}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>

          {/* Delete */}
          {!automation.isBuiltIn && (
            <button
              onClick={() => onDelete(automation.id)}
              disabled={isPending}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// New Automation Form
function NewAutomationForm({
  slug,
  hasCrmPlugin,
  customerTags,
  onClose,
  onSuccess,
}: {
  slug: string;
  hasCrmPlugin: boolean;
  customerTags: Array<{ id: string; label: string; color: string }>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('order.created');
  const [actionType, setActionType] = useState('send_email');
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [actionConfig, setActionConfig] = useState<Record<string, unknown>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/shops/${slug}/automations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          triggerType,
          actionType,
          actionConfig,
          delayMinutes,
          isActive: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'שגיאה ביצירת האוטומציה');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setIsLoading(false);
    }
  }

  // Available triggers
  const triggers = [
    { value: 'order.created', label: 'הזמנה חדשה' },
    { value: 'order.paid', label: 'תשלום התקבל' },
    { value: 'order.fulfilled', label: 'הזמנה נשלחה' },
    { value: 'order.cancelled', label: 'הזמנה בוטלה' },
    { value: 'customer.created', label: 'לקוח חדש' },
    { value: 'customer.tag_added', label: 'תגית נוספה ללקוח' },
    { value: 'product.low_stock', label: 'מלאי נמוך' },
  ];

  // Available actions - base actions for all stores
  const actions = [
    { value: 'send_email', label: 'שלח אימייל', requiresConfig: true },
    { value: 'change_order_status', label: 'שנה סטטוס הזמנה', requiresConfig: true },
    { value: 'update_marketing_consent', label: 'עדכן הסכמת שיווק', requiresConfig: true },
    { value: 'webhook_call', label: 'קרא ל-Webhook', requiresConfig: true },
    // CRM-specific actions (require CRM plugin for tag management)
    ...(hasCrmPlugin ? [
      { value: 'add_customer_tag', label: 'הוסף תגית ללקוח', requiresConfig: true },
      { value: 'remove_customer_tag', label: 'הסר תגית מלקוח', requiresConfig: true },
      { value: 'crm.create_task', label: 'צור משימה (CRM)', requiresConfig: true },
      { value: 'crm.add_note', label: 'הוסף הערה (CRM)', requiresConfig: true },
    ] : []),
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">אוטומציה חדשה</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              שם האוטומציה
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: שליחת מייל ללקוחות חדשים"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              תיאור (אופציונלי)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור קצר של מה האוטומציה עושה"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={2}
            />
          </div>

          {/* Trigger */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              כשזה קורה (טריגר)
            </label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {triggers.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Action */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              תעשה את זה (פעולה)
            </label>
            <select
              value={actionType}
              onChange={(e) => {
                setActionType(e.target.value);
                setActionConfig({});
              }}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {actions.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          {/* Action Config based on type */}
          {actionType === 'send_email' && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  נושא המייל
                </label>
                <input
                  type="text"
                  value={actionConfig.subject as string || ''}
                  onChange={(e) => setActionConfig({ ...actionConfig, subject: e.target.value })}
                  placeholder="לדוגמה: תודה על ההזמנה!"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  תוכן המייל
                  <span className="text-xs text-slate-400 font-normal mr-2">(תומך HTML)</span>
                </label>
                <textarea
                  value={actionConfig.body as string || ''}
                  onChange={(e) => setActionConfig({ ...actionConfig, body: e.target.value })}
                  placeholder={`<h1>שלום {{customer_name}}</h1>\n<p>תודה על ההזמנה שלך!</p>`}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-mono text-sm"
                  rows={6}
                  dir="ltr"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  משתנים זמינים: <code className="bg-slate-200 px-1 rounded">{'{{customer_name}}'}</code>, 
                  <code className="bg-slate-200 px-1 rounded mr-1">{'{{order_id}}'}</code>, 
                  <code className="bg-slate-200 px-1 rounded mr-1">{'{{order_total}}'}</code>,
                  <code className="bg-slate-200 px-1 rounded mr-1">{'{{store_name}}'}</code>
                </p>
              </div>
            </div>
          )}

          {(actionType === 'add_customer_tag' || actionType === 'remove_customer_tag') && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                בחר תגית
              </label>
              <select
                value={actionConfig.tagId as string || ''}
                onChange={(e) => setActionConfig({ ...actionConfig, tagId: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"
              >
                <option value="">בחר תגית...</option>
                {customerTags.map(tag => (
                  <option key={tag.id} value={tag.id}>{tag.label}</option>
                ))}
              </select>
            </div>
          )}

          {actionType === 'change_order_status' && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                סטטוס חדש
              </label>
              <select
                value={actionConfig.status as string || ''}
                onChange={(e) => setActionConfig({ ...actionConfig, status: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"
              >
                <option value="">בחר סטטוס...</option>
                <option value="unfulfilled">לא מולא</option>
                <option value="fulfilled">מולא</option>
                <option value="partial">מולא חלקית</option>
              </select>
            </div>
          )}

          {actionType === 'webhook_call' && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                כתובת ה-Webhook
              </label>
              <input
                type="url"
                value={actionConfig.url as string || ''}
                onChange={(e) => setActionConfig({ ...actionConfig, url: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"
                dir="ltr"
              />
            </div>
          )}

          {actionType === 'crm.create_task' && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  כותרת המשימה
                </label>
                <input
                  type="text"
                  value={actionConfig.title as string || ''}
                  onChange={(e) => setActionConfig({ ...actionConfig, title: e.target.value })}
                  placeholder="לדוגמה: צור קשר עם הלקוח"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  עדיפות
                </label>
                <select
                  value={actionConfig.priority as string || 'medium'}
                  onChange={(e) => setActionConfig({ ...actionConfig, priority: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"
                >
                  <option value="low">נמוכה</option>
                  <option value="medium">בינונית</option>
                  <option value="high">גבוהה</option>
                </select>
              </div>
            </div>
          )}

          {actionType === 'crm.add_note' && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                תוכן ההערה
              </label>
              <textarea
                value={actionConfig.content as string || ''}
                onChange={(e) => setActionConfig({ ...actionConfig, content: e.target.value })}
                placeholder="תוכן ההערה שתתווסף..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"
                rows={3}
              />
            </div>
          )}

          {/* Delay */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              השהייה (דקות)
            </label>
            <input
              type="number"
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 0)}
              min={0}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"
            />
            <p className="text-xs text-slate-500 mt-1">
              0 = בצע מיד, או הזן מספר דקות להמתנה
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isLoading || !name}
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-medium disabled:opacity-50"
            >
              {isLoading ? 'יוצר...' : 'צור אוטומציה'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Automation Form - Simplified version
function EditAutomationForm({
  automationId,
  slug,
  hasCrmPlugin,
  customerTags,
  onClose,
  onSuccess,
}: {
  automationId: string;
  slug: string;
  hasCrmPlugin: boolean;
  customerTags: Array<{ id: string; label: string; color: string }>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [automation, setAutomation] = useState<Automation | null>(null);
  
  // Load automation data
  useState(() => {
    fetch(`/api/shops/${slug}/automations/${automationId}`)
      .then(res => res.json())
      .then(data => setAutomation(data.automation))
      .catch(() => setError('שגיאה בטעינת האוטומציה'));
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!automation) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/shops/${slug}/automations/${automationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: automation.name,
          description: automation.description,
          actionConfig: automation.actionConfig,
          delayMinutes: automation.delayMinutes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'שגיאה בעדכון האוטומציה');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setIsLoading(false);
    }
  }

  if (!automation) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-indigo-600 rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">עריכת אוטומציה</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              שם האוטומציה
            </label>
            <input
              type="text"
              value={automation.name}
              onChange={(e) => setAutomation({ ...automation, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              תיאור
            </label>
            <textarea
              value={automation.description || ''}
              onChange={(e) => setAutomation({ ...automation, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              rows={2}
            />
          </div>

          {/* Delay */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              השהייה (דקות)
            </label>
            <input
              type="number"
              value={automation.delayMinutes}
              onChange={(e) => setAutomation({ ...automation, delayMinutes: parseInt(e.target.value) || 0 })}
              min={0}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-medium disabled:opacity-50"
            >
              {isLoading ? 'שומר...' : 'שמור שינויים'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

