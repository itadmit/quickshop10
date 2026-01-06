'use server';

import { db } from '@/lib/db';
import { products, productImages, productOptions, productOptionValues, productVariants, productCategories } from '@/lib/db/schema';
import { eq, and, like, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';

// ============ HELPERS ============

// Generate unique slug - adds -1, -2 etc. if slug already exists
async function generateUniqueSlug(storeId: string, baseSlug: string, excludeProductId?: string): Promise<string> {
  // Sanitize: replace spaces with dashes
  let slug = baseSlug.trim().replace(/\s+/g, '-').replace(/-+/g, '-');
  
  // Check if slug exists
  const existing = await db
    .select({ slug: products.slug })
    .from(products)
    .where(
      excludeProductId 
        ? and(
            eq(products.storeId, storeId),
            like(products.slug, `${slug}%`),
            sql`${products.id} != ${excludeProductId}`
          )
        : and(
            eq(products.storeId, storeId),
            like(products.slug, `${slug}%`)
          )
    );

  if (existing.length === 0) {
    return slug;
  }

  // Check exact match and numbered versions
  const existingSlugs = new Set(existing.map(e => e.slug));
  
  if (!existingSlugs.has(slug)) {
    return slug;
  }

  // Find next available number
  let counter = 1;
  while (existingSlugs.has(`${slug}-${counter}`)) {
    counter++;
  }
  
  return `${slug}-${counter}`;
}

// ============ TYPES ============

export interface VariantFormData {
  id?: string;
  title: string;
  sku?: string;
  price: string;
  comparePrice?: string;
  cost?: string;
  inventory: number;
  option1?: string;
  option2?: string;
  option3?: string;
}

export interface OptionFormData {
  name: string;
  values: string[];
}

export interface ProductFormData {
  // Basic Info
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  
  // Pricing (for simple products)
  price?: string;
  comparePrice?: string;
  cost?: string;
  
  // Inventory (for simple products)
  sku?: string;
  barcode?: string;
  weight?: string;
  trackInventory: boolean;
  inventory?: number;
  allowBackorder: boolean;
  
  // Variants
  hasVariants: boolean;
  options?: OptionFormData[];
  variants?: VariantFormData[];
  
  // Organization
  categoryIds?: string[];
  isActive: boolean;
  isFeatured: boolean;
  
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  
  // Images (URLs for now)
  images?: { url: string; alt?: string; isPrimary: boolean }[];
}

// ============ CREATE PRODUCT ============

export async function createProduct(storeId: string, storeSlug: string, data: ProductFormData) {
  try {
    // Get current user for createdBy
    const session = await auth();
    const userId = session?.user?.id || null;

    // Generate unique slug
    const uniqueSlug = await generateUniqueSlug(storeId, data.slug);

    // Create the product - also set categoryId for backward compatibility
    const primaryCategoryId = data.categoryIds && data.categoryIds.length > 0 ? data.categoryIds[0] : null;
    
    const [product] = await db.insert(products).values({
      storeId,
      name: data.name,
      slug: uniqueSlug,
      shortDescription: data.shortDescription || null,
      description: data.description || null,
      price: data.hasVariants ? null : (data.price || null),
      comparePrice: data.hasVariants ? null : (data.comparePrice || null),
      cost: data.hasVariants ? null : (data.cost || null),
      sku: data.hasVariants ? null : (data.sku || null),
      barcode: data.hasVariants ? null : (data.barcode || null),
      weight: data.weight || null,
      trackInventory: data.hasVariants ? true : data.trackInventory,
      inventory: data.hasVariants ? null : (data.trackInventory ? (data.inventory ?? 0) : null),
      allowBackorder: data.allowBackorder,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      hasVariants: data.hasVariants,
      categoryId: primaryCategoryId, // Set legacy categoryId for backward compatibility
      createdBy: userId,
      updatedBy: userId,
    }).returning();

    // Add categories if provided
    if (data.categoryIds && data.categoryIds.length > 0) {
      await db.insert(productCategories).values(
        data.categoryIds.map(categoryId => ({
          productId: product.id,
          categoryId,
        }))
      );
    }

    // Add images if provided
    if (data.images && data.images.length > 0) {
      await db.insert(productImages).values(
        data.images.map((img, index) => ({
          productId: product.id,
          url: img.url,
          alt: img.alt || data.name,
          isPrimary: img.isPrimary || index === 0,
          sortOrder: index,
        }))
      );
    }

    // Add options and variants if hasVariants
    if (data.hasVariants && data.options && data.options.length > 0) {
      // Create options
      for (let i = 0; i < data.options.length; i++) {
        const opt = data.options[i];
        const [option] = await db.insert(productOptions).values({
          productId: product.id,
          name: opt.name,
          sortOrder: i,
        }).returning();

        // Create option values
        for (let j = 0; j < opt.values.length; j++) {
          await db.insert(productOptionValues).values({
            optionId: option.id,
            value: opt.values[j],
            sortOrder: j,
          });
        }
      }

      // Create variants
      if (data.variants && data.variants.length > 0) {
        await db.insert(productVariants).values(
          data.variants.map((v, index) => ({
            productId: product.id,
            title: v.title,
            sku: v.sku || null,
            price: v.price,
            comparePrice: v.comparePrice || null,
            cost: v.cost || null,
            inventory: v.inventory,
            option1: v.option1 || null,
            option2: v.option2 || null,
            option3: v.option3 || null,
            sortOrder: index,
          }))
        );
      }
    }

    revalidatePath(`/shops/${storeSlug}/admin/products`);
    revalidatePath(`/shops/${storeSlug}`);
    
    return { success: true, productId: product.id };
  } catch (error) {
    console.error('Error creating product:', error);
    return { success: false, error: 'שגיאה ביצירת המוצר' };
  }
}

// ============ UPDATE PRODUCT ============

export async function updateProduct(
  productId: string, 
  storeId: string, 
  storeSlug: string, 
  data: ProductFormData
) {
  try {
    // Get current user for updatedBy
    const session = await auth();
    const userId = session?.user?.id || null;

    // Generate unique slug (excluding current product)
    const uniqueSlug = await generateUniqueSlug(storeId, data.slug, productId);

    // Set primary categoryId for backward compatibility
    const primaryCategoryId = data.categoryIds && data.categoryIds.length > 0 ? data.categoryIds[0] : null;

    // Update the product
    await db.update(products)
      .set({
        name: data.name,
        slug: uniqueSlug,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        price: data.hasVariants ? null : (data.price || null),
        comparePrice: data.hasVariants ? null : (data.comparePrice || null),
        cost: data.hasVariants ? null : (data.cost || null),
        sku: data.hasVariants ? null : (data.sku || null),
        barcode: data.hasVariants ? null : (data.barcode || null),
        weight: data.weight || null,
        trackInventory: data.hasVariants ? true : data.trackInventory,
        inventory: data.hasVariants ? null : (data.trackInventory ? (data.inventory ?? 0) : null),
        allowBackorder: data.allowBackorder,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        hasVariants: data.hasVariants,
        categoryId: primaryCategoryId, // Set legacy categoryId for backward compatibility
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, productId), eq(products.storeId, storeId)));

    // Update categories - delete existing and re-add
    await db.delete(productCategories).where(eq(productCategories.productId, productId));
    
    if (data.categoryIds && data.categoryIds.length > 0) {
      await db.insert(productCategories).values(
        data.categoryIds.map(categoryId => ({
          productId,
          categoryId,
        }))
      );
    }

    // Update images - delete existing and re-add
    if (data.images !== undefined) {
      await db.delete(productImages).where(eq(productImages.productId, productId));
      
      if (data.images.length > 0) {
        await db.insert(productImages).values(
          data.images.map((img, index) => ({
            productId,
            url: img.url,
            alt: img.alt || data.name,
            isPrimary: img.isPrimary || index === 0,
            sortOrder: index,
          }))
        );
      }
    }

    // Update options and variants
    // First, delete existing options (cascades to option values) and variants
    await db.delete(productOptions).where(eq(productOptions.productId, productId));
    await db.delete(productVariants).where(eq(productVariants.productId, productId));

    // Then re-create if hasVariants
    if (data.hasVariants && data.options && data.options.length > 0) {
      // Create options
      for (let i = 0; i < data.options.length; i++) {
        const opt = data.options[i];
        const [option] = await db.insert(productOptions).values({
          productId,
          name: opt.name,
          sortOrder: i,
        }).returning();

        // Create option values
        for (let j = 0; j < opt.values.length; j++) {
          await db.insert(productOptionValues).values({
            optionId: option.id,
            value: opt.values[j],
            sortOrder: j,
          });
        }
      }

      // Create variants
      if (data.variants && data.variants.length > 0) {
        await db.insert(productVariants).values(
          data.variants.map((v, index) => ({
            productId,
            title: v.title,
            sku: v.sku || null,
            price: v.price,
            comparePrice: v.comparePrice || null,
            cost: v.cost || null,
            inventory: v.inventory,
            option1: v.option1 || null,
            option2: v.option2 || null,
            option3: v.option3 || null,
            sortOrder: index,
          }))
        );
      }
    }

    revalidatePath(`/shops/${storeSlug}/admin/products`);
    revalidatePath(`/shops/${storeSlug}/admin/products/${productId}`);
    revalidatePath(`/shops/${storeSlug}`);
    revalidatePath(`/shops/${storeSlug}/products/${data.slug}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: 'שגיאה בעדכון המוצר' };
  }
}

// ============ DELETE PRODUCT ============

export async function deleteProduct(productId: string, storeId: string, storeSlug: string) {
  try {
    await db.delete(products)
      .where(and(eq(products.id, productId), eq(products.storeId, storeId)));

    revalidatePath(`/shops/${storeSlug}/admin/products`);
    revalidatePath(`/shops/${storeSlug}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: 'שגיאה במחיקת המוצר' };
  }
}

// ============ TOGGLE PRODUCT STATUS ============

export async function toggleProductStatus(
  productId: string, 
  storeId: string, 
  storeSlug: string, 
  isActive: boolean
) {
  try {
    await db.update(products)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(products.id, productId), eq(products.storeId, storeId)));

    revalidatePath(`/shops/${storeSlug}/admin/products`);
    revalidatePath(`/shops/${storeSlug}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error toggling product status:', error);
    return { success: false, error: 'שגיאה בעדכון סטטוס המוצר' };
  }
}

// ============ DUPLICATE PRODUCT ============

export async function duplicateProduct(productId: string, storeId: string, storeSlug: string) {
  try {
    // Get the original product
    const [original] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.storeId, storeId)))
      .limit(1);

    if (!original) {
      return { success: false, error: 'המוצר לא נמצא' };
    }

    // Get original categories (NOT images - duplicate without images)
    const originalCategories = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.productId, productId));

    // Create duplicate with new slug
    const uniqueSlug = await generateUniqueSlug(storeId, `${original.slug}-copy`);
    
    const [newProduct] = await db.insert(products).values({
      storeId,
      name: `${original.name} (העתק)`,
      slug: uniqueSlug,
      shortDescription: original.shortDescription,
      description: original.description,
      price: original.price,
      comparePrice: original.comparePrice,
      cost: original.cost,
      sku: original.sku ? `${original.sku}-COPY` : null,
      barcode: null, // Barcode should be unique
      weight: original.weight,
      trackInventory: original.trackInventory,
      inventory: original.inventory,
      allowBackorder: original.allowBackorder,
      isActive: false, // Start as draft
      isFeatured: false,
      seoTitle: original.seoTitle,
      seoDescription: original.seoDescription,
      hasVariants: false, // Don't copy variants
    }).returning();

    // Copy categories only (NOT images)
    if (originalCategories.length > 0) {
      await db.insert(productCategories).values(
        originalCategories.map(pc => ({
          productId: newProduct.id,
          categoryId: pc.categoryId,
        }))
      );
    }

    revalidatePath(`/shops/${storeSlug}/admin/products`);
    
    return { success: true, productId: newProduct.id };
  } catch (error) {
    console.error('Error duplicating product:', error);
    return { success: false, error: 'שגיאה בשכפול המוצר' };
  }
}

