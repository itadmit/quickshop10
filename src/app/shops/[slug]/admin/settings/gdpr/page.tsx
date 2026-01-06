import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/ui';
import { GDPRSettingsForm } from './gdpr-form';

export const dynamic = 'force-dynamic';

// ============================================
// GDPR & Cookies Settings Page - Server Component
// ============================================

interface GDPRPageProps {
  params: Promise<{ slug: string }>;
}

const settingsTabs = [
  { id: 'general', label: 'כללי', href: '' },
  { id: 'subscription', label: 'מנוי', href: '/subscription' },
  { id: 'domain', label: 'דומיין', href: '/domain' },
  { id: 'payments', label: 'תשלומים', href: '/payments' },
  { id: 'tracking', label: 'מעקב', href: '/tracking' },
  { id: 'checkout', label: 'קופה', href: '/checkout' },
  { id: 'shipping', label: 'משלוח', href: '/shipping' },
  { id: 'tax', label: 'מיסים', href: '/tax' },
  { id: 'notifications', label: 'התראות', href: '/notifications' },
  { id: 'gdpr', label: 'עוגיות', href: '/gdpr' },
];

export default async function GDPRPage({ params }: GDPRPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const settings = (store.settings as Record<string, unknown>) || {};
  const gdprSettings = (settings.gdpr as GDPRSettings) || getDefaultGDPRSettings();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="הגדרות חנות"
        description="הגדר את פרטי החנות, עיצוב, ואפשרויות נוספות"
      />

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <nav className="flex border-b border-gray-200 px-2 sm:px-4 overflow-x-auto scrollbar-hide">
          {settingsTabs.map((tab) => (
            <SettingsTab 
              key={tab.id}
              href={`/shops/${slug}/admin/settings${tab.href}`} 
              label={tab.label} 
              active={tab.id === 'gdpr'} 
            />
          ))}
        </nav>

        {/* GDPR Settings Form */}
        <div className="p-4 sm:p-6">
          <GDPRSettingsForm storeId={store.id} settings={gdprSettings} />
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`
        px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex-shrink-0
        ${active
          ? 'border-gray-900 text-gray-900'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }
      `}
    >
      {label}
    </Link>
  );
}

// Types & Defaults
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

