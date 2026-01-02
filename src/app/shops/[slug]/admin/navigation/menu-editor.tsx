'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addMenuItem, updateMenuItem, deleteMenuItem, reorderMenuItems } from './actions';

interface MenuItem {
  id: string;
  menuId: string;
  parentId: string | null;
  title: string;
  linkType: 'url' | 'page' | 'category' | 'product';
  linkUrl: string | null;
  linkResourceId: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface MenuEditorProps {
  menu: { id: string; name: string; handle: string };
  items: MenuItem[];
  slug: string;
  availablePages: Array<{ id: string; title: string; slug: string }>;
  availableCategories: Array<{ id: string; name: string; slug: string }>;
}

export function MenuEditor({
  menu,
  items,
  slug,
  availablePages,
  availableCategories,
}: MenuEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newItem, setNewItem] = useState<{
    title: string;
    linkType: 'url' | 'page' | 'category';
    linkUrl: string;
    linkResourceId: string;
  }>({
    title: '',
    linkType: 'url',
    linkUrl: '',
    linkResourceId: '',
  });

  const handleAdd = () => {
    setError(null);
    
    if (!newItem.title.trim()) {
      setError('יש להזין כותרת');
      return;
    }

    if (newItem.linkType === 'url' && !newItem.linkUrl.trim()) {
      setError('יש להזין כתובת URL');
      return;
    }

    if ((newItem.linkType === 'page' || newItem.linkType === 'category') && !newItem.linkResourceId) {
      setError('יש לבחור עמוד או קטגוריה');
      return;
    }

    startTransition(async () => {
      const result = await addMenuItem(menu.id, slug, {
        title: newItem.title,
        linkType: newItem.linkType,
        linkUrl: newItem.linkType === 'url' ? newItem.linkUrl : null,
        linkResourceId: newItem.linkType !== 'url' ? newItem.linkResourceId : null,
        sortOrder: items.length,
      });

      if (result.success) {
        setNewItem({ title: '', linkType: 'url', linkUrl: '', linkResourceId: '' });
        setShowAddForm(false);
        router.refresh();
      } else {
        setError(result.error || 'שגיאה בהוספת פריט');
      }
    });
  };

  const handleDelete = (itemId: string) => {
    startTransition(async () => {
      await deleteMenuItem(itemId, slug);
      router.refresh();
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...items];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    
    startTransition(async () => {
      await reorderMenuItems(
        menu.id,
        slug,
        newOrder.map((item, i) => ({ id: item.id, sortOrder: i }))
      );
      router.refresh();
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newOrder = [...items];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    
    startTransition(async () => {
      await reorderMenuItems(
        menu.id,
        slug,
        newOrder.map((item, i) => ({ id: item.id, sortOrder: i }))
      );
      router.refresh();
    });
  };

  const getLinkDisplay = (item: MenuItem) => {
    if (item.linkType === 'url') return item.linkUrl;
    if (item.linkType === 'page') {
      const page = availablePages.find(p => p.id === item.linkResourceId);
      return page ? `/${page.slug}` : 'עמוד לא נמצא';
    }
    if (item.linkType === 'category') {
      const cat = availableCategories.find(c => c.id === item.linkResourceId);
      return cat ? `/categories/${cat.slug}` : 'קטגוריה לא נמצאה';
    }
    return '';
  };

  return (
    <div className="p-4">
      {/* Items List */}
      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-4">אין פריטים בתפריט</p>
      ) : (
        <div className="space-y-2 mb-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0 || isPending}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2l4 4H2l4-4z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === items.length - 1 || isPending}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 10l4-4H2l4 4z" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500" dir="ltr">{getLinkDisplay(item)}</p>
              </div>
              
              <span className={`px-2 py-0.5 text-xs rounded ${
                item.linkType === 'url' ? 'bg-blue-100 text-blue-700' :
                item.linkType === 'page' ? 'bg-green-100 text-green-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {item.linkType === 'url' ? 'קישור' : item.linkType === 'page' ? 'עמוד' : 'קטגוריה'}
              </span>
              
              <button
                onClick={() => handleDelete(item.id)}
                disabled={isPending}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 3h12M4.67 3V2a1 1 0 011-1h2.66a1 1 0 011 1v1m1.67 0v9a1 1 0 01-1 1H4a1 1 0 01-1-1V3h10z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Form */}
      {showAddForm ? (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">כותרת</label>
              <input
                type="text"
                value={newItem.title}
                onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                placeholder="שם הקישור"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">סוג</label>
              <select
                value={newItem.linkType}
                onChange={(e) => setNewItem(prev => ({ 
                  ...prev, 
                  linkType: e.target.value as 'url' | 'page' | 'category',
                  linkUrl: '',
                  linkResourceId: '',
                }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
              >
                <option value="url">קישור חיצוני</option>
                <option value="page">עמוד</option>
                <option value="category">קטגוריה</option>
              </select>
            </div>
          </div>

          {newItem.linkType === 'url' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">כתובת URL</label>
              <input
                type="url"
                value={newItem.linkUrl}
                onChange={(e) => setNewItem(prev => ({ ...prev, linkUrl: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                placeholder="https://example.com"
                dir="ltr"
              />
            </div>
          )}

          {newItem.linkType === 'page' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">בחר עמוד</label>
              <select
                value={newItem.linkResourceId}
                onChange={(e) => setNewItem(prev => ({ ...prev, linkResourceId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
              >
                <option value="">בחר עמוד...</option>
                {availablePages.map((page) => (
                  <option key={page.id} value={page.id}>{page.title}</option>
                ))}
              </select>
              {availablePages.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">אין עמודים - צור עמודים בניהול עמודים</p>
              )}
            </div>
          )}

          {newItem.linkType === 'category' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">בחר קטגוריה</label>
              <select
                value={newItem.linkResourceId}
                onChange={(e) => setNewItem(prev => ({ ...prev, linkResourceId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
              >
                <option value="">בחר קטגוריה...</option>
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={isPending}
              className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {isPending ? '...' : 'הוסף'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setError(null);
              }}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              ביטול
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-2 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          + הוסף פריט לתפריט
        </button>
      )}
    </div>
  );
}

