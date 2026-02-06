/**
 * Storefront Single Product API (Public)
 * GET /api/storefront/[storeSlug]/products/[slug]
 * 
 * Returns full product details with variants, options, and images
 * Public endpoint - no authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  stores, 
  products, 
  productImages, 
  productVariants, 
  productOptions, 
  productOptionValues,
  categories,
  productCategories
} from '@/lib/db/schema';
import { eq, and, asc, inArray } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ storeSlug: string; slug: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { storeSlug, slug } = await params;
    
    // Get store
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.slug, storeSlug))
      .limit(1);
    
    if (!store) {
      return NextResponse.json(
        { success: false, error: 'החנות לא נמצאה' },
        { status: 404 }
      );
    }
    
    // Get product
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        sku: products.sku,
        shortDescription: products.shortDescription,
        description: products.description,
        price: products.price,
        comparePrice: products.comparePrice,
        inventory: products.inventory,
        trackInventory: products.trackInventory,
        allowBackorder: products.allowBackorder,
        isFeatured: products.isFeatured,
        hasVariants: products.hasVariants,
        weight: products.weight,
        categoryId: products.categoryId,
        metadata: products.metadata,
        createdAt: products.createdAt,
        seoTitle: products.seoTitle,
        seoDescription: products.seoDescription,
      })
      .from(products)
      .where(and(
        eq(products.storeId, store.id),
        eq(products.slug, slug),
        eq(products.isActive, true) // Only active products
      ))
      .limit(1);
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'המוצר לא נמצא' },
        { status: 404 }
      );
    }
    
    // Get all images (sorted by sortOrder)
    const images = await db
      .select({
        id: productImages.id,
        url: productImages.url,
        alt: productImages.alt,
        sortOrder: productImages.sortOrder,
        isPrimary: productImages.isPrimary,
        mediaType: productImages.mediaType,
        thumbnailUrl: productImages.thumbnailUrl,
      })
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(asc(productImages.sortOrder));
    
    // Get options with values (for variants)
    const options = await db
      .select({
        id: productOptions.id,
        name: productOptions.name,
        displayType: productOptions.displayType,
        sortOrder: productOptions.sortOrder,
      })
      .from(productOptions)
      .where(eq(productOptions.productId, product.id))
      .orderBy(asc(productOptions.sortOrder));
    
    const optionsWithValues = await Promise.all(
      options.map(async (option) => {
        const values = await db
          .select({
            id: productOptionValues.id,
            value: productOptionValues.value,
            metadata: productOptionValues.metadata,
            sortOrder: productOptionValues.sortOrder,
          })
          .from(productOptionValues)
          .where(eq(productOptionValues.optionId, option.id))
          .orderBy(asc(productOptionValues.sortOrder));
        
        return {
          id: option.id,
          name: option.name,
          displayType: option.displayType,
          sortOrder: option.sortOrder,
          values: values.map(v => ({
            id: v.id,
            value: v.value,
            metadata: v.metadata,
            sortOrder: v.sortOrder,
          })),
        };
      })
    );
    
    // Get variants (if hasVariants)
    const variants = product.hasVariants
      ? await db
          .select({
            id: productVariants.id,
            title: productVariants.title,
            sku: productVariants.sku,
            barcode: productVariants.barcode,
            price: productVariants.price,
            comparePrice: productVariants.comparePrice,
            inventory: productVariants.inventory,
            allowBackorder: productVariants.allowBackorder,
            weight: productVariants.weight,
            option1: productVariants.option1,
            option2: productVariants.option2,
            option3: productVariants.option3,
            imageUrl: productVariants.imageUrl,
            isActive: productVariants.isActive,
            sortOrder: productVariants.sortOrder,
          })
          .from(productVariants)
          .where(and(
            eq(productVariants.productId, product.id),
            eq(productVariants.isActive, true)
          ))
          .orderBy(asc(productVariants.sortOrder))
      : [];
    
    // Get category info
    let category = null;
    if (product.categoryId) {
      const [cat] = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        })
        .from(categories)
        .where(eq(categories.id, product.categoryId))
        .limit(1);
      
      if (cat) {
        category = cat;
      }
    }
    
    // Get all categories (many-to-many)
    const productCats = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(productCategories)
      .innerJoin(categories, eq(categories.id, productCategories.categoryId))
      .where(eq(productCategories.productId, product.id));
    
    // Format response
    const response = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      shortDescription: product.shortDescription,
      description: product.description,
      price: product.price ? Number(product.price) : null,
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
      weight: product.weight ? Number(product.weight) : null,
      hasVariants: product.hasVariants,
      trackInventory: product.trackInventory,
      inventory: product.inventory,
      allowBackorder: product.allowBackorder,
      inStock: !product.trackInventory || product.allowBackorder || (product.inventory !== null && product.inventory > 0),
      isFeatured: product.isFeatured,
      metadata: product.metadata,
      createdAt: product.createdAt,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      
      // Images
      images: images.map(img => ({
        id: img.id,
        url: img.url,
        alt: img.alt || product.name,
        sortOrder: img.sortOrder,
        isPrimary: img.isPrimary,
        mediaType: img.mediaType,
        thumbnailUrl: img.thumbnailUrl,
      })),
      
      // Primary image for quick access
      primaryImage: images.find(img => img.isPrimary)?.url || images[0]?.url || null,
      
      // Options (for variant selection)
      options: optionsWithValues,
      
      // Variants
      variants: variants.map(v => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        barcode: v.barcode,
        price: Number(v.price),
        comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
        weight: v.weight ? Number(v.weight) : null,
        inventory: v.inventory,
        allowBackorder: v.allowBackorder,
        inStock: v.allowBackorder || (v.inventory !== null && v.inventory > 0),
        option1: v.option1,
        option2: v.option2,
        option3: v.option3,
        imageUrl: v.imageUrl,
        sortOrder: v.sortOrder,
      })),
      
      // Categories
      category, // Primary category
      categories: productCats, // All categories
    };
    
    return NextResponse.json({
      success: true,
      data: response,
    });
    
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת המוצר' },
      { status: 500 }
    );
  }
}
