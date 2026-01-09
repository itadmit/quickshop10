import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { getAddon } from '../actions';
import { AddonForm } from '../addon-form';
import Link from 'next/link';

interface EditAddonPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function EditAddonPage({ params }: EditAddonPageProps) {
  const { slug, id } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const addon = await getAddon(id, store.id);
  
  if (!addon) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/shops/${slug}/admin/addons`}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12H19M5 12L12 5M5 12L12 19" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">עריכת תוספת</h1>
          <p className="mt-1 text-sm text-gray-500">
            {addon.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <AddonForm 
        storeId={store.id} 
        storeSlug={slug} 
        addon={{
          ...addon,
          priceAdjustment: Number(addon.priceAdjustment) || 0,
          options: (addon.options as Array<{ label: string; value: string; priceAdjustment: number }>) || [],
        }}
      />
    </div>
  );
}

