import { getStoreBySlug, getCategoriesByStore, getProductForEdit, getProductsForUpsell } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/product-form';
import { getStoreAddons } from '@/app/shops/[slug]/admin/addons/actions';

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

  // Fetch product, categories, all products for upsell, and store addons in parallel for speed ⚡
  const [product, categories, allProducts, storeAddons] = await Promise.all([
    getProductForEdit(store.id, id),
    getCategoriesByStore(store.id),
    getProductsForUpsell(store.id),
    getStoreAddons(store.id),
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

  return (
    <ProductForm
      storeId={store.id}
      storeSlug={slug}
      customDomain={store.customDomain}
      categories={categories}
      allProducts={allProducts}
      storeAddons={formattedAddons}
      product={product}
      mode="edit"
    />
  );
}


