import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { DomainForm } from './domain-form';

interface DomainSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DomainSettingsPage({ params }: DomainSettingsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">דומיין מותאם</h1>
        <p className="text-gray-500 mt-1">חבר דומיין משלך לחנות</p>
      </div>

      <DomainForm 
        storeId={store.id}
        storeSlug={slug}
        currentDomain={store.customDomain}
      />
    </div>
  );
}

