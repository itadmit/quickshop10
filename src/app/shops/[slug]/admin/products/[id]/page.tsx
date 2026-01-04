import { getStoreBySlug, getCategoriesByStore, getProductForEdit } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/product-form';

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

  // Fetch product and categories in parallel for speed ⚡
  const [product, categories] = await Promise.all([
    getProductForEdit(store.id, id),
    getCategoriesByStore(store.id),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductForm
      storeId={store.id}
      storeSlug={slug}
      customDomain={store.customDomain}
      categories={categories}
      product={product}
      mode="edit"
    />
  );
}


