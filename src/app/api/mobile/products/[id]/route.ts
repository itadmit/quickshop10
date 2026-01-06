/**
 * Mobile Product Detail API
 * GET /api/mobile/products/[id]
 * PATCH /api/mobile/products/[id] - Update product
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productImages, productOptions, productOptionValues, productVariants, categories, productCategories } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { requireMobileAuthWithStore, hasPermission } from '@/lib/mobile-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/mobile/products/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireMobileAuthWithStore(request);
    const { id } = await params;
    
    // Get product
    const [product] = await db
      .select()
      .from(products)
      .where(and(
        eq(products.id, id),
        eq(products.storeId, auth.store.id)
      ))
      .limit(1);
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Get images
    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(asc(productImages.sortOrder));
    
    // Get options with values
    const options = await db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, product.id))
      .orderBy(asc(productOptions.sortOrder));
    
    const optionsWithValues = await Promise.all(
      options.map(async (option) => {
        const values = await db
          .select()
          .from(productOptionValues)
          .where(eq(productOptionValues.optionId, option.id))
          .orderBy(asc(productOptionValues.sortOrder));
        
        return {
          id: option.id,
          name: option.name,
          sortOrder: option.sortOrder,
          values: values.map(v => ({
            id: v.id,
            value: v.value,
            sortOrder: v.sortOrder,
          })),
        };
      })
    );
    
    // Get variants
    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id))
      .orderBy(asc(productVariants.sortOrder));
    
    // Get category
    let category = null;
    if (product.categoryId) {
      const [cat] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, product.categoryId))
        .limit(1);
      if (cat) {
        category = { id: cat.id, name: cat.name, slug: cat.slug };
      }
    }
    
    // Get all categories product belongs to
    const productCats = await db
      .select({
        id: categories.id,
        name: categories.name,
      })
      .from(productCategories)
      .innerJoin(categories, eq(categories.id, productCategories.categoryId))
      .where(eq(productCategories.productId, product.id));
    
    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        storeId: product.storeId,
        categoryId: product.categoryId,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        price: product.price ? Number(product.price) : null,
        comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
        cost: product.cost ? Number(product.cost) : null,
        sku: product.sku,
        barcode: product.barcode,
        weight: product.weight ? Number(product.weight) : null,
        hasVariants: product.hasVariants,
        trackInventory: product.trackInventory,
        inventory: product.inventory,
        allowBackorder: product.allowBackorder,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        metadata: product.metadata,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
      images: images.map(i => ({
        id: i.id,
        url: i.url,
        alt: i.alt,
        sortOrder: i.sortOrder,
        isPrimary: i.isPrimary,
      })),
      options: optionsWithValues,
      variants: variants.map(v => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        barcode: v.barcode,
        price: Number(v.price),
        comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
        cost: v.cost ? Number(v.cost) : null,
        inventory: v.inventory,
        weight: v.weight ? Number(v.weight) : null,
        imageUrl: v.imageUrl,
        option1: v.option1,
        option2: v.option2,
        option3: v.option3,
        isActive: v.isActive,
      })),
      category,
      categories: productCats,
    });
    
  } catch (error) {
    console.error('Mobile product detail error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PATCH /api/mobile/products/[id] - Update product (basic fields only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireMobileAuthWithStore(request);
    const { id } = await params;
    const body = await request.json();
    
    // Check permission
    if (!hasPermission(auth, 'products.update')) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Verify product exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(and(
        eq(products.id, id),
        eq(products.storeId, auth.store.id)
      ))
      .limit(1);
    
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Build update object (only allow certain fields from mobile)
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
      updatedBy: auth.user.id,
    };
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.price !== undefined) updateData.price = body.price.toString();
    if (body.comparePrice !== undefined) updateData.comparePrice = body.comparePrice?.toString() || null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;
    if (body.inventory !== undefined && !existingProduct.hasVariants) {
      updateData.inventory = body.inventory;
    }
    
    // Update product
    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    
    return NextResponse.json({
      success: true,
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        price: updatedProduct.price ? Number(updatedProduct.price) : null,
        comparePrice: updatedProduct.comparePrice ? Number(updatedProduct.comparePrice) : null,
        inventory: updatedProduct.inventory,
        isActive: updatedProduct.isActive,
        isFeatured: updatedProduct.isFeatured,
        updatedAt: updatedProduct.updatedAt,
      },
    });
    
  } catch (error) {
    console.error('Mobile product update error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

