'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPrize, updatePrize, deletePrize } from '../actions';
import { Tag, Banknote, Truck, Gift, RefreshCw, Frown, Plus, Pencil, Trash2 } from 'lucide-react';

interface Prize {
  id: string;
  name: string;
  type: 'coupon_percentage' | 'coupon_fixed' | 'free_shipping' | 'gift_product' | 'extra_spin' | 'no_prize';
  value: number | null;
  giftProductId: string | null;
  color: string;
  icon: string | null;
  probability: number;
  totalAvailable: number | null;
  totalWon: number;
  couponPrefix: string | null;
  couponValidDays: number | null;
  couponMinPurchase: number | null;
  sortOrder: number;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface PrizesManagerProps {
  campaignId: string;
  campaignType: 'wheel' | 'scratch';
  prizes: Prize[];
  products: Product[];
  storeSlug: string;
}

const PRIZE_TYPES = [
  { value: 'coupon_percentage', label: 'קופון אחוז הנחה', Icon: Tag },
  { value: 'coupon_fixed', label: 'קופון סכום קבוע', Icon: Banknote },
  { value: 'free_shipping', label: 'משלוח חינם', Icon: Truck },
  { value: 'gift_product', label: 'מוצר במתנה', Icon: Gift },
  { value: 'extra_spin', label: 'סיבוב נוסף', Icon: RefreshCw },
  { value: 'no_prize', label: 'בפעם הבאה', Icon: Frown },
];

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F1948A', '#82E0AA'
];

export function PrizesManager({ campaignId, campaignType, prizes, products, storeSlug }: PrizesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<Prize['type']>('coupon_percentage');
  const [value, setValue] = useState<number | ''>('');
  const [giftProductId, setGiftProductId] = useState('');
  const [color, setColor] = useState(DEFAULT_COLORS[prizes.length % DEFAULT_COLORS.length]);
  const [icon, setIcon] = useState('');
  const [probability, setProbability] = useState<number | ''>(10);
  const [totalAvailable, setTotalAvailable] = useState<number | ''>('');
  const [couponPrefix, setCouponPrefix] = useState('WIN');
  const [couponValidDays, setCouponValidDays] = useState(30);
  const [couponMinPurchase, setCouponMinPurchase] = useState<number | ''>('');

  const maxPrizes = campaignType === 'wheel' ? 12 : 8;

  const resetForm = () => {
    setName('');
    setType('coupon_percentage');
    setValue('');
    setGiftProductId('');
    setColor(DEFAULT_COLORS[prizes.length % DEFAULT_COLORS.length]);
    setIcon('');
    setProbability(10);
    setTotalAvailable('');
    setCouponPrefix('WIN');
    setCouponValidDays(30);
    setCouponMinPurchase('');
    setEditingPrize(null);
  };

  const openEdit = (prize: Prize) => {
    setName(prize.name);
    setType(prize.type);
    setValue(prize.value ?? '');
    setGiftProductId(prize.giftProductId || '');
    setColor(prize.color);
    setIcon(prize.icon || '');
    setProbability(prize.probability);
    setTotalAvailable(prize.totalAvailable ?? '');
    setCouponPrefix(prize.couponPrefix || 'WIN');
    setCouponValidDays(prize.couponValidDays || 30);
    setCouponMinPurchase(prize.couponMinPurchase ?? '');
    setEditingPrize(prize);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('נא להזין שם לפרס');
      return;
    }

    if (!probability || probability <= 0 || probability > 100) {
      alert('אחוז הסתברות חייב להיות בין 0.01 ל-100');
      return;
    }

    startTransition(async () => {
      const data = {
        campaignId,
        name,
        type,
        value: typeof value === 'number' ? value : undefined,
        giftProductId: giftProductId || undefined,
        color,
        icon: icon || undefined,
        probability: typeof probability === 'number' ? probability : 0,
        totalAvailable: typeof totalAvailable === 'number' ? totalAvailable : undefined,
        couponPrefix: couponPrefix || undefined,
        couponValidDays,
        couponMinPurchase: typeof couponMinPurchase === 'number' ? couponMinPurchase : undefined,
        sortOrder: editingPrize ? editingPrize.sortOrder : prizes.length,
      };

      const result = editingPrize
        ? await updatePrize(editingPrize.id, data)
        : await createPrize(data);

      if (result.success) {
        resetForm();
        setShowAddForm(false);
        router.refresh();
      } else {
        alert(result.error || 'אירעה שגיאה');
      }
    });
  };

  const handleDelete = async (prizeId: string, prizeName: string) => {
    if (!confirm(`האם למחוק את הפרס "${prizeName}"?`)) {
      return;
    }

    startTransition(async () => {
      const result = await deletePrize(prizeId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'אירעה שגיאה');
      }
    });
  };

  const getPrizeTypeLabel = (t: Prize['type']) => 
    PRIZE_TYPES.find(pt => pt.value === t)?.label || t;

  const getPrizeTypeIcon = (t: Prize['type']) => {
    const IconComponent = PRIZE_TYPES.find(pt => pt.value === t)?.Icon || Gift;
    return <IconComponent className="w-3.5 h-3.5 inline-block" />;
  };

  return (
    <div className="space-y-4">
      {/* Prizes List */}
      <div className="space-y-2">
        {prizes.map((prize, index) => (
          <div
            key={prize.id}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: prize.color }}
            >
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{prize.name}</p>
              <p className="text-xs text-gray-500">
                {getPrizeTypeIcon(prize.type)} {getPrizeTypeLabel(prize.type)}
                {prize.value && ` • ${prize.type === 'coupon_percentage' ? prize.value + '%' : '₪' + prize.value}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                prize.probability >= 20 
                  ? 'bg-green-100 text-green-700' 
                  : prize.probability >= 10
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
              }`}>
                {prize.probability}%
              </span>
              <button
                onClick={() => openEdit(prize)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors active:scale-95"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(prize.id, prize.name)}
                disabled={isPending}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Button */}
      {prizes.length < maxPrizes && !showAddForm && (
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <Plus className="w-5 h-5" />
          הוסף פרס
        </button>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">
              {editingPrize ? 'ערוך פרס' : 'פרס חדש'}
            </h3>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(false);
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם הפרס</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="20% הנחה"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סוג</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Prize['type'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                >
                  {PRIZE_TYPES.map((pt) => (
                    <option key={pt.value} value={pt.value}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Value field for coupon types */}
            {(type === 'coupon_percentage' || type === 'coupon_fixed') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {type === 'coupon_percentage' ? 'אחוז הנחה' : 'סכום הנחה (₪)'}
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value ? parseFloat(e.target.value) : '')}
                  min={type === 'coupon_percentage' ? 1 : 1}
                  max={type === 'coupon_percentage' ? 100 : undefined}
                  placeholder={type === 'coupon_percentage' ? '20' : '50'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  required
                />
              </div>
            )}

            {/* Gift product selector */}
            {type === 'gift_product' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מוצר במתנה</label>
                <select
                  value={giftProductId}
                  onChange={(e) => setGiftProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  required
                >
                  <option value="">בחר מוצר...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₪{p.price})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">צבע</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <div className="flex flex-wrap gap-1">
                    {DEFAULT_COLORS.slice(0, 6).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full border-2 ${
                          color === c ? 'border-gray-900' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">אחוז הסתברות</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={probability}
                    onChange={(e) => setProbability(e.target.value ? parseFloat(e.target.value) : '')}
                    min={0.01}
                    max={100}
                    step={0.01}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    required
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
            </div>

            {/* Coupon settings */}
            {['coupon_percentage', 'coupon_fixed', 'free_shipping', 'gift_product'].includes(type) && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-3">הגדרות קופון</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">קידומת</label>
                    <input
                      type="text"
                      value={couponPrefix}
                      onChange={(e) => setCouponPrefix(e.target.value.toUpperCase())}
                      maxLength={10}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">ימי תוקף</label>
                    <input
                      type="number"
                      value={couponValidDays}
                      onChange={(e) => setCouponValidDays(parseInt(e.target.value) || 30)}
                      min={1}
                      max={365}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">מינימום (₪)</label>
                    <input
                      type="number"
                      value={couponMinPurchase}
                      onChange={(e) => setCouponMinPurchase(e.target.value ? parseFloat(e.target.value) : '')}
                      min={0}
                      placeholder="0"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מלאי (ריק = ללא הגבלה)</label>
              <input
                type="number"
                value={totalAvailable}
                onChange={(e) => setTotalAvailable(e.target.value ? parseInt(e.target.value) : '')}
                min={1}
                placeholder="ללא הגבלה"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
                disabled={isPending}
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {isPending ? 'שומר...' : editingPrize ? 'עדכן' : 'הוסף'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Helper text */}
      {prizes.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          💡 טיפ: סכום כל ההסתברויות צריך להיות בדיוק 100%
        </p>
      )}
    </div>
  );
}

