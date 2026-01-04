import { getStoreBySlug, getCategoriesByStore } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/product-form';

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

  // Fetch categories (cached)
  const categories = await getCategoriesByStore(store.id);

  return (
    <ProductForm
      storeId={store.id}
      storeSlug={slug}
      customDomain={store.customDomain}
      categories={categories}
      mode="create"
    />
  );
}


