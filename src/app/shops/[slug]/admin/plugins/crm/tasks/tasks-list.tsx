'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ============================================
// Tasks List - Client Component
// Display, filter, and manage CRM tasks
// ============================================

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completedAt: Date | null;
  createdAt: Date | null;
  customer: {
    id: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
  order: {
    id: string | null;
    orderNumber: string | null;
  } | null;
  assignedToUser: {
    id: string | null;
    name: string | null;
    email: string | null;
  } | null;
}

interface TeamMember {
  id: string;
  name: string;
}

interface TasksListProps {
  storeId: string;
  storeSlug: string;
  tasks: Task[];
  teamMembers: TeamMember[];
  stats: {
    pending: number;
    inProgress: number;
    completed: number;
    total: number;
  };
  currentFilters: {
    status: string;
    assignedTo: string;
    priority: string;
  };
}

const statusLabels: Record<string, string> = {
  pending: 'ממתין',
  in_progress: 'בביצוע',
  completed: 'הושלם',
  cancelled: 'בוטל',
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const priorityLabels: Record<string, string> = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה',
};

const priorityColors: Record<string, string> = {
  low: 'text-gray-500',
  medium: 'text-amber-500',
  high: 'text-red-500',
};

export function TasksList({
  storeId,
  storeSlug,
  tasks,
  teamMembers,
  stats,
  currentFilters,
}: TasksListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    assignedTo: '',
  });
  const [creating, setCreating] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    const url = new URL(window.location.href);
    if (value === 'all') {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
    router.push(url.pathname + url.search);
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    startTransition(async () => {
      try {
        await fetch('/api/crm/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, status: newStatus }),
        });
        router.refresh();
      } catch (error) {
        console.error('Failed to update task status:', error);
      }
    });
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    
    setCreating(true);
    try {
      const response = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          title: newTask.title,
          description: newTask.description || null,
          priority: newTask.priority,
          dueDate: newTask.dueDate || null,
          assignedTo: newTask.assignedTo || null,
        }),
      });

      if (response.ok) {
        setShowNewTaskModal(false);
        setNewTask({ title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '' });
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('האם למחוק את המשימה?')) return;
    
    try {
      await fetch(`/api/crm/tasks?taskId=${taskId}`, { method: 'DELETE' });
      router.refresh();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isOverdue = (dueDate: Date | null, status: string) => {
    if (!dueDate || status === 'completed' || status === 'cancelled') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <button
          onClick={() => handleFilterChange('status', 'all')}
          className={`bg-white rounded-xl border p-4 text-right transition-all ${
            currentFilters.status === 'all' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">כל המשימות</p>
        </button>
        <button
          onClick={() => handleFilterChange('status', 'pending')}
          className={`bg-white rounded-xl border p-4 text-right transition-all ${
            currentFilters.status === 'pending' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-sm text-gray-500">ממתינות</p>
        </button>
        <button
          onClick={() => handleFilterChange('status', 'in_progress')}
          className={`bg-white rounded-xl border p-4 text-right transition-all ${
            currentFilters.status === 'in_progress' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
          <p className="text-sm text-gray-500">בביצוע</p>
        </button>
        <button
          onClick={() => handleFilterChange('status', 'completed')}
          className={`bg-white rounded-xl border p-4 text-right transition-all ${
            currentFilters.status === 'completed' ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-sm text-gray-500">הושלמו</p>
        </button>
      </div>

      {/* Filters & New Task Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Assigned To Filter */}
          <select
            value={currentFilters.assignedTo}
            onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
          >
            <option value="all">כל הצוות</option>
            {teamMembers.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={currentFilters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
          >
            <option value="all">כל העדיפויות</option>
            <option value="high">גבוהה</option>
            <option value="medium">בינונית</option>
            <option value="low">נמוכה</option>
          </select>
        </div>

        <button
          onClick={() => setShowNewTaskModal(true)}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          משימה חדשה
        </button>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {tasks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">אין משימות</h3>
            <p className="text-gray-500">צור משימה חדשה כדי להתחיל</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tasks.map(task => (
              <div
                key={task.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  isOverdue(task.dueDate, task.status) ? 'bg-red-50/50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleStatusChange(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                      disabled={isPending}
                      className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-colors ${
                        task.status === 'completed'
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {task.status === 'completed' && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {task.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[task.status]}`}>
                          {statusLabels[task.status]}
                        </span>
                        {/* Priority indicator */}
                        <span className={`text-xs ${priorityColors[task.priority]}`}>
                          {task.priority === 'high' && '⬆️'}
                          {task.priority === 'medium' && '➡️'}
                          {task.priority === 'low' && '⬇️'}
                          {priorityLabels[task.priority]}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {task.customer?.id && (
                          <Link
                            href={`/shops/${storeSlug}/admin/contacts/${task.customer.id}`}
                            className="flex items-center gap-1 hover:text-blue-600"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {task.customer.firstName || task.customer.lastName
                              ? `${task.customer.firstName || ''} ${task.customer.lastName || ''}`.trim()
                              : task.customer.email}
                          </Link>
                        )}
                        {task.order?.id && (
                          <Link
                            href={`/shops/${storeSlug}/admin/orders/${task.order.id}`}
                            className="flex items-center gap-1 hover:text-blue-600"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            #{task.order.orderNumber}
                          </Link>
                        )}
                        {task.assignedToUser?.id && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {task.assignedToUser.name || task.assignedToUser.email}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className={`flex items-center gap-1 ${isOverdue(task.dueDate, task.status) ? 'text-red-600 font-medium' : ''}`}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(task.dueDate)}
                            {isOverdue(task.dueDate, task.status) && ' (באיחור!)'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className="text-xs px-2 py-1 border border-gray-200 rounded bg-white"
                    >
                      <option value="pending">ממתין</option>
                      <option value="in_progress">בביצוע</option>
                      <option value="completed">הושלם</option>
                      <option value="cancelled">בוטל</option>
                    </select>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">משימה חדשה</h2>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">כותרת *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="מה צריך לעשות?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="פרטים נוספים..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">עדיפות</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="low">נמוכה</option>
                    <option value="medium">בינונית</option>
                    <option value="high">גבוהה</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך יעד</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">הקצה ל</label>
                <select
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">לא מוקצה</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleCreateTask}
                disabled={creating || !newTask.title.trim()}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {creating ? 'יוצר...' : 'צור משימה'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

