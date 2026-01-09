'use server';

import { db } from '@/lib/db';
import { products, productImages, productOptions, productOptionValues, productVariants, productCategories, productAddonAssignments } from '@/lib/db/schema';
import { eq, and, like, sql, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import crypto from 'crypto';

// Cloudinary API credentials
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

// Extract public_id from Cloudinary URL
function extractPublicId(url: string | null): string | null {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  // Match: /upload/v{version}/{public_id}.{format}
  // or: /upload/{transformations}/{public_id}.{format}
  const match = url.match(/\/upload\/(?:v\d+\/)?(?:[^/]+\/)*(.+?)(?:\.[a-z]+)?$/i);
  
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
}

// Delete image from Cloudinary
async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn('Cloudinary credentials not configured');
    return false;
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const formData = new URLSearchParams();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const result = await response.json();
    return result.result === 'ok' || result.result === 'not found';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
}

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
  barcode?: string;
  price: string;
  comparePrice?: string;
  cost?: string;
  weight?: string;
  inventory: number;
  allowBackorder?: boolean;
  option1?: string;
  option2?: string;
  option3?: string;
}

export interface OptionValueFormData {
  value: string;
  metadata?: {
    color?: string;      // for color type
    pattern?: string;    // for pattern type
    imageUrl?: string;   // for image type
    images?: string[];   // gallery images per value
  };
}

export interface OptionFormData {
  name: string;
  displayType: 'button' | 'color' | 'pattern' | 'image';
  values: OptionValueFormData[];
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
  
  // Upsell Products
  upsellProductIds?: string[];
  
  // Product Addons
  addonIds?: string[];
  
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  
  // Custom Fields (metafields)
  metadata?: Record<string, unknown>;
  
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
      upsellProductIds: data.upsellProductIds || [],
      metadata: data.metadata || {},
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
          displayType: opt.displayType || 'button',
          sortOrder: i,
        }).returning();

        // Create option values with metadata
        for (let j = 0; j < opt.values.length; j++) {
          const val = opt.values[j];
          await db.insert(productOptionValues).values({
            optionId: option.id,
            value: typeof val === 'string' ? val : val.value,
            metadata: typeof val === 'string' ? {} : (val.metadata || {}),
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
            barcode: v.barcode || null,
            price: v.price && v.price !== '' ? v.price : '0',
            comparePrice: v.comparePrice && v.comparePrice !== '' ? v.comparePrice : null,
            cost: v.cost && v.cost !== '' ? v.cost : null,
            weight: v.weight && v.weight !== '' ? v.weight : null,
            inventory: v.inventory ?? 0,
            allowBackorder: v.allowBackorder || false,
            option1: v.option1 || null,
            option2: v.option2 || null,
            option3: v.option3 || null,
            sortOrder: index,
          }))
        );
      }
    }

    // Add addon assignments if provided
    if (data.addonIds && data.addonIds.length > 0) {
      await db.insert(productAddonAssignments).values(
        data.addonIds.map((addonId, index) => ({
          productId: product.id,
          addonId,
          sortOrder: index,
        }))
      );
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
        upsellProductIds: data.upsellProductIds || [],
        metadata: data.metadata || {},
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
          displayType: opt.displayType || 'button',
          sortOrder: i,
        }).returning();

        // Create option values with metadata
        for (let j = 0; j < opt.values.length; j++) {
          const val = opt.values[j];
          await db.insert(productOptionValues).values({
            optionId: option.id,
            value: typeof val === 'string' ? val : val.value,
            metadata: typeof val === 'string' ? {} : (val.metadata || {}),
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
            barcode: v.barcode || null,
            price: v.price && v.price !== '' ? v.price : '0',
            comparePrice: v.comparePrice && v.comparePrice !== '' ? v.comparePrice : null,
            cost: v.cost && v.cost !== '' ? v.cost : null,
            weight: v.weight && v.weight !== '' ? v.weight : null,
            inventory: v.inventory ?? 0,
            allowBackorder: v.allowBackorder || false,
            option1: v.option1 || null,
            option2: v.option2 || null,
            option3: v.option3 || null,
            sortOrder: index,
          }))
        );
      }
    }

    // Update addon assignments - delete existing and re-add
    await db.delete(productAddonAssignments).where(eq(productAddonAssignments.productId, productId));
    
    if (data.addonIds && data.addonIds.length > 0) {
      await db.insert(productAddonAssignments).values(
        data.addonIds.map((addonId, index) => ({
          productId,
          addonId,
          sortOrder: index,
        }))
      );
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
    // Collect Cloudinary public IDs to delete
    const publicIdsToDelete: string[] = [];

    // Get product images
    const images = await db.select({ url: productImages.url })
      .from(productImages)
      .where(eq(productImages.productId, productId));
    
    for (const img of images) {
      const publicId = extractPublicId(img.url);
      if (publicId) publicIdsToDelete.push(publicId);
    }

    // Get variant images
    const variants = await db.select({ imageUrl: productVariants.imageUrl })
      .from(productVariants)
      .where(eq(productVariants.productId, productId));
    
    for (const variant of variants) {
      if (variant.imageUrl) {
        const publicId = extractPublicId(variant.imageUrl);
        if (publicId) publicIdsToDelete.push(publicId);
      }
    }

    // Delete images from Cloudinary
    if (publicIdsToDelete.length > 0) {
      console.log(`[Product Delete] Deleting ${publicIdsToDelete.length} images from Cloudinary...`);
      const deleteResults = await Promise.all(publicIdsToDelete.map(deleteFromCloudinary));
      const deletedCount = deleteResults.filter(r => r).length;
      console.log(`[Product Delete] Cloudinary deletion: ${deletedCount}/${publicIdsToDelete.length} successful`);
    }

    // Delete product from database (cascades to images, variants, etc.)
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

