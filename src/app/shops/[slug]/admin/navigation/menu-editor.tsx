'use client';

import { useState, useTransition, useRef } from 'react';
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
  imageUrl: string | null;
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
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newItem, setNewItem] = useState<{
    title: string;
    linkType: 'url' | 'page' | 'category';
    linkUrl: string;
    linkResourceId: string;
    imageUrl: string;
    parentId: string | null;
  }>({
    title: '',
    linkType: 'category',
    linkUrl: '',
    linkResourceId: '',
    imageUrl: '',
    parentId: null,
  });

  // Get top-level items and children map
  const topLevelItems = items.filter(i => !i.parentId);
  const childrenMap = new Map<string, MenuItem[]>();
  items.forEach(item => {
    if (item.parentId) {
      const existing = childrenMap.get(item.parentId) || [];
      childrenMap.set(item.parentId, [...existing, item]);
    }
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

    // Calculate sort order based on parent
    let sortOrder = 0;
    if (newItem.parentId) {
      const siblings = childrenMap.get(newItem.parentId) || [];
      sortOrder = siblings.length;
    } else {
      sortOrder = topLevelItems.length;
    }

    startTransition(async () => {
      const result = await addMenuItem(menu.id, slug, {
        title: newItem.title,
        linkType: newItem.linkType,
        linkUrl: newItem.linkType === 'url' ? newItem.linkUrl : null,
        linkResourceId: newItem.linkType !== 'url' ? newItem.linkResourceId : null,
        imageUrl: newItem.imageUrl || null,
        parentId: newItem.parentId,
        sortOrder,
      });

      if (result.success) {
        setNewItem({ title: '', linkType: 'category', linkUrl: '', linkResourceId: '', imageUrl: '', parentId: null });
        setShowAddForm(false);
        setAddingSubTo(null);
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

  const handleMoveUp = (item: MenuItem, siblings: MenuItem[]) => {
    const index = siblings.findIndex(s => s.id === item.id);
    if (index === 0) return;
    
    const newOrder = [...siblings];
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

  const handleMoveDown = (item: MenuItem, siblings: MenuItem[]) => {
    const index = siblings.findIndex(s => s.id === item.id);
    if (index === siblings.length - 1) return;
    
    const newOrder = [...siblings];
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

  const handleImageUpload = async (itemId: string, file: File) => {
    if (!file) return;
    
    setUploadingFor(itemId);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'menu-images');

      const response = await fetch(`/api/shops/${slug}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      
      if (data.url) {
        // Update the menu item with the new image URL
        await updateMenuItem(itemId, slug, { imageUrl: data.url });
        router.refresh();
      }
    } catch (err) {
      console.error('Image upload error:', err);
      setError('שגיאה בהעלאת תמונה');
    } finally {
      setUploadingFor(null);
    }
  };

  const handleRemoveImage = async (itemId: string) => {
    startTransition(async () => {
      await updateMenuItem(itemId, slug, { imageUrl: null });
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
      return cat ? `/category/${cat.slug}` : 'קטגוריה לא נמצאה';
    }
    return '';
  };

  // Render a single menu item row
  const renderItem = (item: MenuItem, siblings: MenuItem[], level: number = 0) => {
    const index = siblings.findIndex(s => s.id === item.id);
    const children = childrenMap.get(item.id) || [];
    const hasChildren = children.length > 0;
    const isAddingSubHere = addingSubTo === item.id;

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg ${level > 0 ? 'mr-6 border-r-2 border-gray-200' : ''}`}
        >
          {/* Reorder arrows */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleMoveUp(item, siblings)}
              disabled={index === 0 || isPending}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2l4 4H2l4-4z" />
              </svg>
            </button>
            <button
              onClick={() => handleMoveDown(item, siblings)}
              disabled={index === siblings.length - 1 || isPending}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 10l4-4H2l4 4z" />
              </svg>
            </button>
          </div>
          
          {/* Image thumbnail for mega menu */}
          <div className="relative w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
            {item.imageUrl ? (
              <>
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemoveImage(item.id)}
                  disabled={isPending}
                  className="absolute -top-1 -left-1 p-0.5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 2l6 6M8 2l-6 6" />
                  </svg>
                </button>
              </>
            ) : (
              <label className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors">
                {uploadingFor === item.id ? (
                  <span className="animate-spin text-gray-500">⏳</span>
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(item.id, file);
                  }}
                />
              </label>
            )}
          </div>

          {/* Item info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900">{item.title}</p>
            <p className="text-xs text-gray-500 truncate" dir="ltr">{getLinkDisplay(item)}</p>
          </div>
          
          {/* Type badge */}
          <span className={`px-2 py-0.5 text-xs rounded flex-shrink-0 ${
            item.linkType === 'url' ? 'bg-blue-100 text-blue-700' :
            item.linkType === 'page' ? 'bg-green-100 text-green-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {item.linkType === 'url' ? 'קישור' : item.linkType === 'page' ? 'עמוד' : 'קטגוריה'}
          </span>

          {/* Children count */}
          {hasChildren && (
            <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded flex-shrink-0">
              {children.length} תתי-פריטים
            </span>
          )}

          {/* Add sub-item button - only for top level */}
          {level === 0 && (
            <button
              onClick={() => {
                setAddingSubTo(isAddingSubHere ? null : item.id);
                setNewItem(prev => ({ ...prev, parentId: item.id }));
                setShowAddForm(false);
              }}
              disabled={isPending}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
              title="הוסף תת-פריט"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M7 3v8M3 7h8" />
              </svg>
            </button>
          )}
          
          {/* Delete button */}
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

        {/* Sub-item add form */}
        {isAddingSubHere && (
          <div className="mr-6 mt-2 mb-2 border-r-2 border-blue-200 pr-4">
            {renderAddForm(true)}
          </div>
        )}

        {/* Render children */}
        {hasChildren && (
          <div className="space-y-2 mt-2">
            {children.map(child => renderItem(child, children, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Add form component
  const renderAddForm = (isSubItem: boolean = false) => (
    <div className={`border ${isSubItem ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200'} rounded-lg p-4 space-y-3`}>
      {isSubItem && (
        <p className="text-xs text-blue-600 font-medium">הוספת תת-פריט לתפריט</p>
      )}
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
            <option value="category">קטגוריה</option>
            <option value="page">עמוד</option>
            <option value="url">קישור חיצוני</option>
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

      {/* Image URL for mega menu */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">תמונה למגה מניו (אופציונלי)</label>
        <input
          type="url"
          value={newItem.imageUrl}
          onChange={(e) => setNewItem(prev => ({ ...prev, imageUrl: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
          placeholder="https://example.com/image.jpg"
          dir="ltr"
        />
        <p className="text-[10px] text-gray-500 mt-1">תמונה תוצג בתפריט הגדול בעת hover (ניתן גם להעלות אחרי יצירה)</p>
      </div>

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
            setAddingSubTo(null);
            setNewItem({ title: '', linkType: 'category', linkUrl: '', linkResourceId: '', imageUrl: '', parentId: null });
            setError(null);
          }}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          ביטול
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      {/* Info about mega menu */}
      {menu.handle === 'main' && (
        <div className="mb-4 p-3 bg-gradient-to-l from-purple-50 to-blue-50 border border-blue-100 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>מגה מניו:</strong> הוסף תת-פריטים לכל פריט ראשי כדי ליצור תפריט מורחב.
            ניתן להעלות תמונה לכל פריט - היא תוצג בצד התפריט בזמן hover.
          </p>
        </div>
      )}

      {/* Items List */}
      {topLevelItems.length === 0 ? (
        <p className="text-gray-500 text-center py-4">אין פריטים בתפריט</p>
      ) : (
        <div className="space-y-2 mb-4">
          {topLevelItems.map((item) => renderItem(item, topLevelItems))}
        </div>
      )}

      {/* Add Form */}
      {showAddForm ? (
        renderAddForm(false)
      ) : (
        <button
          onClick={() => {
            setShowAddForm(true);
            setAddingSubTo(null);
            setNewItem(prev => ({ ...prev, parentId: null }));
          }}
          className="w-full py-2 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          + הוסף פריט לתפריט
        </button>
      )}
    </div>
  );
}
