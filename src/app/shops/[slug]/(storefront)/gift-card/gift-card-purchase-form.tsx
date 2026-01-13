'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, User, Mail, MessageCircle, ShoppingCart, Check } from 'lucide-react';
import { useStore } from '@/lib/store-context';
import type { GiftCardSettings } from '../../admin/gift-cards/settings/types';

interface GiftCardPurchaseFormProps {
  storeId: string;
  storeSlug: string;
  storeName: string;
  settings: GiftCardSettings;
  basePath?: string;
}

// Special product ID for gift cards (virtual product)
const GIFT_CARD_PRODUCT_ID = 'gift-card';

export function GiftCardPurchaseForm({
  storeId,
  storeSlug,
  storeName,
  settings,
  basePath = '',
}: GiftCardPurchaseFormProps) {
  const router = useRouter();
  const { addToCart, openCart } = useStore();
  
  // Form state
  const [selectedAmount, setSelectedAmount] = useState<number | null>(
    settings.amounts.length > 0 ? settings.amounts[0] : null
  );
  const [customAmount, setCustomAmount] = useState('');
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const finalAmount = useCustomAmount ? Number(customAmount) : selectedAmount;

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setUseCustomAmount(false);
    setCustomAmount('');
  };

  const handleCustomAmountFocus = () => {
    setUseCustomAmount(true);
    setSelectedAmount(null);
  };

  const validateForm = (): string | null => {
    if (!finalAmount || finalAmount <= 0) {
      return 'יש לבחור סכום';
    }

    if (settings.allowCustomAmount && useCustomAmount) {
      if (finalAmount < settings.minAmount) {
        return `הסכום המינימלי הוא ₪${settings.minAmount}`;
      }
      if (finalAmount > settings.maxAmount) {
        return `הסכום המקסימלי הוא ₪${settings.maxAmount}`;
      }
    }

    if (!recipientEmail.trim()) {
      return 'יש להזין כתובת אימייל של הנמען';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail.trim())) {
      return 'כתובת האימייל אינה תקינה';
    }

    if (!recipientName.trim()) {
      return 'יש להזין שם הנמען';
    }

    return null;
  };

  const handleAddToCart = () => {
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Add gift card to cart
    addToCart({
      productId: GIFT_CARD_PRODUCT_ID,
      name: `גיפט קארד ₪${finalAmount}`,
      price: finalAmount!,
      image: settings.cardImage || '/placeholder.svg',
      sku: `GC-${finalAmount}`,
      // Gift card specific fields
      isGiftCard: true,
      giftCardDetails: {
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        senderName: senderName.trim() || undefined,
        message: message.trim() || undefined,
      },
      // No inventory tracking for virtual products
      trackInventory: false,
      maxQuantity: null,
    }, 1);

    // Show success state
    setAddedToCart(true);
    
    // Reset form
    setRecipientName('');
    setRecipientEmail('');
    setSenderName('');
    setMessage('');
    
    // After 2 seconds, reset button and open cart
    setTimeout(() => {
      setAddedToCart(false);
      openCart();
    }, 1500);
  };

  const handleGoToCheckout = () => {
    router.push(`${basePath}/checkout`);
  };

  return (
    <div className="space-y-6">
      {/* Amount Selection */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-500" />
          בחרו סכום
        </h2>
        
        {/* Preset Amounts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {settings.amounts.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handleAmountSelect(amount)}
              className={`py-4 px-4 rounded-xl font-bold text-lg transition-all ${
                selectedAmount === amount && !useCustomAmount
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              ₪{amount}
            </button>
          ))}
        </div>
        
        {/* Custom Amount */}
        {settings.allowCustomAmount && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              או הזינו סכום מותאם אישית (₪{settings.minAmount} - ₪{settings.maxAmount})
            </label>
            <div className="relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₪</span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                onFocus={handleCustomAmountFocus}
                className={`w-full pl-4 pr-10 py-3 rounded-xl border-2 transition-all ${
                  useCustomAmount && customAmount
                    ? 'border-purple-500 bg-purple-50/50'
                    : 'border-gray-200 focus:border-purple-500'
                } focus:outline-none`}
                placeholder={`${settings.minAmount}`}
                min={settings.minAmount}
                max={settings.maxAmount}
              />
            </div>
          </div>
        )}
      </div>

      {/* Recipient Details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <User className="w-5 h-5 text-purple-500" />
          פרטי הנמען
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              שם הנמען *
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
              placeholder="לדוגמה: דנה כהן"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              אימייל הנמען *
            </label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full pl-4 pr-11 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
                placeholder="dana@example.com"
                dir="ltr"
              />
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            השם שלך (יופיע בכרטיס)
          </label>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
            placeholder="לדוגמה: מיכל"
          />
        </div>
      </div>

      {/* Personal Message */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-500" />
          הודעה אישית (אופציונלי)
        </h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:outline-none transition-colors resize-none"
          rows={3}
          placeholder="יום הולדת שמח! מקווה שתמצאי משהו שתאהבי ❤️"
          maxLength={500}
        />
        <p className="text-xs text-gray-400 mt-2 text-left" dir="ltr">
          {message.length}/500
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {/* Add to Cart Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!finalAmount || addedToCart}
          className={`w-full py-4 font-bold text-lg rounded-xl transition-all shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
            addedToCart
              ? 'bg-green-500 text-white shadow-green-500/25'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-purple-500/25 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50'
          }`}
        >
          {addedToCart ? (
            <>
              <Check className="w-5 h-5" />
              נוסף לעגלה!
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              הוסף לעגלה - ₪{finalAmount || 0}
            </>
          )}
        </button>

        {/* Go to Checkout Button */}
        <button
          type="button"
          onClick={handleGoToCheckout}
          className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          לתשלום
        </button>
      </div>

      <p className="text-center text-xs text-gray-500">
        הגיפט קארד יישלח ישירות לכתובת האימייל של הנמען לאחר התשלום
      </p>
    </div>
  );
}
