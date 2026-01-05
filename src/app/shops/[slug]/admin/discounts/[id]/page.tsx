import { db } from '@/lib/db';
import { discounts, categories, products, influencers } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { getStoreBySlug } from '@/lib/db/queries';
import { notFound, redirect } from 'next/navigation';
import { CouponFormPage } from '../coupon-form-page';

export const dynamic = 'force-dynamic';

interface EditCouponPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function EditCouponPage({ params }: EditCouponPageProps) {
  const { slug, id } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Fetch the coupon
  const [coupon] = await db
    .select()
    .from(discounts)
    .where(and(eq(discounts.storeId, store.id), eq(discounts.id, id)))
    .limit(1);

  if (!coupon) {
    redirect(`/shops/${slug}/admin/discounts`);
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
    .select({ id: influencers.id, name: influencers.name, email: influencers.email, discountId: influencers.discountId })
    .from(influencers)
    .where(eq(influencers.storeId, store.id))
    .orderBy(influencers.name);

  // Find if this coupon is linked to an influencer
  const linkedInfluencer = storeInfluencers.find(inf => inf.discountId === coupon.id);

  // Fetch other coupons for trigger selection (only non-gift_product coupons, excluding current)
  const otherCoupons = await db
    .select({ id: discounts.id, code: discounts.code, title: discounts.title })
    .from(discounts)
    .where(and(
      eq(discounts.storeId, store.id),
      eq(discounts.isActive, true),
      ne(discounts.type, 'gift_product'),
      ne(discounts.id, id) // Exclude current coupon
    ))
    .orderBy(discounts.code);

  // Prepare coupon data for the form
  const couponData = {
    id: coupon.id,
    code: coupon.code,
    title: coupon.title,
    type: coupon.type,
    value: coupon.value,
    minimumAmount: coupon.minimumAmount,
    usageLimit: coupon.usageLimit,
    oncePerCustomer: coupon.oncePerCustomer,
    firstOrderOnly: coupon.firstOrderOnly,
    stackable: coupon.stackable,
    startsAt: coupon.startsAt,
    endsAt: coupon.endsAt,
    isActive: coupon.isActive,
    influencerId: linkedInfluencer?.id || null,
    appliesTo: coupon.appliesTo || 'all' as const,
    categoryIds: (coupon.categoryIds as string[]) || [],
    productIds: (coupon.productIds as string[]) || [],
    excludeCategoryIds: (coupon.excludeCategoryIds as string[]) || [],
    excludeProductIds: (coupon.excludeProductIds as string[]) || [],
    // Advanced discount fields
    buyQuantity: coupon.buyQuantity,
    payAmount: coupon.payAmount,
    getQuantity: coupon.getQuantity,
    getDiscountPercent: coupon.getDiscountPercent ?? 100,
    giftProductIds: (coupon.giftProductIds as string[]) || [],
    giftSameProduct: coupon.giftSameProduct ?? true,
    quantityTiers: (coupon.quantityTiers as { minQuantity: number; discountPercent: number }[]) || [],
    spendAmount: coupon.spendAmount,
    // Gift product specific
    minimumQuantity: coupon.minimumQuantity,
    triggerCouponCodes: (coupon.triggerCouponCodes as string[]) || [],
  };

  return (
    <CouponFormPage
      storeSlug={slug}
      storeId={store.id}
      mode="edit"
      coupon={couponData}
      categories={storeCategories}
      products={storeProducts}
      influencers={storeInfluencers}
      otherCoupons={otherCoupons}
    />
  );
}

