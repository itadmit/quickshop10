import { db } from '@/lib/db';
import { categories, products, influencers, discounts } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { CouponFormPage } from '../coupon-form-page';

export const dynamic = 'force-dynamic';

interface NewCouponPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewCouponPage({ params }: NewCouponPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Fetch categories
  const storeCategories = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.storeId, store.id))
    .orderBy(categories.name);

  // Fetch products
  const storeProducts = await db
    .select({ id: products.id, name: products.name, categoryId: products.categoryId })
    .from(products)
    .where(eq(products.storeId, store.id))
    .orderBy(products.name);

  // Fetch influencers
  const storeInfluencers = await db
    .select({ id: influencers.id, name: influencers.name, email: influencers.email })
    .from(influencers)
    .where(eq(influencers.storeId, store.id))
    .orderBy(influencers.name);

  // Fetch other coupons for trigger selection and combo coupons
  const otherCoupons = await db
    .select({ id: discounts.id, code: discounts.code, title: discounts.title, type: discounts.type })
    .from(discounts)
    .where(and(
      eq(discounts.storeId, store.id),
      eq(discounts.isActive, true)
    ))
    .orderBy(discounts.code);

  return (
    <CouponFormPage
      storeSlug={slug}
      storeId={store.id}
      mode="create"
      categories={storeCategories}
      products={storeProducts}
      influencers={storeInfluencers}
      otherCoupons={otherCoupons}
    />
  );
}


