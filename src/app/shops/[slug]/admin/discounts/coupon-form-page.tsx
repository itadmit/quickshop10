'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createCoupon, updateCoupon } from './actions';
import { ArrowRight, Search, X, ChevronDown, Plus, Sparkles } from 'lucide-react';

type DiscountType = 
  | 'percentage' 
  | 'fixed_amount' 
  | 'free_shipping'
  | 'buy_x_pay_y'
  | 'buy_x_get_y'
  | 'quantity_discount'
  | 'spend_x_pay_y';

interface QuantityTier {
  minQuantity: number;
  discountPercent: number;
}

interface Coupon {
  id: string;
  code: string;
  title: string | null;
  type: DiscountType;
  value: string;
  minimumAmount: string | null;
  usageLimit: number | null;
  oncePerCustomer: boolean;
  firstOrderOnly: boolean;
  stackable: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  influencerId?: string | null;
  appliesTo: 'all' | 'category' | 'product' | 'member';
  categoryIds: string[];
  productIds: string[];
  excludeCategoryIds: string[];
  excludeProductIds: string[];
  // Advanced discount fields
  buyQuantity?: number | null;
  payAmount?: string | null;
  getQuantity?: number | null;
  giftProductIds?: string[];
  giftSameProduct?: boolean;
  quantityTiers?: QuantityTier[];
  spendAmount?: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  categoryId: string | null;
}

interface Influencer {
  id: string;
  name: string;
  email: string;
}

interface CouponFormPageProps {
  storeSlug: string;
  storeId: string;
  mode: 'create' | 'edit';
  coupon?: Coupon;
  categories: Category[];
  products: Product[];
  influencers?: Influencer[];
}

export function CouponFormPage({ 
  storeSlug, 
  storeId, 
  mode, 
  coupon, 
  categories, 
  products, 
  influencers = [] 
}: CouponFormPageProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Search states
  const [categorySearch, setCategorySearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [excludeCategorySearch, setExcludeCategorySearch] = useState('');
  const [excludeProductSearch, setExcludeProductSearch] = useState('');

  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    title: coupon?.title || '',
    type: (coupon?.type || 'percentage') as DiscountType,
    value: coupon?.value || '',
    minimumAmount: coupon?.minimumAmount || '',
    usageLimit: coupon?.usageLimit?.toString() || '',
    oncePerCustomer: coupon?.oncePerCustomer ?? false,
    firstOrderOnly: coupon?.firstOrderOnly ?? false,
    stackable: coupon?.stackable ?? true,
    startsAt: coupon?.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 10) : '',
    endsAt: coupon?.endsAt ? new Date(coupon.endsAt).toISOString().slice(0, 10) : '',
    isActive: coupon?.isActive ?? true,
    influencerId: coupon?.influencerId || '',
    appliesTo: coupon?.appliesTo || 'all' as const,
    categoryIds: coupon?.categoryIds || [],
    productIds: coupon?.productIds || [],
    excludeCategoryIds: coupon?.excludeCategoryIds || [],
    excludeProductIds: coupon?.excludeProductIds || [],
    // Advanced discount fields
    buyQuantity: coupon?.buyQuantity?.toString() || '',
    payAmount: coupon?.payAmount || '',
    getQuantity: coupon?.getQuantity?.toString() || '',
    giftProductIds: coupon?.giftProductIds || [],
    giftSameProduct: coupon?.giftSameProduct ?? true,
    quantityTiers: coupon?.quantityTiers || [{ minQuantity: 2, discountPercent: 10 }],
    spendAmount: coupon?.spendAmount || '',
  });

  // Filtered lists for search
  const filteredCategories = useMemo(() => {
    if (!categorySearch) return categories;
    const search = categorySearch.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(search));
  }, [categories, categorySearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    const search = productSearch.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(search));
  }, [products, productSearch]);

  const filteredExcludeCategories = useMemo(() => {
    // Filter out already selected categories
    const available = categories.filter(c => !formData.categoryIds.includes(c.id));
    if (!excludeCategorySearch) return available;
    const search = excludeCategorySearch.toLowerCase();
    return available.filter(c => c.name.toLowerCase().includes(search));
  }, [categories, formData.categoryIds, excludeCategorySearch]);

  const filteredExcludeProducts = useMemo(() => {
    // Filter out already selected products
    const available = products.filter(p => !formData.productIds.includes(p.id));
    if (!excludeProductSearch) return available;
    const search = excludeProductSearch.toLowerCase();
    return available.filter(p => p.name.toLowerCase().includes(search));
  }, [products, formData.productIds, excludeProductSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.code.trim()) {
      setError('נא להזין קוד קופון');
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

    startTransition(async () => {
      try {
        const data = {
          ...formData,
          value: parseFloat(formData.value) || 0,
          minimumAmount: formData.minimumAmount ? parseFloat(formData.minimumAmount) : null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
          startsAt: formData.startsAt ? new Date(formData.startsAt) : null,
          endsAt: formData.endsAt ? new Date(formData.endsAt) : null,
          influencerId: formData.influencerId || null,
          buyQuantity: formData.buyQuantity ? parseInt(formData.buyQuantity) : null,
          payAmount: formData.payAmount ? parseFloat(formData.payAmount) : null,
          getQuantity: formData.getQuantity ? parseInt(formData.getQuantity) : null,
          spendAmount: formData.spendAmount ? parseFloat(formData.spendAmount) : null,
          quantityTiers: formData.quantityTiers,
          giftProductIds: formData.giftProductIds,
          giftSameProduct: formData.giftSameProduct,
        };

        if (mode === 'create') {
          const result = await createCoupon(storeId, data);
          if (result.error) {
            setError(result.error);
            return;
          }
        } else if (coupon) {
          const result = await updateCoupon(coupon.id, data);
          if (result.error) {
            setError(result.error);
            return;
          }
        }
        router.push(`/shops/${storeSlug}/admin/discounts`);
        router.refresh();
      } catch {
        setError('אירעה שגיאה. נסה שוב.');
      }
    });
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
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

  const handleExcludeCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      excludeCategoryIds: prev.excludeCategoryIds.includes(categoryId)
        ? prev.excludeCategoryIds.filter(id => id !== categoryId)
        : [...prev.excludeCategoryIds, categoryId],
    }));
  };

  const handleExcludeProductToggle = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      excludeProductIds: prev.excludeProductIds.includes(productId)
        ? prev.excludeProductIds.filter(id => id !== productId)
        : [...prev.excludeProductIds, productId],
    }));
  };

  const getSelectedCategoryNames = (ids: string[]) => {
    return ids.map(id => categories.find(c => c.id === id)?.name).filter(Boolean);
  };

  const getSelectedProductNames = (ids: string[]) => {
    return ids.map(id => products.find(p => p.id === id)?.name).filter(Boolean);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/shops/${storeSlug}/admin/discounts`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {mode === 'create' ? 'קופון חדש' : 'עריכת קופון'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {mode === 'create' ? 'צור קופון הנחה חדש ללקוחות' : `עריכת קופון ${coupon?.code}`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900 pb-2 border-b border-gray-100">
                פרטי הקופון
              </h2>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  קוד קופון *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors font-mono text-sm"
                    placeholder="WELCOME15"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    צור אוטומטי
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  שם (אופציונלי)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-sm"
                  placeholder="הנחת לקוחות חדשים"
                />
              </div>

              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  סוג הנחה
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as DiscountType }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-sm"
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

              {/* Type-specific fields */}
              
              {/* Percentage / Fixed Amount */}
              {(formData.type === 'percentage' || formData.type === 'fixed_amount') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {formData.type === 'percentage' ? 'אחוז הנחה' : 'סכום הנחה'} *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="0"
                        max={formData.type === 'percentage' ? 100 : undefined}
                        step="0.01"
                        value={formData.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-sm"
                        placeholder={formData.type === 'percentage' ? '15' : '50'}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        {formData.type === 'percentage' ? '%' : '₪'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Buy X Pay Y */}
              {formData.type === 'buy_x_pay_y' && (
                <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                  <p className="text-sm text-blue-800 font-medium">קנה X מוצרים ושלם סכום קבוע</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        כמות לקנייה *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.buyQuantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, buyQuantity: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-sm"
                        placeholder="3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        שלם (₪) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.payAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, payAmount: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-sm"
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
                  <p className="text-sm text-green-800 font-medium">קנה X קבל Y מוצרים חינם</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        קנה (כמות) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.buyQuantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, buyQuantity: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-sm"
                        placeholder="2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        קבל חינם (כמות) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.getQuantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, getQuantity: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-sm"
                        placeholder="1"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.giftSameProduct}
                      onChange={(e) => setFormData(prev => ({ ...prev, giftSameProduct: e.target.checked }))}
                      className="rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className="text-sm text-gray-700">המתנה היא אותו מוצר (הזול מביניהם)</span>
                  </label>
                  <p className="text-xs text-gray-500">לדוגמה: קנה 2 קבל 1 חינם</p>
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
                                setFormData(prev => ({ ...prev, quantityTiers: newTiers }));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-sm"
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
                                setFormData(prev => ({ ...prev, quantityTiers: newTiers }));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-sm"
                              placeholder="10"
                            />
                          </div>
                        </div>
                        {formData.quantityTiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newTiers = formData.quantityTiers.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, quantityTiers: newTiers }));
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
                      setFormData(prev => ({ ...prev, quantityTiers: [...prev.quantityTiers, newTier] }));
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
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        קנה ב- (₪) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.spendAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, spendAmount: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-sm"
                          placeholder="200"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₪</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        שלם (₪) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.payAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, payAmount: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-sm"
                          placeholder="100"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₪</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">לדוגמה: קנה ב-200₪ שלם 100₪</p>
                </div>
              )}

              {/* Minimum Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  סכום מינימום להזמנה
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minimumAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, minimumAmount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-sm"
                    placeholder="ללא מינימום"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₪</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">השאר ריק לללא מינימום</p>
              </div>
            </div>

            {/* Applies To Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900 pb-2 border-b border-gray-100">
                על מה הקופון חל?
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'all', label: 'כל המוצרים', desc: 'הקופון חל על כל החנות' },
                  { value: 'category', label: 'קטגוריות ספציפיות', desc: 'בחר קטגוריות' },
                  { value: 'product', label: 'מוצרים ספציפיים', desc: 'בחר מוצרים' },
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
                      onChange={(e) => setFormData(prev => ({ ...prev, appliesTo: e.target.value as typeof formData.appliesTo }))}
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
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    בחר קטגוריות:
                  </label>
                  
                  {/* Selected Categories */}
                  {formData.categoryIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {getSelectedCategoryNames(formData.categoryIds).map((name, index) => (
                        <span
                          key={formData.categoryIds[index]}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black text-white text-xs rounded-full"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => handleCategoryToggle(formData.categoryIds[index])}
                            className="hover:bg-white/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="חפש קטגוריה..."
                      className="w-full pl-3 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black/10 focus:border-black"
                    />
                  </div>

                  {/* List */}
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {categories.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">אין קטגוריות בחנות</p>
                    ) : filteredCategories.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">לא נמצאו קטגוריות</p>
                    ) : (
                      filteredCategories.map(cat => (
                        <label 
                          key={cat.id} 
                          className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors ${
                            formData.categoryIds.includes(cat.id) ? 'bg-black/5' : 'hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.categoryIds.includes(cat.id)}
                            onChange={() => handleCategoryToggle(cat.id)}
                            className="rounded border-gray-300 text-black focus:ring-black"
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
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    בחר מוצרים:
                  </label>
                  
                  {/* Selected Products */}
                  {formData.productIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {getSelectedProductNames(formData.productIds).map((name, index) => (
                        <span
                          key={formData.productIds[index]}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black text-white text-xs rounded-full"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => handleProductToggle(formData.productIds[index])}
                            className="hover:bg-white/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="חפש מוצר..."
                      className="w-full pl-3 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black/10 focus:border-black"
                    />
                  </div>

                  {/* List */}
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {products.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">אין מוצרים בחנות</p>
                    ) : filteredProducts.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">לא נמצאו מוצרים</p>
                    ) : (
                      filteredProducts.map(prod => (
                        <label 
                          key={prod.id} 
                          className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors ${
                            formData.productIds.includes(prod.id) ? 'bg-black/5' : 'hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.productIds.includes(prod.id)}
                            onChange={() => handleProductToggle(prod.id)}
                            className="rounded border-gray-300 text-black focus:ring-black"
                          />
                          <span className="text-sm text-gray-700">{prod.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Exclusions Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">
                  החרגות
                </h2>
                <span className="text-xs text-gray-500">אופציונלי</span>
              </div>
              <p className="text-xs text-gray-500">
                מוצרים וקטגוריות שיוחרגו מהקופון גם אם הם עונים על התנאים
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Exclude Categories */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    קטגוריות מוחרגות
                  </label>
                  
                  {formData.excludeCategoryIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {getSelectedCategoryNames(formData.excludeCategoryIds).map((name, index) => (
                        <span
                          key={formData.excludeCategoryIds[index]}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => handleExcludeCategoryToggle(formData.excludeCategoryIds[index])}
                            className="hover:bg-red-200 rounded-full p-0.5"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={excludeCategorySearch}
                      onChange={(e) => setExcludeCategorySearch(e.target.value)}
                      placeholder="חפש קטגוריה להחרגה..."
                      className="w-full pl-2.5 pr-8 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-black/10 focus:border-black"
                    />
                  </div>

                  <div className="max-h-32 overflow-y-auto space-y-0.5 border border-gray-100 rounded-lg p-1">
                    {filteredExcludeCategories.slice(0, 10).map(cat => (
                      <label 
                        key={cat.id} 
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors text-xs ${
                          formData.excludeCategoryIds.includes(cat.id) ? 'bg-red-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.excludeCategoryIds.includes(cat.id)}
                          onChange={() => handleExcludeCategoryToggle(cat.id)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                        />
                        <span className="text-gray-700">{cat.name}</span>
                      </label>
                    ))}
                    {filteredExcludeCategories.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">אין קטגוריות זמינות</p>
                    )}
                  </div>
                </div>

                {/* Exclude Products */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    מוצרים מוחרגים
                  </label>
                  
                  {formData.excludeProductIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {getSelectedProductNames(formData.excludeProductIds).map((name, index) => (
                        <span
                          key={formData.excludeProductIds[index]}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => handleExcludeProductToggle(formData.excludeProductIds[index])}
                            className="hover:bg-red-200 rounded-full p-0.5"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={excludeProductSearch}
                      onChange={(e) => setExcludeProductSearch(e.target.value)}
                      placeholder="חפש מוצר להחרגה..."
                      className="w-full pl-2.5 pr-8 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-black/10 focus:border-black"
                    />
                  </div>

                  <div className="max-h-32 overflow-y-auto space-y-0.5 border border-gray-100 rounded-lg p-1">
                    {filteredExcludeProducts.slice(0, 10).map(prod => (
                      <label 
                        key={prod.id} 
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors text-xs ${
                          formData.excludeProductIds.includes(prod.id) ? 'bg-red-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.excludeProductIds.includes(prod.id)}
                          onChange={() => handleExcludeProductToggle(prod.id)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                        />
                        <span className="text-gray-700">{prod.name}</span>
                      </label>
                    ))}
                    {filteredExcludeProducts.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">אין מוצרים זמינים</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900 pb-2 border-b border-gray-100">
                סטטוס
              </h2>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black/20"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">קופון פעיל</span>
                  <p className="text-xs text-gray-500">קופון לא פעיל לא יעבוד</p>
                </div>
              </label>
            </div>

            {/* Dates Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900 pb-2 border-b border-gray-100">
                תאריכי תוקף
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  תאריך התחלה
                </label>
                <input
                  type="date"
                  value={formData.startsAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, startsAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  תאריך סיום
                </label>
                <input
                  type="date"
                  value={formData.endsAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, endsAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-sm"
                />
              </div>
              <p className="text-xs text-gray-500">השאר ריק לתוקף ללא הגבלה</p>
            </div>

            {/* Limits Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900 pb-2 border-b border-gray-100">
                הגבלות
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  מגבלת שימושים
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-sm"
                  placeholder="ללא הגבלה"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.oncePerCustomer}
                    onChange={(e) => setFormData(prev => ({ ...prev, oncePerCustomer: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black/20"
                  />
                  <span className="text-sm text-gray-700">שימוש אחד ללקוח</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.firstOrderOnly}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstOrderOnly: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black/20"
                  />
                  <span className="text-sm text-gray-700">להזמנה ראשונה בלבד</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.stackable}
                    onChange={(e) => setFormData(prev => ({ ...prev, stackable: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black/20"
                  />
                  <span className="text-sm text-gray-700">ניתן לשילוב</span>
                </label>
              </div>
            </div>

            {/* Influencer Card */}
            {influencers.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h2 className="text-sm font-semibold text-gray-900 pb-2 border-b border-gray-100">
                  שיוך למשפיען
                </h2>
                
                <select
                  value={formData.influencerId}
                  onChange={(e) => setFormData(prev => ({ ...prev, influencerId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors text-sm"
                >
                  <option value="">ללא שיוך</option>
                  {influencers.map(inf => (
                    <option key={inf.id} value={inf.id}>
                      👑 {inf.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  משפיען משויך יראה מכירות מקופון זה בדשבורד שלו
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium text-sm flex items-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                {mode === 'create' ? 'צור קופון' : 'שמור שינויים'}
              </>
            )}
          </button>
          <Link
            href={`/shops/${storeSlug}/admin/discounts`}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            ביטול
          </Link>
        </div>
      </form>
    </div>
  );
}

