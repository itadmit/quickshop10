'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createDraft } from '../actions';
import { useParams } from 'next/navigation';

interface DraftItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export default function NewDraftOrderPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [shipping, setShipping] = useState(0);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [newItem, setNewItem] = useState({ name: '', price: 0, quantity: 1 });

  const addItem = () => {
    if (!newItem.name || newItem.price <= 0) return;
    
    setItems([
      ...items,
      {
        productId: `manual-${Date.now()}`,
        name: newItem.name,
        price: newItem.price,
        quantity: newItem.quantity,
      },
    ]);
    setNewItem({ name: '', price: 0, quantity: 1 });
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    setItems(items.map((item, i) => (i === index ? { ...item, quantity } : item)));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + shipping;

  const handleSubmit = () => {
    if (items.length === 0) {
      alert('יש להוסיף לפחות פריט אחד');
      return;
    }

    startTransition(async () => {
      const result = await createDraft(slug, {
        customerName,
        customerEmail,
        customerPhone,
        items,
        notes,
        shipping,
      });

      if (result.success) {
        router.push(`/shops/${slug}/admin/orders/drafts`);
      } else {
        alert(result.error);
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">טיוטה חדשה</h1>
          <p className="text-gray-500 text-sm mt-1">יצירת הזמנה ידנית</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">פרטי לקוח</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="שם הלקוח"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="050-0000000"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">פריטים</h2>
            
            {/* Add Item Form */}
            <div className="grid grid-cols-12 gap-2 mb-4">
              <div className="col-span-5">
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="שם המוצר"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  value={newItem.price || ''}
                  onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="מחיר"
                  min="0"
                  step="1"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="כמות"
                  min="1"
                />
              </div>
              <div className="col-span-2">
                <button
                  onClick={addItem}
                  className="w-full px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  הוסף
                </button>
              </div>
            </div>

            {/* Items List */}
            {items.length === 0 ? (
              <p className="text-gray-500 text-center py-4">אין פריטים בטיוטה</p>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(item.price)} ליחידה</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateItemQuantity(index, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateItemQuantity(index, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                      <p className="font-medium w-20 text-left">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <button
                        onClick={() => removeItem(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">הערות</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              rows={3}
              placeholder="הערות פנימיות להזמנה..."
            />
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
            <h2 className="font-semibold mb-4">סיכום</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">סה״כ מוצרים</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">משלוח</span>
                <input
                  type="number"
                  value={shipping || ''}
                  onChange={(e) => setShipping(Number(e.target.value))}
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-left"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-lg">
                <span>סה״כ</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSubmit}
                disabled={isPending || items.length === 0}
                className="w-full px-4 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'יוצר טיוטה...' : 'צור טיוטה'}
              </button>
              <button
                onClick={() => router.back()}
                className="w-full px-4 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

