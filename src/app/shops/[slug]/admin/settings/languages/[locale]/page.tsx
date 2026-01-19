import { db } from '@/lib/db';
import { stores, storeTranslations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { TranslationEditor } from './translation-editor';
import type { SupportedLocale, UITranslations } from '@/lib/translations/types';
import { getDefaultTranslations, SUPPORTED_LOCALES } from '@/lib/translations';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface TranslationPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

// Locale display info
const LOCALE_INFO: Record<SupportedLocale, { name: string; nativeName: string; flag: string }> = {
  he: { name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
};

export default async function TranslationEditorPage({ params }: TranslationPageProps) {
  const { slug, locale } = await params;

  // Validate locale
  if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    notFound();
  }

  const typedLocale = locale as SupportedLocale;

  // Get store data
  const [store] = await db
    .select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      supportedLocales: stores.supportedLocales,
    })
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);

  if (!store) {
    notFound();
  }

  // Check if this locale is supported by the store
  const supportedLocales = (store.supportedLocales as SupportedLocale[]) || ['he'];
  if (!supportedLocales.includes(typedLocale)) {
    redirect(`/shops/${slug}/admin/settings/languages`);
  }

  // Get custom translations for this locale
  const [customTranslations] = await db
    .select()
    .from(storeTranslations)
    .where(
      and(
        eq(storeTranslations.storeId, store.id),
        eq(storeTranslations.locale, typedLocale)
      )
    )
    .limit(1);

  // Get default translations
  const defaults = getDefaultTranslations(typedLocale);
  const custom = (customTranslations?.uiStrings as Partial<UITranslations>) || {};

  const localeInfo = LOCALE_INFO[typedLocale];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link 
          href={`/shops/${slug}/admin/settings/languages`}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <ArrowRight className="w-4 h-4" />
          הגדרות שפות
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 flex items-center gap-2">
          <span className="text-lg">{localeInfo.flag}</span>
          {localeInfo.nativeName}
        </span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
          <span className="text-3xl">{localeInfo.flag}</span>
          עריכת תרגומים - {localeInfo.nativeName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          התאם את הטקסטים בחנות לשפה זו. שדות ריקים ישתמשו בתרגום ברירת המחדל.
        </p>
      </div>

      {/* Translation Editor */}
      <TranslationEditor
        storeId={store.id}
        locale={typedLocale}
        defaults={defaults}
        custom={custom}
      />
    </div>
  );
}

