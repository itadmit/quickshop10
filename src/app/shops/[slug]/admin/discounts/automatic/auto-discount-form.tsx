'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createAutoDiscount, updateAutoDiscount } from './actions';
import { Plus, X } from 'lucide-react';

type DiscountType = 
  | 'percentage' 
  | 'fixed_amount' 
  | 'free_shipping'
  | 'buy_x_pay_y'
  | 'buy_x_get_y'
  | 'gift_product'        // מוצר במתנה (עם תנאים, בחירת מוצר ספציפי)
  | 'quantity_discount'
  | 'spend_x_pay_y';

interface QuantityTier {
  minQuantity: number;
  discountPercent: number;
}

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
  type: DiscountType;
  value: string;
  appliesTo: 'all' | 'category' | 'product' | 'member';
  categoryIds: string[];
  productIds: string[];
  excludeCategoryIds: string[];
  excludeProductIds: string[];
  minimumAmount: string | null;
  minimumQuantity: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  priority: number;
  stackable: boolean;
  isActive: boolean;
  // Advanced discount fields
  buyQuantity?: number | null;
  payAmount?: string | null;
  getQuantity?: number | null;
  getDiscountPercent?: number | null;  // אחוז הנחה על Y (100 = חינם)
  giftProductIds?: string[];
  giftSameProduct?: boolean;
  quantityTiers?: QuantityTier[];
  spendAmount?: string | null;
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
    type: (discount?.type || 'percentage') as DiscountType,
    value: discount?.value || '',
    appliesTo: discount?.appliesTo || 'all' as const,
    categoryIds: discount?.categoryIds || [],
    productIds: discount?.productIds || [],
    excludeCategoryIds: discount?.excludeCategoryIds || [],
    excludeProductIds: discount?.excludeProductIds || [],
    minimumAmount: discount?.minimumAmount || '',
    minimumQuantity: discount?.minimumQuantity?.toString() || '',
    startsAt: discount?.startsAt ? formatDateForInput(discount.startsAt) : '',
    endsAt: discount?.endsAt ? formatDateForInput(discount.endsAt) : '',
    priority: discount?.priority?.toString() || '0',
    stackable: discount?.stackable ?? true,
    isActive: discount?.isActive ?? true,
    // Advanced discount fields
    buyQuantity: discount?.buyQuantity?.toString() || '',
    payAmount: discount?.payAmount || '',
    getQuantity: discount?.getQuantity?.toString() || '',
    getDiscountPercent: discount?.getDiscountPercent?.toString() || '100',
    giftProductIds: discount?.giftProductIds || [],
    giftSameProduct: discount?.giftSameProduct ?? true,
    quantityTiers: discount?.quantityTiers || [{ minQuantity: 2, discountPercent: 10 }],
    spendAmount: discount?.spendAmount || '',
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

    // Type-specific validation
    if (formData.type === 'percentage' || formData.type === 'fixed_amount') {
      if (!formData.value || Number(formData.value) <= 0) {
        setError('נא להזין ערך הנחה תקין');
        return;
      }
      if (formData.type === 'percentage' && Number(formData.value) > 100) {
        setError('אחוז ההנחה לא יכול להיות יותר מ-100');
        return;
      }
    }

    if (formData.type === 'buy_x_pay_y') {
      if (!formData.buyQuantity || Number(formData.buyQuantity) <= 0) {
        setError('נא להזין כמות לקנייה');
        return;
      }
      if (!formData.payAmount || Number(formData.payAmount) <= 0) {
        setError('נא להזין סכום לתשלום');
        return;
      }
    }

    if (formData.type === 'buy_x_get_y') {
      if (!formData.buyQuantity || Number(formData.buyQuantity) <= 0) {
        setError('נא להזין כמות לקנייה');
        return;
      }
      if (!formData.getQuantity || Number(formData.getQuantity) <= 0) {
        setError('נא להזין כמות למתנה');
        return;
      }
    }

    if (formData.type === 'quantity_discount') {
      if (!formData.quantityTiers || formData.quantityTiers.length === 0) {
        setError('נא להגדיר לפחות מדרגת כמות אחת');
        return;
      }
    }

    if (formData.type === 'spend_x_pay_y') {
      if (!formData.spendAmount || Number(formData.spendAmount) <= 0) {
        setError('נא להזין סכום להוצאה');
        return;
      }
      if (!formData.payAmount || Number(formData.payAmount) <= 0) {
        setError('נא להזין סכום לתשלום');
        return;
      }
      if (Number(formData.payAmount) >= Number(formData.spendAmount)) {
        setError('סכום התשלום חייב להיות קטן מסכום ההוצאה');
        return;
      }
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
      excludeCategoryIds: formData.excludeCategoryIds,
      excludeProductIds: formData.excludeProductIds,
      minimumAmount: formData.minimumAmount || null,
      minimumQuantity: formData.minimumQuantity ? parseInt(formData.minimumQuantity) : null,
      startsAt: formData.startsAt ? new Date(formData.startsAt) : null,
      endsAt: formData.endsAt ? new Date(formData.endsAt) : null,
      priority: parseInt(formData.priority) || 0,
      stackable: formData.stackable,
      isActive: formData.isActive,
      // Advanced discount fields
      buyQuantity: formData.buyQuantity ? parseInt(formData.buyQuantity) : null,
      payAmount: formData.payAmount ? parseFloat(formData.payAmount) : null,
      getQuantity: formData.getQuantity ? parseInt(formData.getQuantity) : null,
      getDiscountPercent: formData.getDiscountPercent ? parseInt(formData.getDiscountPercent) : 100,
      giftProductIds: formData.giftProductIds,
      giftSameProduct: formData.giftSameProduct,
      quantityTiers: formData.quantityTiers,
      spendAmount: formData.spendAmount ? parseFloat(formData.spendAmount) : null,
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
          : "p-2 text-gray-400 hover:text-gray-600 transition-colors"
        }
        title={mode === 'edit' ? 'ערוך' : undefined}
      >
        {mode === 'create' ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            הנחה אוטומטית חדשה
          </>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    סוג הנחה
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as DiscountType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  >
                    <optgroup label="הנחות בסיסיות">
                      <option value="percentage">אחוז הנחה (%)</option>
                      <option value="fixed_amount">סכום קבוע (₪)</option>
                      <option value="free_shipping">משלוח חינם</option>
                    </optgroup>
                    <optgroup label="מבצעים מתקדמים">
                      <option value="buy_x_pay_y">קנה X שלם Y ש"ח</option>
                      <option value="buy_x_get_y">קנה X קבל Y חינם</option>
                      <option value="quantity_discount">הנחות כמות</option>
                      <option value="spend_x_pay_y">קנה ב-X שלם Y</option>
                    </optgroup>
                  </select>
                </div>

                {/* Percentage / Fixed Amount */}
                {(formData.type === 'percentage' || formData.type === 'fixed_amount') && (
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

                {/* Buy X Pay Y */}
                {formData.type === 'buy_x_pay_y' && (
                  <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                    <p className="text-sm text-blue-800 font-medium">קנה X מוצרים ושלם סכום קבוע</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          כמות לקנייה *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.buyQuantity}
                          onChange={(e) => setFormData({ ...formData, buyQuantity: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black text-sm"
                          placeholder="3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          שלם (₪) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.payAmount}
                            onChange={(e) => setFormData({ ...formData, payAmount: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black text-sm"
                            placeholder="100"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₪</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">לדוגמה: קנה 3 חולצות שלם 100₪</p>
                  </div>
                )}

                {/* Buy X Get Y */}
                {formData.type === 'buy_x_get_y' && (
                  <div className="bg-green-50 rounded-lg p-4 space-y-4">
                    <p className="text-sm text-green-800 font-medium">קנה X קבל Y בהנחה</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          קנה (כמות) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.buyQuantity}
                          onChange={(e) => setFormData({ ...formData, buyQuantity: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black text-sm"
                          placeholder="2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          קבל בהנחה (כמות) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.getQuantity}
                          onChange={(e) => setFormData({ ...formData, getQuantity: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black text-sm"
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          אחוז הנחה (%) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={formData.getDiscountPercent}
                            onChange={(e) => setFormData({ ...formData, getDiscountPercent: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black text-sm"
                            placeholder="100"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.giftSameProduct}
                        onChange={(e) => setFormData({ ...formData, giftSameProduct: e.target.checked })}
                        className="rounded border-gray-300 text-black focus:ring-black"
                      />
                      <span className="text-sm text-gray-700">ההנחה על אותו מוצר (הזול מביניהם)</span>
                    </label>
                    <p className="text-xs text-gray-500">לדוגמה: קנה 2 קבל 1 ב-50% הנחה, או קנה 2 קבל 1 חינם (100%)</p>
                  </div>
                )}

                {/* Quantity Discount */}
                {formData.type === 'quantity_discount' && (
                  <div className="bg-purple-50 rounded-lg p-4 space-y-4">
                    <p className="text-sm text-purple-800 font-medium">הנחות כמות מדורגות</p>
                    <div className="space-y-3">
                      {formData.quantityTiers.map((tier, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">קנה מ-</label>
                              <input
                                type="number"
                                min="1"
                                value={tier.minQuantity}
                                onChange={(e) => {
                                  const newTiers = [...formData.quantityTiers];
                                  newTiers[index] = { ...tier, minQuantity: parseInt(e.target.value) || 0 };
                                  setFormData({ ...formData, quantityTiers: newTiers });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black text-sm"
                                placeholder="2"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">קבל הנחה (%)</label>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={tier.discountPercent}
                                onChange={(e) => {
                                  const newTiers = [...formData.quantityTiers];
                                  newTiers[index] = { ...tier, discountPercent: parseInt(e.target.value) || 0 };
                                  setFormData({ ...formData, quantityTiers: newTiers });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black text-sm"
                                placeholder="10"
                              />
                            </div>
                          </div>
                          {formData.quantityTiers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newTiers = formData.quantityTiers.filter((_, i) => i !== index);
                                setFormData({ ...formData, quantityTiers: newTiers });
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const lastTier = formData.quantityTiers[formData.quantityTiers.length - 1];
                        const newTier = {
                          minQuantity: (lastTier?.minQuantity || 1) + 1,
                          discountPercent: (lastTier?.discountPercent || 10) + 5,
                        };
                        setFormData({ ...formData, quantityTiers: [...formData.quantityTiers, newTier] });
                      }}
                      className="text-sm text-purple-700 hover:text-purple-800 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      הוסף מדרגה
                    </button>
                    <p className="text-xs text-gray-500">לדוגמה: קנה 2 = 10% הנחה, קנה 3 = 15% הנחה</p>
                  </div>
                )}

                {/* Spend X Pay Y */}
                {formData.type === 'spend_x_pay_y' && (
                  <div className="bg-orange-50 rounded-lg p-4 space-y-4">
                    <p className="text-sm text-orange-800 font-medium">קנה בסכום מסוים ושלם פחות</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          קנה ב- (₪) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.spendAmount}
                            onChange={(e) => setFormData({ ...formData, spendAmount: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black text-sm"
                            placeholder="200"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₪</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          שלם (₪) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.payAmount}
                            onChange={(e) => setFormData({ ...formData, payAmount: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black text-sm"
                            placeholder="100"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₪</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">לדוגמה: קנה ב-200₪ שלם 100₪</p>
                  </div>
                )}
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

