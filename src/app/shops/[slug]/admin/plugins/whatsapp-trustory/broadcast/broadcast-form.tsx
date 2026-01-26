'use client';

/**
 * Broadcast Form
 * 
 * טופס שליחת דיוור - בחירת נמענים, כתיבת הודעה ושליחה
 */

import { useState, useEffect, useTransition } from 'react';
import { 
  Users, MessageCircle, Send, Loader2, CheckCircle, 
  XCircle, Filter, Search, Image, Video, FileText,
  ChevronDown, X, AlertTriangle
} from 'lucide-react';
import { 
  getContactsForBroadcast, 
  sendBroadcast, 
  type ContactForBroadcast,
  type ContactFilter 
} from '../actions';
import { MessageTemplates, replaceTemplateVariables } from '@/lib/whatsapp-trustory/templates';

interface Props {
  storeId: string;
  storeSlug: string;
  storeName: string;
}

const FILTER_OPTIONS: { value: ContactFilter; label: string; icon: string }[] = [
  { value: 'all', label: 'כל אנשי הקשר', icon: '👥' },
  { value: 'customers', label: 'לקוחות (עם הזמנות)', icon: '🛒' },
  { value: 'newsletter', label: 'ניוזלטר', icon: '📧' },
  { value: 'club_member', label: 'חברי מועדון', icon: '👑' },
  { value: 'contact_form', label: 'יצירת קשר', icon: '📝' },
  { value: 'popup_form', label: 'מפופאפ', icon: '💬' },
];

export function BroadcastForm({ storeId, storeSlug, storeName }: Props) {
  // State
  const [filter, setFilter] = useState<ContactFilter>('all');
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<ContactForBroadcast[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const [message, setMessage] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [mediaType, setMediaType] = useState<'text' | 'image' | 'video' | 'document'>('text');
  const [mediaUrl, setMediaUrl] = useState('');
  
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    total: number;
    sent: number;
    failed: number;
  } | null>(null);
  
  const [showConfirm, setShowConfirm] = useState(false);

  // Load contacts
  useEffect(() => {
    loadContacts();
  }, [filter, search]);

  async function loadContacts() {
    setIsLoading(true);
    try {
      const result = await getContactsForBroadcast(storeId, filter, search || undefined);
      setContacts(result.contacts);
      setTotalCount(result.total);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle template selection
  function handleTemplateSelect(id: string) {
    setTemplateId(id);
    const template = MessageTemplates.find(t => t.id === id);
    if (template && template.content) {
      // Replace store name in template
      const messageWithStore = replaceTemplateVariables(template.content, {
        storeName,
        storeUrl: `https://my-quickshop.com/shops/${storeSlug}`,
      });
      setMessage(messageWithStore);
    }
  }

  // Toggle selection
  function toggleSelect(id: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }

  // Select all / none
  function selectAll() {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map(c => c.id)));
    }
  }

  // Get selected phones
  function getSelectedPhones(): string[] {
    return contacts
      .filter(c => selectedIds.has(c.id))
      .map(c => c.phone);
  }

  // Send broadcast
  async function handleSend() {
    if (selectedIds.size === 0) return;
    if (!message.trim()) return;

    setShowConfirm(false);
    setIsSending(true);
    setSendResult(null);

    try {
      const phones = getSelectedPhones();
      const result = await sendBroadcast(storeId, storeSlug, phones, message, {
        templateId: templateId || undefined,
        mediaType,
        mediaUrl: mediaUrl || undefined,
      });
      
      setSendResult({
        total: result.total,
        sent: result.sent,
        failed: result.failed,
      });

      // Clear selection after send
      if (result.sent > 0) {
        setSelectedIds(new Set());
      }
    } catch (error) {
      console.error('Send error:', error);
      setSendResult({
        total: selectedIds.size,
        sent: 0,
        failed: selectedIds.size,
      });
    } finally {
      setIsSending(false);
    }
  }

  const selectedCount = selectedIds.size;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Contact Selection */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">סנן לפי:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === option.value
                    ? 'bg-green-100 text-green-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.icon} {option.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם, טלפון או אימייל..."
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Selection Header */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedIds.size === contacts.length && contacts.length > 0}
              onChange={selectAll}
              className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
            />
            <span className="text-sm text-gray-600">
              {selectedCount > 0 ? (
                <span className="font-medium text-green-700">{selectedCount} נבחרו</span>
              ) : (
                `${totalCount} אנשי קשר`
              )}
            </span>
          </div>
          
          {selectedCount > 0 && (
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              נקה בחירה
            </button>
          )}
        </div>

        {/* Contacts List */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">טוען...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">לא נמצאו אנשי קשר</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {contacts.map(contact => (
                <label
                  key={contact.id}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedIds.has(contact.id) ? 'bg-green-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(contact.id)}
                    onChange={() => toggleSelect(contact.id)}
                    className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {contact.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate" dir="ltr">
                      {contact.phone}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    contact.type === 'customer' 
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {contact.type === 'customer' ? 'לקוח' : contact.source || 'איש קשר'}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Message Composition */}
      <div className="space-y-4">
        {/* Templates */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">תבנית הודעה</h3>
          <select
            value={templateId}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">-- בחר תבנית (אופציונלי) --</option>
            <optgroup label="הזמנות">
              {MessageTemplates.filter(t => t.category === 'order').map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </optgroup>
            <optgroup label="שיווק">
              {MessageTemplates.filter(t => t.category === 'marketing').map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </optgroup>
            <optgroup label="לקוחות">
              {MessageTemplates.filter(t => t.category === 'customer').map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </optgroup>
            <optgroup label="עגלה">
              {MessageTemplates.filter(t => t.category === 'cart').map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Message */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">תוכן ההודעה</h3>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="כתוב את ההודעה שלך..."
            rows={6}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-2">
            💡 טיפ: השתמש ב-{'{customerName}'} לשם הלקוח, {'{storeName}'} לשם החנות
          </p>
        </div>

        {/* Media Type */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">סוג הודעה</h3>
          <div className="flex gap-2">
            {[
              { type: 'text', label: 'טקסט', icon: MessageCircle },
              { type: 'image', label: 'תמונה', icon: Image },
              { type: 'video', label: 'וידאו', icon: Video },
              { type: 'document', label: 'מסמך', icon: FileText },
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setMediaType(type as typeof mediaType)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  mediaType === type
                    ? 'bg-green-100 text-green-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {mediaType !== 'text' && (
            <div className="mt-3 space-y-2">
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder={`URL ל${mediaType === 'image' ? 'תמונה' : mediaType === 'video' ? 'וידאו' : 'מסמך'}`}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                dir="ltr"
              />
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">💡 איך להשיג לינק?</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>עבור ל-<strong>הגדרות → מדיה</strong> בתפריט</li>
                  <li>העלה את הקובץ (תמונה/וידאו/מסמך)</li>
                  <li>לחץ על <strong>"העתק לינק"</strong></li>
                  <li>הדבק כאן את הלינק</li>
                </ol>
                <p className="mt-2 text-xs text-blue-600">
                  ⚠️ הלינק חייב להיות ציבורי ולהתחיל ב-HTTPS
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={selectedCount === 0 || !message.trim() || isSending}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
        >
          {isSending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              שולח...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              שלח ל-{selectedCount} נמענים
            </>
          )}
        </button>

        {/* Send Result */}
        {sendResult && (
          <div className={`p-4 rounded-xl flex items-start gap-3 ${
            sendResult.failed === 0
              ? 'bg-green-50 border border-green-200'
              : sendResult.sent === 0
                ? 'bg-red-50 border border-red-200'
                : 'bg-yellow-50 border border-yellow-200'
          }`}>
            {sendResult.failed === 0 ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : sendResult.sent === 0 ? (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`font-medium ${
                sendResult.failed === 0 ? 'text-green-800' : 
                sendResult.sent === 0 ? 'text-red-800' : 'text-yellow-800'
              }`}>
                {sendResult.failed === 0 
                  ? 'כל ההודעות נשלחו בהצלחה!' 
                  : sendResult.sent === 0
                    ? 'שליחה נכשלה'
                    : 'נשלח חלקית'}
              </p>
              <p className="text-sm mt-1 text-gray-600">
                נשלחו {sendResult.sent} מתוך {sendResult.total} הודעות
                {sendResult.failed > 0 && ` (${sendResult.failed} נכשלו)`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6" dir="rtl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              אישור שליחה
            </h3>
            <p className="text-gray-600 mb-4">
              אתה עומד לשלוח הודעת WhatsApp ל-<strong>{selectedCount}</strong> נמענים.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 max-h-32 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{message}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                ביטול
              </button>
              <button
                onClick={handleSend}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                שלח עכשיו
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

