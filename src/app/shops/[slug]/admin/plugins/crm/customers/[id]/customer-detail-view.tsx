'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ============================================
// Customer Detail View - Client Component
// Full customer profile with interactive sections
// ============================================

interface CrmTag {
  id: string;
  label: string;
  color: string;
  isDefault?: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string | null;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  total: string;
  createdAt: Date | null;
  utmSource: string | null;
  createdByName: string | null;
}

interface Note {
  id: string;
  content: string;
  createdAt: Date;
  userName: string | null;
  userEmail: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  createdAt: Date;
  assignedToName: string | null;
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables?: string[];
}

interface CustomerDetailViewProps {
  storeId: string;
  storeSlug: string;
  customer: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    totalOrders: number | null;
    totalSpent: string | null;
    creditBalance: string | null;
    acceptsMarketing: boolean;
    defaultAddress: Record<string, unknown> | null;
    notes: string | null;
    createdAt: Date | null;
    lastOrderAt: Date | null;
    lastLoginAt: Date | null;
  };
  customerName: string;
  customerTags: string[];
  crmTags: CrmTag[];
  orders: Order[];
  notes: Note[];
  tasks: Task[];
  // WhatsApp integration (optional - only when plugin is installed)
  isWhatsAppEnabled?: boolean;
  whatsappTemplates?: WhatsAppTemplate[];
}

export function CustomerDetailView({
  storeId,
  storeSlug,
  customer,
  customerName,
  customerTags,
  crmTags,
  orders,
  notes: initialNotes,
  tasks: initialTasks,
  isWhatsAppEnabled = false,
  whatsappTemplates = [],
}: CustomerDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTags, setSelectedTags] = useState<string[]>(customerTags);
  const [savingTags, setSavingTags] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'notes' | 'tasks'>('orders');
  
  // WhatsApp modal state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = whatsappTemplates.find(t => t.id === templateId);
    if (template) {
      // Replace variables in template
      let message = template.content;
      message = message.replace(/\{\{customerName\}\}/g, customerName);
      message = message.replace(/\{\{storeName\}\}/g, ''); // Will be filled by server
      setWhatsappMessage(message);
    }
  };

  // Handle send WhatsApp
  const handleSendWhatsApp = async () => {
    if (!whatsappMessage.trim() || !customer.phone) return;
    
    setSendingWhatsApp(true);
    try {
      const response = await fetch('/api/whatsapp-trustory/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          phoneNumber: customer.phone,
          message: whatsappMessage.trim(),
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('ההודעה נשלחה בהצלחה!');
        setShowWhatsAppModal(false);
        setWhatsappMessage('');
        setSelectedTemplate('');
      } else {
        alert(result.error || 'שגיאה בשליחת ההודעה');
      }
    } catch (error) {
      console.error('Failed to send WhatsApp:', error);
      alert('שגיאה בשליחת ההודעה');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  // Handle tag toggle
  const handleTagToggle = async (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(t => t !== tagId)
      : [...selectedTags, tagId];
    
    setSelectedTags(newTags);
    setSavingTags(true);

    try {
      await fetch(`/api/crm/customers/${customer.id}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to update tags:', error);
      setSelectedTags(customerTags);
    } finally {
      setSavingTags(false);
    }
  };

  // Handle add note
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setAddingNote(true);
    try {
      await fetch('/api/crm/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          customerId: customer.id,
          content: newNote.trim(),
        }),
      });
      setNewNote('');
      router.refresh();
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setAddingNote(false);
    }
  };

  // Handle delete note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('האם למחוק את ההערה?')) return;
    
    try {
      await fetch(`/api/crm/notes?noteId=${noteId}`, { method: 'DELETE' });
      router.refresh();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  // Handle task status change
  const handleTaskStatus = async (taskId: string, newStatus: string) => {
    startTransition(async () => {
      try {
        await fetch('/api/crm/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, status: newStatus }),
        });
        router.refresh();
      } catch (error) {
        console.error('Failed to update task:', error);
      }
    });
  };

  const formatCurrency = (n: string | null) => n ? `₪${Number(n).toLocaleString()}` : '₪0';
  const formatDate = (d: Date | null) => d ? new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  const formatDateTime = (d: Date | null) => d ? new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

  const priorityIcons: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' };
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-slate-100 text-slate-800',
  };
  const financialColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-amber-100 text-amber-800',
    refunded: 'bg-red-100 text-red-800',
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Main Column */}
      <div className="col-span-2 space-y-6">
        {/* Customer Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <span className="text-2xl font-bold text-white">
                  {customerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{customerName}</h1>
                <p className="text-slate-500">{customer.email}</p>
                {customer.phone && (
                  <p className="text-slate-400">{customer.phone}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <a
                href={`mailto:${customer.email}`}
                className="p-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                title="שלח אימייל"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </a>
              {customer.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  className="p-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                  title="התקשר"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </a>
              )}
              {/* WhatsApp Button - only show if plugin is enabled and customer has phone */}
              {isWhatsAppEnabled && customer.phone && (
                <button
                  onClick={() => setShowWhatsAppModal(true)}
                  className="p-2.5 text-white bg-green-500 rounded-xl hover:bg-green-600 transition-colors shadow-sm"
                  title="שלח הודעת וואטסאפ"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{customer.totalOrders || 0}</p>
              <p className="text-sm text-slate-500">הזמנות</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(customer.totalSpent)}</p>
              <p className="text-sm text-slate-500">סה״כ רכישות</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">{formatCurrency(customer.creditBalance)}</p>
              <p className="text-sm text-slate-500">קרדיט</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-lg font-bold text-slate-900">{formatDate(customer.lastOrderAt)}</p>
              <p className="text-sm text-slate-500">הזמנה אחרונה</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Tab Headers */}
          <div className="flex items-center border-b border-slate-200">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === 'orders' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              הזמנות ({orders.length})
              {activeTab === 'orders' && (
                <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-indigo-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === 'notes' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              הערות ({initialNotes.length})
              {activeTab === 'notes' && (
                <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-indigo-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === 'tasks' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              משימות ({initialTasks.filter(t => t.status !== 'completed').length})
              {activeTab === 'tasks' && (
                <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-indigo-600" />
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                {orders.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">אין הזמנות</p>
                ) : (
                  <div className="space-y-3">
                    {orders.map(order => (
                      <Link
                        key={order.id}
                        href={`/shops/${storeSlug}/admin/orders/${order.id}`}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">#{order.orderNumber}</span>
                              {order.utmSource === 'pos' && (
                                <span className="text-xs px-2 py-0.5 bg-slate-900 text-white rounded-full">POS</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">
                              {formatDateTime(order.createdAt)}
                              {order.createdByName && ` • ${order.createdByName}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${financialColors[order.financialStatus || ''] || 'bg-slate-100 text-slate-800'}`}>
                            {order.financialStatus === 'paid' ? 'שולם' : 
                             order.financialStatus === 'pending' ? 'ממתין' : 
                             order.financialStatus === 'refunded' ? 'זוכה' : order.financialStatus}
                          </span>
                          <span className="font-bold text-slate-900">{formatCurrency(order.total)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                {/* Add Note Form */}
                <div className="flex gap-3">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="הוסף הערה על הלקוח..."
                    rows={3}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all resize-none"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={addingNote || !newNote.trim()}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 self-end font-medium"
                  >
                    {addingNote ? '...' : 'הוסף'}
                  </button>
                </div>

                {/* Notes List */}
                {initialNotes.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">אין הערות</p>
                ) : (
                  <div className="space-y-3">
                    {initialNotes.map(note => (
                      <div key={note.id} className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-slate-900">{note.userName || note.userEmail || 'משתמש'}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500">{formatDateTime(note.createdAt)}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">משימות הקשורות ללקוח</p>
                  <Link
                    href={`/shops/${storeSlug}/admin/plugins/crm/tasks`}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    + צור משימה
                  </Link>
                </div>

                {initialTasks.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">אין משימות</p>
                ) : (
                  <div className="space-y-3">
                    {initialTasks.map(task => (
                      <div
                        key={task.id}
                        className={`p-4 border rounded-xl flex items-center justify-between ${
                          task.status === 'completed' ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                            disabled={isPending}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                              task.status === 'completed'
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 hover:border-emerald-500'
                            }`}
                          >
                            {task.status === 'completed' && (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                {task.title}
                              </span>
                              <span>{priorityIcons[task.priority] || ''}</span>
                            </div>
                            {task.description && (
                              <p className="text-sm text-slate-500 mt-0.5">{task.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                              {task.assignedToName && <span>מוקצה ל: {task.assignedToName}</span>}
                              {task.dueDate && <span>• יעד: {formatDate(task.dueDate)}</span>}
                            </div>
                          </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[task.status] || ''}`}>
                          {task.status === 'pending' ? 'ממתין' : task.status === 'in_progress' ? 'בביצוע' : task.status === 'completed' ? 'הושלם' : task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Tags */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">תגיות</h3>
          
          {crmTags.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500 mb-2">לא הוגדרו תגיות</p>
              <Link
                href={`/shops/${storeSlug}/admin/plugins/crm/settings`}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                הגדר תגיות
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {crmTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                const buttonStyle: React.CSSProperties = {
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                };
                return (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    disabled={savingTags}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? 'ring-2 ring-offset-2'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                    style={isSelected ? { ...buttonStyle, borderColor: tag.color } : buttonStyle}
                  >
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {tag.label}
                  </button>
                );
              })}
            </div>
          )}
          {savingTags && (
            <p className="text-xs text-slate-400 mt-2">שומר...</p>
          )}
        </div>

        {/* פרטי לקוח */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">פרטים</h3>
          
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-slate-400">אימייל</p>
              <p className="font-medium text-slate-900">{customer.email}</p>
            </div>
            
            {customer.phone && (
              <div>
                <p className="text-slate-400">טלפון</p>
                <p className="font-medium text-slate-900">{customer.phone}</p>
              </div>
            )}
            
            <div>
              <p className="text-slate-400">נרשם</p>
              <p className="font-medium text-slate-900">{formatDate(customer.createdAt)}</p>
            </div>

            {customer.lastLoginAt && (
              <div>
                <p className="text-slate-400">כניסה אחרונה</p>
                <p className="font-medium text-slate-900">{formatDate(customer.lastLoginAt)}</p>
              </div>
            )}

            <div>
              <p className="text-slate-400">מקבל שיווק</p>
              <p className="font-medium text-slate-900">{customer.acceptsMarketing ? '✓ כן' : '✗ לא'}</p>
            </div>
          </div>
        </div>

        {/* Default Address */}
        {customer.defaultAddress && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">כתובת</h3>
            
            {(() => {
              const addr = customer.defaultAddress as { 
                street?: string; 
                city?: string; 
                zipCode?: string;
                houseNumber?: string;
                apartment?: string;
                floor?: string;
              };
              return (
                <div className="text-sm text-slate-600 space-y-1">
                  {addr.street && <p>{addr.street} {addr.houseNumber}</p>}
                  {addr.apartment && <p>דירה {addr.apartment}</p>}
                  {addr.floor && <p>קומה {addr.floor}</p>}
                  {addr.city && <p>{addr.city}</p>}
                  {addr.zipCode && <p>מיקוד: {addr.zipCode}</p>}
                </div>
              );
            })()}
          </div>
        )}

        {/* Internal Notes */}
        {customer.notes && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">הערות פנימיות</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{customer.notes}</p>
          </div>
        )}
      </div>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && isWhatsAppEnabled && customer.phone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">שליחת הודעת וואטסאפ</h3>
                  <p className="text-sm text-slate-500">אל {customerName} • {customer.phone}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowWhatsAppModal(false);
                  setWhatsappMessage('');
                  setSelectedTemplate('');
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Template Selection */}
              {whatsappTemplates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    בחר תבנית (אופציונלי)
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-green-300 focus:ring-2 focus:ring-green-100 transition-all"
                    disabled={sendingWhatsApp}
                  >
                    <option value="">הקלד הודעה חופשית...</option>
                    {whatsappTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  תוכן ההודעה
                </label>
                <textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  placeholder="הקלד את הודעת הוואטסאפ..."
                  rows={5}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-green-300 focus:ring-2 focus:ring-green-100 transition-all resize-none"
                  disabled={sendingWhatsApp}
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  משתנים זמינים: {`{{customerName}}`} = שם הלקוח
                </p>
              </div>

              {/* Marketing Consent Warning */}
              {!customer.acceptsMarketing && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                  <span className="text-amber-500">⚠️</span>
                  <p className="text-sm text-amber-800">
                    <strong>לקוח זה לא אישר קבלת דיוור.</strong> QuickShop עושה את המירב למנוע ספאם - 
                    שליחת הודעות שיווקיות ללקוח זה עלולה להפר את חוק הספאם. 
                    מותר לשלוח רק הודעות שירות הקשורות להזמנות קיימות.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowWhatsAppModal(false);
                  setWhatsappMessage('');
                  setSelectedTemplate('');
                }}
                className="px-5 py-2.5 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                disabled={sendingWhatsApp}
              >
                ביטול
              </button>
              <button
                onClick={handleSendWhatsApp}
                disabled={sendingWhatsApp || !whatsappMessage.trim()}
                className="px-6 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sendingWhatsApp ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    שולח...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                    שלח הודעה
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

