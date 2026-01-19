import { getStoreBySlug, getCategoriesByStore } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/product-form';
import { getStoreAddons } from '@/app/shops/[slug]/admin/addons/actions';
import { getStoreMetafields } from '@/app/shops/[slug]/admin/metafields/actions';
import { getManualBadgesForStore } from '@/app/shops/[slug]/admin/settings/badges/actions';

interface NewProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewProductPage({ params }: NewProductPageProps) {
  const { slug } = await params;
  
  // Fetch store (cached)
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Fetch categories, addons, metafields and badges in parallel for speed ⚡
  const [categories, storeAddons, storeMetafields, storeBadges] = await Promise.all([
    getCategoriesByStore(store.id),
    getStoreAddons(store.id),
    getStoreMetafields(store.id),
    getManualBadgesForStore(store.id),
  ]);

  // Format addons for the form
  const formattedAddons = storeAddons
    .filter(a => a.isActive)
    .map(a => ({
      id: a.id,
      name: a.name,
      fieldType: a.fieldType,
      priceAdjustment: Number(a.priceAdjustment) || 0,
      options: (a.options as Array<{ label: string; value: string; priceAdjustment: number }>) || [],
      isRequired: a.isRequired,
    }));

  return (
    <ProductForm
      storeId={store.id}
      storeSlug={slug}
      customDomain={store.customDomain}
      categories={categories}
      storeAddons={formattedAddons}
      storeMetafields={storeMetafields}
      storeBadges={storeBadges}
      mode="create"
    />
  );
}


