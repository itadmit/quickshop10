'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updatePrintSettings } from '../actions';

interface PrintSettingsFormProps {
  storeId: string;
  settings: Record<string, unknown>;
}

export interface PrintSettings {
  // Product fields
  showProductImage: boolean;
  showProductPrice: boolean;
  showProductSku: boolean;
  showProductVariant: boolean;
  // Order fields
  showOrderTotal: boolean;
  showSubtotal: boolean;
  showShipping: boolean;
  showDiscount: boolean;
  // Customer fields
  showCustomerDetails: boolean;
  showShippingAddress: boolean;
  showCustomerPhone: boolean;
  // Other
  showStatusBadges: boolean;
  showOrderNotes: boolean;
  showThankYouMessage: boolean;
  showStoreLogo: boolean;
}

const defaultSettings: PrintSettings = {
  showProductImage: true,
  showProductPrice: true,
  showProductSku: true,
  showProductVariant: true,
  showOrderTotal: true,
  showSubtotal: true,
  showShipping: true,
  showDiscount: true,
  showCustomerDetails: true,
  showShippingAddress: true,
  showCustomerPhone: true,
  showStatusBadges: true,
  showOrderNotes: true,
  showThankYouMessage: true,
  showStoreLogo: true,
};

export function PrintSettingsForm({ storeId, settings }: PrintSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState<PrintSettings>({
    showProductImage: (settings.showProductImage as boolean) ?? defaultSettings.showProductImage,
    showProductPrice: (settings.showProductPrice as boolean) ?? defaultSettings.showProductPrice,
    showProductSku: (settings.showProductSku as boolean) ?? defaultSettings.showProductSku,
    showProductVariant: (settings.showProductVariant as boolean) ?? defaultSettings.showProductVariant,
    showOrderTotal: (settings.showOrderTotal as boolean) ?? defaultSettings.showOrderTotal,
    showSubtotal: (settings.showSubtotal as boolean) ?? defaultSettings.showSubtotal,
    showShipping: (settings.showShipping as boolean) ?? defaultSettings.showShipping,
    showDiscount: (settings.showDiscount as boolean) ?? defaultSettings.showDiscount,
    showCustomerDetails: (settings.showCustomerDetails as boolean) ?? defaultSettings.showCustomerDetails,
    showShippingAddress: (settings.showShippingAddress as boolean) ?? defaultSettings.showShippingAddress,
    showCustomerPhone: (settings.showCustomerPhone as boolean) ?? defaultSettings.showCustomerPhone,
    showStatusBadges: (settings.showStatusBadges as boolean) ?? defaultSettings.showStatusBadges,
    showOrderNotes: (settings.showOrderNotes as boolean) ?? defaultSettings.showOrderNotes,
    showThankYouMessage: (settings.showThankYouMessage as boolean) ?? defaultSettings.showThankYouMessage,
    showStoreLogo: (settings.showStoreLogo as boolean) ?? defaultSettings.showStoreLogo,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);

    startTransition(async () => {
      const result = await updatePrintSettings(storeId, formData);
      if (result.success) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  const toggleAll = (value: boolean) => {
    setFormData({
      showProductImage: value,
      showProductPrice: value,
      showProductSku: value,
      showProductVariant: value,
      showOrderTotal: value,
      showSubtotal: value,
      showShipping: value,
      showDiscount: value,
      showCustomerDetails: value,
      showShippingAddress: value,
      showCustomerPhone: value,
      showStatusBadges: value,
      showOrderNotes: value,
      showThankYouMessage: value,
      showStoreLogo: value,
    });
  };

  const CheckboxItem = ({ 
    label, 
    description, 
    field, 
    disabled = false 
  }: { 
    label: string; 
    description: string; 
    field: keyof PrintSettings;
    disabled?: boolean;
  }) => (
    <label className={`flex items-center justify-between cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={formData[field]}
        onChange={(e) => !disabled && setFormData(prev => ({ ...prev, [field]: e.target.checked }))}
        disabled={disabled}
        className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black/20"
      />
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => toggleAll(true)}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          הצג הכל
        </button>
        <button
          type="button"
          onClick={() => toggleAll(false)}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          הסתר הכל
        </button>
        <span className="text-sm text-gray-500">
          (שם מוצר וכמות תמיד יוצגו)
        </span>
      </div>

      {/* Product Fields */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          פרטי מוצר
        </h2>
        
        <div className="space-y-4">
          <CheckboxItem
            label="תמונת מוצר"
            description="הצג תמונה קטנה ליד שם המוצר"
            field="showProductImage"
          />
          <CheckboxItem
            label="מחיר ליחידה"
            description="הצג את המחיר של כל מוצר"
            field="showProductPrice"
          />
          <CheckboxItem
            label="מק״ט"
            description="הצג את המק״ט של המוצר"
            field="showProductSku"
          />
          <CheckboxItem
            label="וריאנט"
            description="הצג מידה, צבע או וריאנט אחר"
            field="showProductVariant"
          />
        </div>
      </div>

      {/* Order Summary Fields */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          סיכום הזמנה
        </h2>
        
        <div className="space-y-4">
          <CheckboxItem
            label="סה״כ לתשלום"
            description="הצג את הסכום הסופי של ההזמנה"
            field="showOrderTotal"
          />
          <CheckboxItem
            label="סכום ביניים"
            description="סכום המוצרים לפני הנחות ומשלוח"
            field="showSubtotal"
          />
          <CheckboxItem
            label="משלוח"
            description="הצג עלות משלוח ושיטת משלוח"
            field="showShipping"
          />
          <CheckboxItem
            label="הנחות וקופונים"
            description="הצג קוד קופון וסכום ההנחה"
            field="showDiscount"
          />
        </div>
      </div>

      {/* Customer Fields */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          פרטי לקוח
        </h2>
        
        <div className="space-y-4">
          <CheckboxItem
            label="פרטי לקוח"
            description="שם ואימייל של הלקוח"
            field="showCustomerDetails"
          />
          <CheckboxItem
            label="כתובת למשלוח"
            description="כתובת מלאה למשלוח"
            field="showShippingAddress"
          />
          <CheckboxItem
            label="טלפון לקוח"
            description="מספר הטלפון של הלקוח"
            field="showCustomerPhone"
          />
        </div>
      </div>

      {/* Other Fields */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          אחר
        </h2>
        
        <div className="space-y-4">
          <CheckboxItem
            label="לוגו חנות"
            description="הצג את הלוגו בראש ההדפסה"
            field="showStoreLogo"
          />
          <CheckboxItem
            label="סטטוס הזמנה"
            description="הצג תגיות סטטוס (שולם, נשלח וכו׳)"
            field="showStatusBadges"
          />
          <CheckboxItem
            label="הערות הזמנה"
            description="הצג הערות שהלקוח הוסיף"
            field="showOrderNotes"
          />
          <CheckboxItem
            label="הודעת תודה"
            description="הצג ׳תודה על הקנייה׳ בתחתית"
            field="showThankYouMessage"
          />
        </div>
      </div>

      {/* Preview Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium text-blue-900">שים לב</p>
            <p className="text-sm text-blue-700">
              שם המוצר וכמות תמיד יוצגו בהדפסה. השינויים יחולו על כל ההדפסות החדשות.
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isPending ? 'שומר...' : 'שמור שינויים'}
        </button>
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            נשמר בהצלחה
          </span>
        )}
      </div>
    </form>
  );
}

