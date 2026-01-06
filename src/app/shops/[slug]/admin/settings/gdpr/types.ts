// ============================================
// GDPR Settings Types & Defaults
// Shared between server and client components
// ============================================

export interface GDPRSettings {
  enabled: boolean;
  useCustomText: boolean;
  customPolicyText: string;
  acceptButtonText: string;
  declineButtonText: string;
  bannerPosition: 'bottom' | 'top';
  bannerStyle: 'full-width' | 'box-right' | 'box-left';
  showDeclineButton: boolean;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  policyPageUrl: string;
}

export function getDefaultGDPRSettings(): GDPRSettings {
  return {
    enabled: false,
    useCustomText: false,
    customPolicyText: `אנו משתמשים בעוגיות כדי לשפר את חווית הגלישה שלך באתר. על ידי המשך הגלישה, אתה מסכים לשימוש שלנו בעוגיות.

מהן עוגיות?
עוגיות הן קבצי טקסט קטנים שמאוחסנים על המכשיר שלך בעת הגלישה באתר. העוגיות מאפשרות לאתר לזכור את העדפותיך ולספק לך חוויית משתמש מותאמת אישית.

איך אנחנו משתמשים בעוגיות?
• עוגיות חיוניות - נדרשות לתפעול האתר
• עוגיות ביצועים - עוזרות לנו להבין כיצד המבקרים משתמשים באתר
• עוגיות פרסום - משמשות להתאמת פרסומות רלוונטיות`,
    acceptButtonText: 'אני מסכים',
    declineButtonText: 'לא מסכים',
    bannerPosition: 'bottom',
    bannerStyle: 'box-right',
    showDeclineButton: true,
    backgroundColor: '#1f2937',
    textColor: '#ffffff',
    buttonColor: '#10b981',
    buttonTextColor: '#ffffff',
    policyPageUrl: '',
  };
}

