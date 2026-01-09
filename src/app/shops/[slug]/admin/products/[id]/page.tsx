import { getStoreBySlug, getCategoriesByStore, getProductForEdit, getProductsForUpsell } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/product-form';
import { getStoreAddons } from '@/app/shops/[slug]/admin/addons/actions';
import { getStoreMetafields } from '@/app/shops/[slug]/admin/metafields/actions';

interface EditProductPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { slug, id } = await params;
  
  // Fetch store (cached)
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Fetch product, categories, all products for upsell, addons and metafields in parallel for speed ⚡
  const [product, categories, allProducts, storeAddons, storeMetafields] = await Promise.all([
    getProductForEdit(store.id, id),
    getCategoriesByStore(store.id),
    getProductsForUpsell(store.id),
    getStoreAddons(store.id),
    getStoreMetafields(store.id),
  ]);

  if (!product) {
    notFound();
  }

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

  // Cast metadata and options values metadata to correct types
  const productForForm = {
    ...product,
    metadata: product.metadata as Record<string, unknown> | undefined,
    options: product.options?.map(opt => ({
      ...opt,
      values: opt.values.map(val => ({
        ...val,
        metadata: val.metadata as { color?: string; pattern?: string; imageUrl?: string; images?: string[] } | undefined,
      })),
    })),
  };

  return (
    <ProductForm
      storeId={store.id}
      storeSlug={slug}
      customDomain={store.customDomain}
      categories={categories}
      allProducts={allProducts}
      storeAddons={formattedAddons}
      storeMetafields={storeMetafields}
      product={productForForm}
      mode="edit"
    />
  );
}


