"use client";

import { useState, useCallback } from "react";
import { submitClientIntake } from "@/lib/actions/client-intake";

// Types
interface WizardData {
  // Step 1: Design Style
  designStyle: string[];
  
  // Step 2: Branding
  hasExistingBranding: boolean | null;
  logoUrl: string;
  brandColors: string[];
  customColors: string;
  
  // Step 3: Reference Sites
  referenceSites: Array<{
    url: string;
    likes: string;
  }>;
  
  // Step 4: Detail Level
  detailLevel: 'minimal' | 'medium' | 'detailed' | null;
  
  // Step 5: Special Features
  specialFeatures: string[];
  customFeatures: string;
  
  // Contact Info
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  additionalNotes: string;
}

const initialData: WizardData = {
  designStyle: [],
  hasExistingBranding: null,
  logoUrl: "",
  brandColors: [],
  customColors: "",
  referenceSites: [{ url: "", likes: "" }, { url: "", likes: "" }, { url: "", likes: "" }],
  detailLevel: null,
  specialFeatures: [],
  customFeatures: "",
  businessName: "",
  contactName: "",
  email: "",
  phone: "",
  additionalNotes: "",
};

// Design styles with their characteristics
const designStyles = [
  { id: 'clean', label: 'נקי', icon: '✨', description: 'עיצוב פשוט ומסודר' },
  { id: 'luxury', label: 'יוקרתי', icon: '👑', description: 'אלגנטי ומרשים' },
  { id: 'colorful', label: 'צבעוני', icon: '🎨', description: 'חי ומגוון' },
  { id: 'minimal', label: 'מינימליסטי', icon: '◻️', description: 'פחות זה יותר' },
  { id: 'natural', label: 'טבעי', icon: '🌿', description: 'אורגני ורגוע' },
  { id: 'young', label: 'צעיר', icon: '⚡', description: 'דינמי ואנרגטי' },
  { id: 'tech', label: 'טכנולוגי', icon: '💻', description: 'מודרני וחדשני' },
];

const brandColorOptions = [
  { id: 'black', label: 'שחור', color: '#000000' },
  { id: 'white', label: 'לבן', color: '#FFFFFF' },
  { id: 'gold', label: 'זהב', color: '#D4AF37' },
  { id: 'silver', label: 'כסף', color: '#C0C0C0' },
  { id: 'red', label: 'אדום', color: '#EF4444' },
  { id: 'blue', label: 'כחול', color: '#3B82F6' },
  { id: 'green', label: 'ירוק', color: '#22C55E' },
  { id: 'pink', label: 'ורוד', color: '#EC4899' },
  { id: 'purple', label: 'סגול', color: '#A855F7' },
  { id: 'orange', label: 'כתום', color: '#F97316' },
  { id: 'brown', label: 'חום', color: '#92400E' },
  { id: 'beige', label: 'בז׳', color: '#D2B48C' },
];

const specialFeaturesList = [
  { id: 'video_banner', label: 'באנר וידאו', description: 'סרטון רקע מרשים', icon: '🎬' },
  { id: 'newsletter', label: 'ניוזלטר', description: 'הרשמה לרשימת תפוצה', icon: '📧' },
  { id: 'split_banner', label: 'באנר מפוצל', description: 'שני באנרים זה לצד זה', icon: '🖼️' },
  { id: 'reviews', label: 'ביקורות', description: 'חוות דעת לקוחות', icon: '⭐' },
  { id: 'instagram', label: 'פיד אינסטגרם', description: 'הצגת פוסטים מאינסטגרם', icon: '📸' },
  { id: 'faq', label: 'שאלות נפוצות', description: 'מענה לשאלות נפוצות', icon: '❓' },
  { id: 'blog', label: 'בלוג', description: 'תוכן ומאמרים', icon: '📝' },
  { id: 'loyalty', label: 'מועדון לקוחות', description: 'תוכנית נאמנות', icon: '💎' },
  { id: 'gift_cards', label: 'גיפט קארד', description: 'כרטיסי מתנה', icon: '🎁' },
  { id: 'multi_currency', label: 'מטבעות מרובים', description: 'תמיכה במטבעות שונים', icon: '💱' },
];

const detailLevels = [
  { 
    id: 'minimal' as const, 
    label: 'מינימלי וברור', 
    description: '4-5 אזורים בדף הבית. מתאים לעסקים עם מעט מוצרים או פוקוס על מוצר אחד.',
    sections: '4-5 sections',
    icon: '◻️'
  },
  { 
    id: 'medium' as const, 
    label: 'בינוני', 
    description: '6-7 אזורים בדף הבית. מאזן בין פשטות למידע. מתאים לרוב העסקים.',
    sections: '6-7 sections',
    icon: '▦'
  },
  { 
    id: 'detailed' as const, 
    label: 'מפורט מאוד', 
    description: '8+ אזורים בדף הבית. מציג הכל - קטגוריות, מוצרים, תוכן ועוד.',
    sections: '8+ sections',
    icon: '▣'
  },
];

// Step Components
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, idx) => (
        <div
          key={idx}
          className={`h-2 rounded-full transition-all duration-300 ${
            idx === currentStep
              ? 'w-8 bg-emerald-500'
              : idx < currentStep
              ? 'w-2 bg-emerald-400'
              : 'w-2 bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">{title}</h2>
      {subtitle && <p className="text-gray-500">{subtitle}</p>}
    </div>
  );
}

// Main Wizard Component
export function ClientIntakeWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message?: string } | null>(null);
  
  const totalSteps = 6;

  const updateData = useCallback((updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = () => {
    if (step < totalSteps - 1) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await submitClientIntake(data);
      setSubmitResult(result);
      if (result.success) {
        setStep(totalSteps); // Go to success screen
      }
    } catch {
      setSubmitResult({ success: false, message: 'אירעה שגיאה, נסו שוב' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return data.designStyle.length > 0;
      case 1: return data.hasExistingBranding !== null && (data.hasExistingBranding || data.brandColors.length > 0 || data.customColors);
      case 2: return data.referenceSites.some(site => site.url.trim() !== '');
      case 3: return data.detailLevel !== null;
      case 4: return true; // Features are optional
      case 5: return data.businessName && data.contactName && data.email && data.phone;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div>
            <StepTitle 
              title="איך היית מתאר/ת את סגנון העיצוב הרצוי?" 
              subtitle="ניתן לבחור יותר מאפשרות אחת"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {designStyles.map((style) => {
                const isSelected = data.designStyle.includes(style.id);
                return (
                  <button
                    key={style.id}
                    onClick={() => {
                      const newStyles = isSelected
                        ? data.designStyle.filter(s => s !== style.id)
                        : [...data.designStyle, style.id];
                      updateData({ designStyle: newStyles });
                    }}
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-center group ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className={`text-4xl mb-3 transition-transform group-hover:scale-110`}>
                      {style.icon}
                    </div>
                    <div className="font-bold text-lg mb-1 text-gray-900">{style.label}</div>
                    <div className="text-sm text-gray-500">{style.description}</div>
                    {isSelected && (
                      <div className="absolute top-3 left-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 1:
        return (
          <div>
            <StepTitle 
              title="האם יש כבר לוגו ומיתוג?" 
              subtitle="אם יש - נשתמש בצבעים שלכם. אם אין - נבחר יחד"
            />
            
            {/* Yes/No Selection */}
            <div className="flex gap-4 justify-center mb-8">
              <button
                onClick={() => updateData({ hasExistingBranding: true })}
                className={`px-8 py-4 rounded-xl border-2 transition-all ${
                  data.hasExistingBranding === true
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-2xl mb-2 block">✅</span>
                <span className="font-bold text-gray-900">יש לי מיתוג</span>
              </button>
              <button
                onClick={() => updateData({ hasExistingBranding: false })}
                className={`px-8 py-4 rounded-xl border-2 transition-all ${
                  data.hasExistingBranding === false
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-2xl mb-2 block">🎨</span>
                <span className="font-bold text-gray-900">צריך לבחור צבעים</span>
              </button>
            </div>

            {/* Conditional Content */}
            <div>
              {data.hasExistingBranding === true && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <label className="block text-sm font-medium mb-2 text-gray-700">קישור ללוגו (אופציונלי)</label>
                    <input
                      type="url"
                      value={data.logoUrl}
                      onChange={(e) => updateData({ logoUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      או שלחו לנו את הלוגו במייל לאחר מילוי השאלון
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <label className="block text-sm font-medium mb-2 text-gray-700">צבעי המותג שלכם</label>
                    <input
                      type="text"
                      value={data.customColors}
                      onChange={(e) => updateData({ customColors: e.target.value })}
                      placeholder="למשל: #FF5733, כחול כהה, זהב..."
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
              )}

              {data.hasExistingBranding === false && (
                <div className="animate-fade-in">
                  <p className="text-center text-gray-500 mb-4">בחרו את הצבעים שאתם אוהבים (עד 3)</p>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {brandColorOptions.map((color) => {
                      const isSelected = data.brandColors.includes(color.id);
                      return (
                        <button
                          key={color.id}
                          onClick={() => {
                            if (isSelected) {
                              updateData({ brandColors: data.brandColors.filter(c => c !== color.id) });
                            } else if (data.brandColors.length < 3) {
                              updateData({ brandColors: [...data.brandColors, color.id] });
                            }
                          }}
                          disabled={!isSelected && data.brandColors.length >= 3}
                          className={`relative p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          } ${!isSelected && data.brandColors.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div
                            className="w-10 h-10 rounded-full mx-auto mb-2 border border-gray-200 shadow-sm"
                            style={{ backgroundColor: color.color }}
                          />
                          <span className="text-xs text-gray-700">{color.label}</span>
                          {isSelected && (
                            <div className="absolute top-2 left-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4">
                    <input
                      type="text"
                      value={data.customColors}
                      onChange={(e) => updateData({ customColors: e.target.value })}
                      placeholder="או כתבו צבעים ספציפיים..."
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <StepTitle 
              title="אתרים שאתם אוהבים" 
              subtitle="שתפו לפחות אתר אחד שמעורר בכם השראה"
            />
            <div className="space-y-4">
              {data.referenceSites.map((site, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-500">אתר השראה {idx + 1}</span>
                  </div>
                  <input
                    type="url"
                    value={site.url}
                    onChange={(e) => {
                      const newSites = [...data.referenceSites];
                      newSites[idx] = { ...newSites[idx], url: e.target.value };
                      updateData({ referenceSites: newSites });
                    }}
                    placeholder="כתובת האתר (למשל: https://zara.com)"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent mb-3 text-gray-900"
                  />
                  <textarea
                    value={site.likes}
                    onChange={(e) => {
                      const newSites = [...data.referenceSites];
                      newSites[idx] = { ...newSites[idx], likes: e.target.value };
                      updateData({ referenceSites: newSites });
                    }}
                    placeholder="מה אהבתם באתר? (צבעים, מבנה, טיפוגרפיה, תחושה כללית...)"
                    rows={2}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-gray-900"
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  updateData({ referenceSites: [...data.referenceSites, { url: "", likes: "" }] });
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                + הוסף אתר נוסף
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <StepTitle 
              title="כמה תוכן תרצו בדף הבית?" 
              subtitle="זה ישפיע על מספר האזורים והמורכבות"
            />
            <div className="grid md:grid-cols-3 gap-4">
              {detailLevels.map((level) => {
                const isSelected = data.detailLevel === level.id;
                return (
                  <button
                    key={level.id}
                    onClick={() => updateData({ detailLevel: level.id })}
                    className={`relative p-6 rounded-2xl border-2 transition-all text-right ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-4xl mb-4">{level.icon}</div>
                    <div className="font-bold text-lg mb-2 text-gray-900">{level.label}</div>
                    <div className="text-sm text-gray-500 mb-3">{level.description}</div>
                    <div className="inline-flex px-3 py-1 bg-emerald-100 rounded-full text-xs text-emerald-700">
                      {level.sections}
                    </div>
                    {isSelected && (
                      <div className="absolute top-4 left-4 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <StepTitle 
              title="פיצ'רים מיוחדים" 
              subtitle="האם יש משהו ספציפי שתרצו שיהיה באתר? (לא חובה)"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {specialFeaturesList.map((feature) => {
                const isSelected = data.specialFeatures.includes(feature.id);
                return (
                  <button
                    key={feature.id}
                    onClick={() => {
                      const newFeatures = isSelected
                        ? data.specialFeatures.filter(f => f !== feature.id)
                        : [...data.specialFeatures, feature.id];
                      updateData({ specialFeatures: newFeatures });
                    }}
                    className={`p-4 rounded-xl border-2 transition-all text-right ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{feature.icon}</span>
                      <div>
                        <div className="font-medium text-sm text-gray-900">{feature.label}</div>
                        <div className="text-xs text-gray-500">{feature.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">משהו נוסף שחשוב לציין?</label>
              <textarea
                value={data.customFeatures}
                onChange={(e) => updateData({ customFeatures: e.target.value })}
                placeholder="פיצ'רים מיוחדים, אינטגרציות, דרישות טכניות..."
                rows={3}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-gray-900"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div>
            <StepTitle 
              title="פרטי יצירת קשר" 
              subtitle="איך נוכל לחזור אליכם עם ההצעה?"
            />
            <div className="max-w-xl mx-auto space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">שם העסק *</label>
                <input
                  type="text"
                  value={data.businessName}
                  onChange={(e) => updateData({ businessName: e.target.value })}
                  placeholder="שם החנות / המותג"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">שם איש קשר *</label>
                <input
                  type="text"
                  value={data.contactName}
                  onChange={(e) => updateData({ contactName: e.target.value })}
                  placeholder="השם שלך"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">אימייל *</label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => updateData({ email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">טלפון *</label>
                  <input
                    type="tel"
                    value={data.phone}
                    onChange={(e) => updateData({ phone: e.target.value })}
                    placeholder="050-000-0000"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">הערות נוספות</label>
                <textarea
                  value={data.additionalNotes}
                  onChange={(e) => updateData({ additionalNotes: e.target.value })}
                  placeholder="כל מה שחשוב לנו לדעת..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-gray-900"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Success Screen
  if (step === totalSteps) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-4 text-gray-900">תודה רבה! 🎉</h2>
        <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
          קיבלנו את הפרטים שלכם. ניצור קשר תוך 24 שעות עם הצעה מותאמת אישית ותבנית מוכנה!
        </p>
        <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 max-w-md mx-auto">
          <h3 className="font-bold mb-2 text-gray-900">מה קורה עכשיו?</h3>
          <ul className="text-sm text-gray-600 space-y-2 text-right">
            <li className="flex items-center gap-2">
              <span className="text-emerald-600">✓</span>
              נעבור על התשובות שלכם
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-600">✓</span>
              ניצור תבנית מותאמת אישית
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-600">✓</span>
              נשלח לכם הצעת מחיר
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-6 md:p-10">
      <StepIndicator currentStep={step} totalSteps={totalSteps} />
      
      <div key={step} className="animate-fade-in">
        {renderStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200">
        <button
          onClick={prevStep}
          disabled={step === 0}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            step === 0
              ? 'opacity-0 pointer-events-none'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ← הקודם
        </button>

        {step < totalSteps - 1 ? (
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className={`px-8 py-3 rounded-xl font-bold transition-all ${
              canProceed()
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            הבא →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
            className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              canProceed() && !isSubmitting
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                שולח...
              </>
            ) : (
              <>שליחה 🚀</>
            )}
          </button>
        )}
      </div>

      {submitResult && !submitResult.success && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center">
          {submitResult.message || 'אירעה שגיאה, נסו שוב'}
        </div>
      )}
    </div>
  );
}
