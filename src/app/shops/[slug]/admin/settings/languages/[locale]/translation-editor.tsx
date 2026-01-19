'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, 
  Search, 
  RefreshCw, 
  Check, 
  AlertCircle,
  ShoppingCart,
  CreditCard,
  Package,
  User,
  Menu,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { updateStoreTranslations } from '../actions';
import type { SupportedLocale, UITranslations } from '@/lib/translations/types';

interface TranslationEditorProps {
  storeId: string;
  locale: SupportedLocale;
  defaults: UITranslations;
  custom: Partial<UITranslations>;
}

// Translation sections with icons and labels
const SECTIONS: { key: keyof UITranslations; label: string; icon: React.ReactNode }[] = [
  { key: 'checkout', label: 'צ\'קאאוט', icon: <CreditCard className="w-4 h-4" /> },
  { key: 'cart', label: 'עגלת קניות', icon: <ShoppingCart className="w-4 h-4" /> },
  { key: 'product', label: 'מוצר', icon: <Package className="w-4 h-4" /> },
  { key: 'account', label: 'חשבון משתמש', icon: <User className="w-4 h-4" /> },
  { key: 'general', label: 'כללי', icon: <Settings className="w-4 h-4" /> },
];

// Flatten translations for editing
function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
    } else if (typeof value === 'string') {
      result[newKey] = value;
    }
  }
  
  return result;
}

// Unflatten translations for saving
function unflattenObject(obj: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const keys = key.split('.');
    let current = result;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]] as Record<string, unknown>;
    }
    
    current[keys[keys.length - 1]] = value;
  }
  
  return result;
}

// Human-readable labels for translation keys
const KEY_LABELS: Record<string, string> = {
  // Checkout
  'checkout.title': 'כותרת עמוד',
  'checkout.shipping.title': 'כותרת משלוח',
  'checkout.shipping.firstName': 'שם פרטי',
  'checkout.shipping.lastName': 'שם משפחה',
  'checkout.shipping.phone': 'טלפון',
  'checkout.shipping.email': 'אימייל',
  'checkout.shipping.address': 'כתובת',
  'checkout.shipping.city': 'עיר',
  'checkout.shipping.zip': 'מיקוד',
  'checkout.shipping.notes': 'הערות להזמנה',
  'checkout.payment.title': 'כותרת תשלום',
  'checkout.payment.placeOrder': 'כפתור ביצוע הזמנה',
  'checkout.summary.subtotal': 'סיכום ביניים',
  'checkout.summary.shipping': 'משלוח',
  'checkout.summary.discount': 'הנחה',
  'checkout.summary.total': 'סה"כ',
  'checkout.coupon.placeholder': 'שדה קופון',
  'checkout.coupon.apply': 'כפתור החלת קופון',
  'checkout.success.thankYou': 'הודעת תודה',
  'checkout.success.orderNumber': 'מספר הזמנה',
  'checkout.success.continueShopping': 'המשך קניות',
  
  // Cart
  'cart.title': 'כותרת עגלה',
  'cart.empty': 'עגלה ריקה',
  'cart.emptyDescription': 'תיאור עגלה ריקה',
  'cart.checkout': 'כפתור מעבר לקופה',
  'cart.continueShopping': 'המשך קניות',
  'cart.total': 'סה"כ',
  'cart.quantity': 'כמות',
  'cart.remove': 'הסר פריט',
  'cart.freeShippingProgress': 'התקדמות למשלוח חינם',
  'cart.freeShippingReached': 'הודעת משלוח חינם',
  
  // Product
  'product.addToCart': 'הוסף לעגלה',
  'product.outOfStock': 'אזל מהמלאי',
  'product.quantity': 'כמות',
  'product.description': 'תיאור',
  'product.reviews': 'ביקורות',
  
  // General
  'general.search': 'חיפוש',
  'general.searchPlaceholder': 'placeholder חיפוש',
  'general.loading': 'טוען',
  'general.error': 'שגיאה',
  'general.close': 'סגור',
};

export function TranslationEditor({
  storeId,
  locale,
  defaults,
  custom,
}: TranslationEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['checkout']));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  // Flatten defaults and custom for editing
  const flatDefaults = useMemo(() => flattenObject(defaults as unknown as Record<string, unknown>), [defaults]);
  const flatCustom = useMemo(() => flattenObject(custom as unknown as Record<string, unknown>), [custom]);
  
  // Local state for edits
  const [edits, setEdits] = useState<Record<string, string>>({ ...flatCustom });

  // Filter keys by search query
  const filteredKeys = useMemo(() => {
    const keys = Object.keys(flatDefaults);
    if (!searchQuery) return keys;
    
    const query = searchQuery.toLowerCase();
    return keys.filter(key => {
      const label = KEY_LABELS[key] || key;
      const value = flatDefaults[key];
      const customValue = edits[key] || '';
      
      return (
        key.toLowerCase().includes(query) ||
        label.toLowerCase().includes(query) ||
        value.toLowerCase().includes(query) ||
        customValue.toLowerCase().includes(query)
      );
    });
  }, [flatDefaults, searchQuery, edits]);

  // Group keys by section
  const groupedKeys = useMemo(() => {
    const groups: Record<string, string[]> = {};
    
    for (const key of filteredKeys) {
      const section = key.split('.')[0];
      if (!groups[section]) groups[section] = [];
      groups[section].push(key);
    }
    
    return groups;
  }, [filteredKeys]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleChange = (key: string, value: string) => {
    setEdits(prev => {
      const next = { ...prev };
      if (value === '' || value === flatDefaults[key]) {
        delete next[key]; // Remove if empty or same as default
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const handleReset = (key: string) => {
    setEdits(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      // Only save non-empty edits
      const customTranslations = unflattenObject(edits) as Partial<UITranslations>;
      
      const result = await updateStoreTranslations(storeId, locale, customTranslations);
      
      if (result.success) {
        setSuccess('התרגומים נשמרו בהצלחה');
        router.refresh();
      } else {
        setError(result.error || 'שגיאה בשמירת תרגומים');
      }
    });
  };

  const hasChanges = Object.keys(edits).length > 0;

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Search & Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="חפש תרגום..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={handleSave}
          disabled={isPending || !hasChanges}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            hasChanges
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          שמור שינויים
          {hasChanges && (
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
              {Object.keys(edits).length}
            </span>
          )}
        </button>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {SECTIONS.map(({ key: sectionKey, label, icon }) => {
          const sectionKeys = groupedKeys[sectionKey] || [];
          if (sectionKeys.length === 0) return null;
          
          const isExpanded = expandedSections.has(sectionKey);
          const customCount = sectionKeys.filter(k => edits[k]).length;
          
          return (
            <div key={sectionKey} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection(sectionKey)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">{icon}</span>
                  <span className="font-medium text-gray-900">{label}</span>
                  <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                    {sectionKeys.length}
                  </span>
                  {customCount > 0 && (
                    <span className="bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full">
                      {customCount} מותאם
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {sectionKeys.map((key) => {
                    const defaultValue = flatDefaults[key];
                    const customValue = edits[key] || '';
                    const hasCustom = !!edits[key];
                    const label = KEY_LABELS[key] || key.split('.').pop() || key;
                    
                    return (
                      <div
                        key={key}
                        className={`px-6 py-4 flex gap-4 border-b border-gray-50 last:border-b-0 ${
                          hasCustom ? 'bg-purple-50/50' : ''
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {label}
                          </label>
                          <p className="text-xs text-gray-400 mb-2 truncate" title={key}>
                            {key}
                          </p>
                          <div className="flex gap-3">
                            {/* Default value (read-only) */}
                            <div className="flex-1">
                              <p className="text-[10px] text-gray-400 mb-1">ברירת מחדל</p>
                              <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600 min-h-[36px]">
                                {defaultValue}
                              </div>
                            </div>
                            
                            {/* Custom value (editable) */}
                            <div className="flex-1">
                              <p className="text-[10px] text-gray-400 mb-1">מותאם אישית</p>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={customValue}
                                  onChange={(e) => handleChange(key, e.target.value)}
                                  placeholder={defaultValue}
                                  className={`w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                    hasCustom
                                      ? 'border-purple-300 bg-white'
                                      : 'border-gray-200 bg-white'
                                  }`}
                                />
                                {hasCustom && (
                                  <button
                                    onClick={() => handleReset(key)}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                                    title="חזור לברירת מחדל"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredKeys.length === 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">לא נמצאו תרגומים תואמים</p>
        </div>
      )}
    </div>
  );
}

