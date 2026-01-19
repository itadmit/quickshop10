'use server';

import { db } from '@/lib/db';
import { productBundles, bundleComponents, products, productVariants, productImages } from '@/lib/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Types
export interface BundleComponentInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
  isDefault?: boolean;
  isRequired?: boolean;
  priceOverride?: number | null;
  sortOrder?: number;
}

export interface BundleSettings {
  bundleType: 'fixed' | 'mix_match';
  pricingType: 'fixed' | 'calculated' | 'discount_percentage' | 'discount_fixed';
  discountValue?: number | null;
  minSelections?: number;
  maxSelections?: number | null;
  showComponentsInCart: boolean;
  showComponentsOnPage: boolean;
}

export interface BundleComponentWithProduct {
  id: string;
  bundleId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  isDefault: boolean;
  isRequired: boolean;
  priceOverride: string | null;
  sortOrder: number;
  product: {
    id: string;
    name: string;
    price: string | null;
    sku: string | null;
    inventory: number | null;
    primaryImage: string | null;
  };
  variant?: {
    id: string;
    title: string;
    price: string | null;
    sku: string | null;
    inventory: number | null;
  } | null;
}

// Get bundle settings and components for a product
export async function getBundleData(productId: string) {
  const bundle = await db.query.productBundles.findFirst({
    where: eq(productBundles.productId, productId),
  });

  if (!bundle) {
    return null;
  }

  // Get components with product info
  const componentsData = await db
    .select({
      component: bundleComponents,
      product: {
        id: products.id,
        name: products.name,
        price: products.price,
        sku: products.sku,
        inventory: products.inventory,
      },
      variant: {
        id: productVariants.id,
        title: productVariants.title,
        price: productVariants.price,
        sku: productVariants.sku,
        inventory: productVariants.inventory,
      },
    })
    .from(bundleComponents)
    .innerJoin(products, eq(bundleComponents.productId, products.id))
    .leftJoin(productVariants, eq(bundleComponents.variantId, productVariants.id))
    .where(eq(bundleComponents.bundleId, bundle.id))
    .orderBy(bundleComponents.sortOrder);

  // Get primary images for each component product
  const productIds = componentsData.map(c => c.product.id);
  const images = productIds.length > 0 
    ? await db
        .select({
          productId: productImages.productId,
          url: productImages.url,
        })
        .from(productImages)
        .where(and(
          inArray(productImages.productId, productIds),
          eq(productImages.isPrimary, true)
        ))
    : [];

  const imageMap = new Map(images.map(img => [img.productId, img.url]));

  const components: BundleComponentWithProduct[] = componentsData.map(c => ({
    id: c.component.id,
    bundleId: c.component.bundleId,
    productId: c.component.productId,
    variantId: c.component.variantId,
    quantity: c.component.quantity,
    isDefault: c.component.isDefault,
    isRequired: c.component.isRequired,
    priceOverride: c.component.priceOverride,
    sortOrder: c.component.sortOrder,
    product: {
      ...c.product,
      primaryImage: imageMap.get(c.product.id) || null,
    },
    variant: c.variant?.id ? c.variant : null,
  }));

  return {
    bundle,
    components,
  };
}

// Create or update bundle for a product
export async function saveBundleSettings(
  productId: string,
  storeSlug: string,
  settings: BundleSettings,
  components: BundleComponentInput[]
) {
  try {
    // Check if bundle already exists
    let bundle = await db.query.productBundles.findFirst({
      where: eq(productBundles.productId, productId),
    });

    if (bundle) {
      // Update existing bundle
      await db
        .update(productBundles)
        .set({
          bundleType: settings.bundleType,
          pricingType: settings.pricingType,
          discountValue: settings.discountValue?.toString() || null,
          minSelections: settings.minSelections,
          maxSelections: settings.maxSelections,
          showComponentsInCart: settings.showComponentsInCart,
          showComponentsOnPage: settings.showComponentsOnPage,
          updatedAt: new Date(),
        })
        .where(eq(productBundles.id, bundle.id));
    } else {
      // Create new bundle
      const [newBundle] = await db
        .insert(productBundles)
        .values({
          productId,
          bundleType: settings.bundleType,
          pricingType: settings.pricingType,
          discountValue: settings.discountValue?.toString() || null,
          minSelections: settings.minSelections,
          maxSelections: settings.maxSelections,
          showComponentsInCart: settings.showComponentsInCart,
          showComponentsOnPage: settings.showComponentsOnPage,
        })
        .returning();
      
      bundle = newBundle;
    }

    // Update is_bundle flag on product
    await db
      .update(products)
      .set({ isBundle: true, updatedAt: new Date() })
      .where(eq(products.id, productId));

    // Delete existing components and insert new ones
    await db
      .delete(bundleComponents)
      .where(eq(bundleComponents.bundleId, bundle.id));

    if (components.length > 0) {
      await db.insert(bundleComponents).values(
        components.map((comp, index) => ({
          bundleId: bundle!.id,
          productId: comp.productId,
          variantId: comp.variantId || null,
          quantity: comp.quantity,
          isDefault: comp.isDefault ?? true,
          isRequired: comp.isRequired ?? false,
          priceOverride: comp.priceOverride?.toString() || null,
          sortOrder: comp.sortOrder ?? index,
        }))
      );
    }

    revalidatePath(`/shops/${storeSlug}/admin/products`);
    revalidatePath(`/shops/${storeSlug}/product`);
    
    return { success: true, bundleId: bundle.id };
  } catch (error) {
    console.error('Error saving bundle:', error);
    return { success: false, error: 'Failed to save bundle settings' };
  }
}

// Remove bundle from a product
export async function removeBundleFromProduct(productId: string, storeSlug: string) {
  try {
    // Find and delete the bundle (cascade will delete components)
    const bundle = await db.query.productBundles.findFirst({
      where: eq(productBundles.productId, productId),
    });

    if (bundle) {
      await db.delete(productBundles).where(eq(productBundles.id, bundle.id));
    }

    // Update product
    await db
      .update(products)
      .set({ isBundle: false, updatedAt: new Date() })
      .where(eq(products.id, productId));

    revalidatePath(`/shops/${storeSlug}/admin/products`);
    
    return { success: true };
  } catch (error) {
    console.error('Error removing bundle:', error);
    return { success: false, error: 'Failed to remove bundle' };
  }
}

// Get products available to be bundle components (exclude self and other bundles)
export async function getAvailableProductsForBundle(storeId: string, excludeProductId: string) {
  const availableProducts = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      sku: products.sku,
      inventory: products.inventory,
      hasVariants: products.hasVariants,
    })
    .from(products)
    .where(and(
      eq(products.storeId, storeId),
      eq(products.isActive, true),
      eq(products.isBundle, false),
      sql`${products.id} != ${excludeProductId}`
    ))
    .orderBy(products.name);

  // Get primary images
  const productIds = availableProducts.map(p => p.id);
  const images = productIds.length > 0
    ? await db
        .select({
          productId: productImages.productId,
          url: productImages.url,
        })
        .from(productImages)
        .where(and(
          inArray(productImages.productId, productIds),
          eq(productImages.isPrimary, true)
        ))
    : [];

  const imageMap = new Map(images.map(img => [img.productId, img.url]));

  // Get variants for products that have them
  const productsWithVariants = availableProducts.filter(p => p.hasVariants);
  const variantsData = productsWithVariants.length > 0
    ? await db
        .select()
        .from(productVariants)
        .where(inArray(productVariants.productId, productsWithVariants.map(p => p.id)))
    : [];

  const variantsMap = new Map<string, typeof variantsData>();
  variantsData.forEach(v => {
    const existing = variantsMap.get(v.productId) || [];
    existing.push(v);
    variantsMap.set(v.productId, existing);
  });

  return availableProducts.map(p => ({
    ...p,
    primaryImage: imageMap.get(p.id) || null,
    variants: variantsMap.get(p.id) || [],
  }));
}

// Calculate bundle availability based on component inventory
export async function checkBundleAvailability(bundleProductId: string, requestedQty: number = 1) {
  const bundleData = await getBundleData(bundleProductId);
  
  if (!bundleData) {
    return { available: true, maxQty: null, limitingProduct: null };
  }

  let maxBundleQty = Infinity;
  let limitingProduct: string | null = null;

  for (const component of bundleData.components) {
    const requiredQty = component.quantity * requestedQty;
    const available = component.variant 
      ? (component.variant.inventory ?? 0)
      : (component.product.inventory ?? 0);

    const maxForComponent = Math.floor(available / component.quantity);
    
    if (maxForComponent < maxBundleQty) {
      maxBundleQty = maxForComponent;
      limitingProduct = component.variant?.title 
        ? `${component.product.name} - ${component.variant.title}`
        : component.product.name;
    }
  }

  return {
    available: maxBundleQty >= requestedQty,
    maxQty: maxBundleQty === Infinity ? null : maxBundleQty,
    limitingProduct: maxBundleQty < requestedQty ? limitingProduct : null,
  };
}

// Deduct inventory for bundle components after purchase
export async function deductBundleInventory(bundleProductId: string, purchasedQty: number) {
  const bundleData = await getBundleData(bundleProductId);
  
  if (!bundleData) {
    return { success: false, error: 'Bundle not found' };
  }

  try {
    for (const component of bundleData.components) {
      const deductQty = component.quantity * purchasedQty;
      
      if (component.variantId) {
        // Deduct from variant
        await db
          .update(productVariants)
          .set({
            inventory: sql`GREATEST(0, COALESCE(${productVariants.inventory}, 0) - ${deductQty})`,
          })
          .where(eq(productVariants.id, component.variantId));
      } else {
        // Deduct from product
        await db
          .update(products)
          .set({
            inventory: sql`GREATEST(0, COALESCE(${products.inventory}, 0) - ${deductQty})`,
          })
          .where(eq(products.id, component.productId));
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error deducting bundle inventory:', error);
    return { success: false, error: 'Failed to deduct inventory' };
  }
}

// Restore inventory for bundle components (for returns/refunds)
export async function restoreBundleInventory(bundleProductId: string, returnedQty: number) {
  const bundleData = await getBundleData(bundleProductId);
  
  if (!bundleData) {
    return { success: false, error: 'Bundle not found' };
  }

  try {
    for (const component of bundleData.components) {
      const restoreQty = component.quantity * returnedQty;
      
      if (component.variantId) {
        await db
          .update(productVariants)
          .set({
            inventory: sql`COALESCE(${productVariants.inventory}, 0) + ${restoreQty}`,
          })
          .where(eq(productVariants.id, component.variantId));
      } else {
        await db
          .update(products)
          .set({
            inventory: sql`COALESCE(${products.inventory}, 0) + ${restoreQty}`,
          })
          .where(eq(products.id, component.productId));
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error restoring bundle inventory:', error);
    return { success: false, error: 'Failed to restore inventory' };
  }
}

// Calculate bundle total price based on components
export async function calculateBundlePrice(bundleProductId: string): Promise<{
  componentsTotal: number;
  bundlePrice: number | null;
  savings: number;
  savingsPercentage: number;
}> {
  const bundleData = await getBundleData(bundleProductId);
  
  if (!bundleData) {
    return { componentsTotal: 0, bundlePrice: null, savings: 0, savingsPercentage: 0 };
  }

  // Calculate total of all components at their regular prices
  let componentsTotal = 0;
  for (const component of bundleData.components) {
    const price = component.priceOverride 
      ? parseFloat(component.priceOverride)
      : component.variant?.price 
        ? parseFloat(component.variant.price)
        : component.product.price 
          ? parseFloat(component.product.price)
          : 0;
    componentsTotal += price * component.quantity;
  }

  // Get the bundle product's price
  const bundleProduct = await db.query.products.findFirst({
    where: eq(products.id, bundleProductId),
  });

  const bundlePrice = bundleProduct?.price ? parseFloat(bundleProduct.price) : null;
  const savings = bundlePrice ? componentsTotal - bundlePrice : 0;
  const savingsPercentage = bundlePrice && componentsTotal > 0 
    ? Math.round((savings / componentsTotal) * 100) 
    : 0;

  return {
    componentsTotal,
    bundlePrice,
    savings: Math.max(0, savings),
    savingsPercentage: Math.max(0, savingsPercentage),
  };
}

// Get bundle components for cart display (lightweight version)
export async function getBundleComponentsForCart(productId: string): Promise<{
  showInCart: boolean;
  components: { name: string; variantTitle?: string; quantity: number }[];
} | null> {
  // Get bundle settings
  const bundle = await db.query.productBundles.findFirst({
    where: eq(productBundles.productId, productId),
  });

  if (!bundle || !bundle.showComponentsInCart) {
    return null;
  }

  // Get components with product names
  const componentsData = await db
    .select({
      quantity: bundleComponents.quantity,
      productName: products.name,
      variantTitle: productVariants.title,
    })
    .from(bundleComponents)
    .innerJoin(products, eq(bundleComponents.productId, products.id))
    .leftJoin(productVariants, eq(bundleComponents.variantId, productVariants.id))
    .where(eq(bundleComponents.bundleId, bundle.id))
    .orderBy(bundleComponents.sortOrder);

  return {
    showInCart: bundle.showComponentsInCart,
    components: componentsData.map(c => ({
      name: c.productName,
      variantTitle: c.variantTitle || undefined,
      quantity: c.quantity,
    })),
  };
}

// Check if a product is a bundle
export async function isProductBundle(productId: string): Promise<boolean> {
  const [product] = await db
    .select({ isBundle: products.isBundle })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  
  return product?.isBundle ?? false;
}

