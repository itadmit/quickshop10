import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { LanguagesForm } from './languages-form';
import { SettingsWrapper } from '@/components/admin/settings-wrapper';
import type { SupportedLocale } from '@/lib/translations/types';

export const metadata = {
  title: 'הגדרות שפות',
  description: 'ניהול שפות והגדרות תרגום לחנות',
};

interface LanguagesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function LanguagesPage({ params }: LanguagesPageProps) {
  const { slug } = await params;

  // Get store data
  const [store] = await db
    .select({
      id: stores.id,
      slug: stores.slug,
      defaultLocale: stores.defaultLocale,
      supportedLocales: stores.supportedLocales,
    })
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);

  if (!store) {
    notFound();
  }

  return (
    <SettingsWrapper storeSlug={slug} activeTab="languages">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">הגדרות שפות</h2>
          <p className="mt-1 text-sm text-gray-500">
            הוסף שפות לחנות ועדכן תרגומים. לקוחות יוכלו לבחור את השפה המועדפת עליהם.
          </p>
        </div>

        {/* Languages Form */}
        <LanguagesForm
          storeId={store.id}
          storeSlug={store.slug}
          defaultLocale={(store.defaultLocale as SupportedLocale) || 'he'}
          supportedLocales={(store.supportedLocales as SupportedLocale[]) || ['he']}
        />
      </div>
    </SettingsWrapper>
  );
}

