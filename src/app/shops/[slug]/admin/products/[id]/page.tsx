import { getStoreBySlug, getCategoriesByStore, getProductForEdit, getProductsForUpsell } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/product-form';
import { getStoreAddons, getCategoryAddons } from '@/app/shops/[slug]/admin/addons/actions';
import { getStoreMetafields } from '@/app/shops/[slug]/admin/metafields/actions';
import { getManualBadgesForStore, getProductBadges } from '@/app/shops/[slug]/admin/badges/actions';

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

  // Fetch product, categories, all products for upsell, addons, metafields and badges in parallel for speed ⚡
  const [product, categories, allProducts, storeAddons, storeMetafields, storeBadges, productBadgeIds] = await Promise.all([
    getProductForEdit(store.id, id),
    getCategoriesByStore(store.id),
    getProductsForUpsell(store.id),
    getStoreAddons(store.id),
    getStoreMetafields(store.id),
    getManualBadgesForStore(store.id),
    getProductBadges(id),
  ]);

  if (!product) {
    notFound();
  }

  // Fetch addons from product's categories
  const categoryIds = product.categoryIds || (product.categoryId ? [product.categoryId] : []);
  
  // Get addons for all categories this product belongs to
  const categoryAddonsPromises = categoryIds.map(async (catId) => {
    const category = categories.find(c => c.id === catId);
    const addons = await getCategoryAddons(catId);
    return addons.map(addon => ({
      ...addon,
      categoryName: category?.name || 'קטגוריה',
    }));
  });
  
  const categoryAddonsArrays = await Promise.all(categoryAddonsPromises);
  
  // Flatten and deduplicate (same addon might be in multiple categories)
  const seenAddonIds = new Set<string>();
  const categoryAddons = categoryAddonsArrays.flat().filter(addon => {
    if (seenAddonIds.has(addon.id)) return false;
    seenAddonIds.add(addon.id);
    return addon.isActive; // Only active addons
  }).map(addon => ({
    id: addon.id,
    name: addon.name,
    fieldType: addon.fieldType,
    isRequired: addon.isRequiredOverride ?? addon.isRequired,
    categoryName: addon.categoryName,
  }));

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
    badgeIds: productBadgeIds,
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
      categoryAddons={categoryAddons}
      storeMetafields={storeMetafields}
      storeBadges={storeBadges}
      product={productForForm}
      mode="edit"
    />
  );
}


