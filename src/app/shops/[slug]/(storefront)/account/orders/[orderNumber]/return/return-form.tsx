'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createReturnRequest } from '../../../returns/actions';

interface OrderItem {
  id: string;
  productId: string | null;
  name: string;
  variantTitle: string | null;
  quantity: number;
  price: number;
  imageUrl: string | null;
}

interface ReturnRequestFormProps {
  storeSlug: string;
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
}

const reasonOptions = [
  { value: 'wrong_size', label: 'מידה לא מתאימה' },
  { value: 'defective', label: 'פגם במוצר' },
  { value: 'not_as_described', label: 'לא כמתואר' },
  { value: 'changed_mind', label: 'שינוי דעה' },
  { value: 'wrong_item', label: 'קיבלתי מוצר שגוי' },
  { value: 'damaged_shipping', label: 'נזק במשלוח' },
  { value: 'other', label: 'אחר' },
] as const;

const resolutionOptions = [
  { value: 'exchange', label: 'החלפה למוצר אחר', description: 'נשלח לך מוצר אחר במקום' },
  { value: 'store_credit', label: 'קרדיט לחנות', description: 'קבל קרדיט לרכישות עתידיות' },
  { value: 'refund', label: 'זיכוי כספי', description: 'זיכוי לכרטיס האשראי' },
] as const;

export function ReturnRequestForm({ storeSlug, orderId, orderNumber, items }: ReturnRequestFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [selectedItems, setSelectedItems] = useState<Record<string, { selected: boolean; quantity: number }>>({});
  const [reason, setReason] = useState<typeof reasonOptions[number]['value'] | ''>('');
  const [reasonDetails, setReasonDetails] = useState('');
  const [resolution, setResolution] = useState<typeof resolutionOptions[number]['value'] | ''>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ requestNumber: string } | null>(null);

  const handleItemToggle = (itemId: string, maxQuantity: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: prev[itemId]?.selected 
        ? { selected: false, quantity: 0 }
        : { selected: true, quantity: maxQuantity }
    }));
  };

  const handleQuantityChange = (itemId: string, quantity: number, maxQuantity: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: { selected: quantity > 0, quantity: Math.min(Math.max(0, quantity), maxQuantity) }
    }));
  };

  const selectedItemsList = items.filter(item => selectedItems[item.id]?.selected);
  const totalValue = selectedItemsList.reduce(
    (sum, item) => sum + (item.price * (selectedItems[item.id]?.quantity || 0)),
    0
  );

  const canSubmit = selectedItemsList.length > 0 && reason && resolution;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError('');
    startTransition(async () => {
      const result = await createReturnRequest({
        storeSlug,
        orderId,
        type: resolution === 'exchange' ? 'exchange' : 'return',
        items: selectedItemsList.map(item => ({
          orderItemId: item.id,
          productId: item.productId || undefined,
          name: item.name + (item.variantTitle ? ` - ${item.variantTitle}` : ''),
          quantity: selectedItems[item.id]?.quantity || item.quantity,
          price: item.price,
          imageUrl: item.imageUrl || undefined,
        })),
        reason: reason as typeof reasonOptions[number]['value'],
        reasonDetails: reasonDetails || undefined,
        requestedResolution: resolution as typeof resolutionOptions[number]['value'],
      });

      if (result.success) {
        setSuccess({ requestNumber: result.requestNumber! });
      } else {
        setError(result.error || 'אירעה שגיאה');
      }
    });
  };

  if (success) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="text-xl font-medium mb-2">הבקשה נשלחה בהצלחה!</h2>
        <p className="text-gray-500 mb-2">
          מספר בקשה: <span className="font-medium text-black">{success.requestNumber}</span>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          נודיע לך ברגע שהבקשה תאושר
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push(`/shops/${storeSlug}/account/returns`)}
            className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium cursor-pointer"
          >
            צפייה בבקשות שלי
          </button>
          <button
            onClick={() => router.push(`/shops/${storeSlug}/account/orders/${orderNumber}`)}
            className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
          >
            חזרה להזמנה
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Select Items */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-medium">בחר פריטים להחזרה</h2>
          <p className="text-sm text-gray-500 mt-1">סמן את הפריטים שברצונך להחזיר או להחליף</p>
        </div>
        <div className="divide-y divide-gray-100">
          {items.map((item) => {
            const isSelected = selectedItems[item.id]?.selected || false;
            const quantity = selectedItems[item.id]?.quantity || 0;
            
            return (
              <div 
                key={item.id} 
                className={`flex gap-4 p-6 cursor-pointer transition-colors ${isSelected ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}
                onClick={() => handleItemToggle(item.id, item.quantity)}
              >
                {/* Checkbox */}
                <div className="flex items-start pt-1">
                  <div className={`w-5 h-5 border-2 rounded transition-colors ${isSelected ? 'bg-black border-black' : 'border-gray-300'}`}>
                    {isSelected && (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white">
                        <path d="M5 10l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>

                {/* Image */}
                <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden shrink-0">
                  {item.imageUrl && (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  {item.variantTitle && (
                    <p className="text-sm text-gray-500 mt-1">{item.variantTitle}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">₪{item.price.toFixed(0)}</p>
                </div>

                {/* Quantity Selector */}
                {isSelected && item.quantity > 1 && (
                  <div className="flex flex-col items-end" onClick={e => e.stopPropagation()}>
                    <label className="text-xs text-gray-500 mb-1">כמות</label>
                    <div className="flex items-center border border-gray-200 rounded">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, quantity - 1, item.quantity)}
                        className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 border-x border-gray-200 min-w-[40px] text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, quantity + 1, item.quantity)}
                        className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-gray-400 mt-1">מתוך {item.quantity}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Reason */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="font-medium mb-4">סיבת ההחזרה</h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {reasonOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setReason(option.value)}
              className={`p-3 text-sm border rounded-lg text-right transition-colors cursor-pointer ${
                reason === option.value 
                  ? 'border-black bg-gray-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        <div>
          <label className="block text-sm text-gray-500 mb-2">פרטים נוספים (אופציונלי)</label>
          <textarea
            value={reasonDetails}
            onChange={(e) => setReasonDetails(e.target.value)}
            placeholder="תאר את הבעיה..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>
      </div>

      {/* Step 3: Resolution */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="font-medium mb-4">מה תרצה לקבל?</h2>
        <div className="space-y-3">
          {resolutionOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setResolution(option.value)}
              className={`w-full p-4 border rounded-lg text-right transition-colors cursor-pointer ${
                resolution === option.value 
                  ? 'border-black bg-gray-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                  resolution === option.value ? 'border-black' : 'border-gray-300'
                }`}>
                  {resolution === option.value && (
                    <div className="w-2.5 h-2.5 bg-black rounded-full" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary & Submit */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-500">סה״כ ערך הפריטים:</span>
          <span className="text-xl font-medium">₪{totalValue.toFixed(0)}</span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit || isPending}
          className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {isPending ? 'שולח בקשה...' : 'שלח בקשה'}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          הבקשה תיבדק על ידי צוות החנות ותקבל מענה תוך 1-3 ימי עסקים
        </p>
      </div>
    </form>
  );
}

