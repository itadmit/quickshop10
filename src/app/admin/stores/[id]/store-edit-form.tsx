'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Trash2 } from 'lucide-react';

interface Store {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  customDomain: string | null;
}

interface StoreEditFormProps {
  store: Store;
}

export function StoreEditForm({ store }: StoreEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: store.name,
    slug: store.slug,
    isActive: store.isActive,
    customDomain: store.customDomain || '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/stores/${store.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'שגיאה בעדכון החנות');
        }

        setMessage({ type: 'success', text: 'החנות עודכנה בהצלחה' });
        router.refresh();
      } catch (error: any) {
        setMessage({ type: 'error', text: error.message });
      }
    });
  };

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את החנות? פעולה זו לא ניתנת לביטול.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/stores/${store.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'שגיאה במחיקת החנות');
      }

      router.push('/admin/stores');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-4">עריכת פרטים</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם החנות</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-sm"
            dir="ltr"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">דומיין מותאם</label>
          <input
            type="text"
            value={formData.customDomain}
            onChange={(e) => setFormData(prev => ({ ...prev, customDomain: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-sm"
            dir="ltr"
            placeholder="example.com"
          />
        </div>

        <div className="flex items-center gap-3 py-2">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              formData.isActive ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                formData.isActive ? 'right-1' : 'right-6'
              }`}
            />
          </button>
          <span className="text-sm text-gray-700">חנות פעילה</span>
        </div>

        {message && (
          <div className={`p-3 rounded-xl text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            שמור
          </button>
          
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}




