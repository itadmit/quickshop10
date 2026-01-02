'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createAutoDiscount, updateAutoDiscount } from './actions';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
}

interface AutoDiscount {
  id: string;
  name: string;
  description: string | null;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: string;
  appliesTo: 'all' | 'category' | 'product' | 'member';
  categoryIds: string[];
  productIds: string[];
  minimumAmount: string | null;
  minimumQuantity: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  priority: number;
  stackable: boolean;
  isActive: boolean;
}

interface AutoDiscountFormProps {
  storeId: string;
  mode: 'create' | 'edit';
  discount?: AutoDiscount;
  categories: Category[];
  products: Product[];
}

export function AutoDiscountForm({ storeId, mode, discount, categories, products }: AutoDiscountFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: discount?.name || '',
    description: discount?.description || '',
    type: discount?.type || 'percentage' as const,
    value: discount?.value || '',
    appliesTo: discount?.appliesTo || 'all' as const,
    categoryIds: discount?.categoryIds || [],
    productIds: discount?.productIds || [],
    minimumAmount: discount?.minimumAmount || '',
    minimumQuantity: discount?.minimumQuantity?.toString() || '',
    startsAt: discount?.startsAt ? formatDateForInput(discount.startsAt) : '',
    endsAt: discount?.endsAt ? formatDateForInput(discount.endsAt) : '',
    priority: discount?.priority?.toString() || '0',
    stackable: discount?.stackable ?? true,
    isActive: discount?.isActive ?? true,
  });

  function formatDateForInput(date: Date): string {
    return new Date(date).toISOString().slice(0, 16);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('נא להזין שם להנחה');
      return;
    }

    if (!formData.value || Number(formData.value) <= 0) {
      setError('נא להזין ערך הנחה תקין');
      return;
    }

    if (formData.appliesTo === 'category' && formData.categoryIds.length === 0) {
      setError('נא לבחור לפחות קטגוריה אחת');
      return;
    }

    if (formData.appliesTo === 'product' && formData.productIds.length === 0) {
      setError('נא לבחור לפחות מוצר אחד');
      return;
    }

    const data = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      type: formData.type,
      value: formData.value,
      appliesTo: formData.appliesTo,
      categoryIds: formData.categoryIds,
      productIds: formData.productIds,
      minimumAmount: formData.minimumAmount || null,
      minimumQuantity: formData.minimumQuantity ? parseInt(formData.minimumQuantity) : null,
      startsAt: formData.startsAt ? new Date(formData.startsAt) : null,
      endsAt: formData.endsAt ? new Date(formData.endsAt) : null,
      priority: parseInt(formData.priority) || 0,
      stackable: formData.stackable,
      isActive: formData.isActive,
    };

    startTransition(async () => {
      const result = mode === 'create'
        ? await createAutoDiscount(storeId, data)
        : await updateAutoDiscount(discount!.id, data);

      if (result.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(result.error || 'שגיאה בשמירת ההנחה');
      }
    });
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const handleProductToggle = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter(id => id !== productId)
        : [...prev.productIds, productId],
    }));
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={mode === 'create' 
          ? "px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer flex items-center gap-2"
          : "p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        }
      >
        {mode === 'create' ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            הנחה אוטומטית חדשה
          </>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 cursor-pointer" onClick={() => setIsOpen(false)} dir="rtl">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-scroll cursor-default text-right" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {mode === 'create' ? 'הנחה אוטומטית חדשה' : 'עריכת הנחה אוטומטית'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">הנחה זו תחול אוטומטית ללא צורך בקוד</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">פרטי ההנחה</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם ההנחה <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    placeholder="למשל: הנחת חברי מועדון, סייל חורף"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תיאור
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    placeholder="תיאור קצר של ההנחה"
                  />
                </div>
              </div>

              {/* Discount Type & Value */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">סוג וערך ההנחה</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      סוג הנחה
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as typeof formData.type })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    >
                      <option value="percentage">אחוז הנחה (%)</option>
                      <option value="fixed_amount">סכום קבוע (₪)</option>
                      <option value="free_shipping">משלוח חינם</option>
                    </select>
                  </div>
                  
                  {formData.type !== 'free_shipping' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ערך ההנחה <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.value}
                          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                          placeholder={formData.type === 'percentage' ? '10' : '50'}
                          min="0"
                          max={formData.type === 'percentage' ? '100' : undefined}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          {formData.type === 'percentage' ? '%' : '₪'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Applies To */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">על מה ההנחה חלה?</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'all', label: 'כל המוצרים', desc: 'ההנחה חלה על כל החנות' },
                    { value: 'category', label: 'קטגוריות', desc: 'בחר קטגוריות ספציפיות' },
                    { value: 'product', label: 'מוצרים', desc: 'בחר מוצרים ספציפיים' },
                    { value: 'member', label: 'חברי מועדון', desc: 'רק ללקוחות רשומים' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.appliesTo === opt.value 
                          ? 'border-black bg-gray-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="appliesTo"
                        value={opt.value}
                        checked={formData.appliesTo === opt.value}
                        onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value as typeof formData.appliesTo })}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">{opt.label}</span>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Category Selection */}
                {formData.appliesTo === 'category' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      בחר קטגוריות:
                    </label>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {categories.length === 0 ? (
                        <p className="text-sm text-gray-500">אין קטגוריות בחנות</p>
                      ) : (
                        categories.map(cat => (
                          <label key={cat.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.categoryIds.includes(cat.id)}
                              onChange={() => handleCategoryToggle(cat.id)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">{cat.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Product Selection */}
                {formData.appliesTo === 'product' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      בחר מוצרים:
                    </label>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {products.length === 0 ? (
                        <p className="text-sm text-gray-500">אין מוצרים בחנות</p>
                      ) : (
                        products.map(prod => (
                          <label key={prod.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.productIds.includes(prod.id)}
                              onChange={() => handleProductToggle(prod.id)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">{prod.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Conditions */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">תנאים (אופציונלי)</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      מינימום סכום הזמנה
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.minimumAmount}
                        onChange={(e) => setFormData({ ...formData, minimumAmount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                        placeholder="ללא מינימום"
                        min="0"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₪</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      מינימום כמות פריטים
                    </label>
                    <input
                      type="number"
                      value={formData.minimumQuantity}
                      onChange={(e) => setFormData({ ...formData, minimumQuantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                      placeholder="ללא מינימום"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">תאריכים</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      תאריך התחלה
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startsAt}
                      onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      תאריך סיום
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endsAt}
                      onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">הגדרות נוספות</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.stackable}
                      onChange={(e) => setFormData({ ...formData, stackable: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 focus:ring-black"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">ניתן לשילוב</span>
                      <p className="text-xs text-gray-500">האם ניתן לשלב הנחה זו עם הנחות אחרות</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 focus:ring-black"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">הנחה פעילה</span>
                      <p className="text-xs text-gray-500">הנחה לא פעילה לא תחול על הזמנות</p>
                    </div>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    עדיפות
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">מספר גבוה יותר = עדיפות גבוהה יותר</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isPending ? 'שומר...' : mode === 'create' ? 'צור הנחה' : 'שמור שינויים'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

