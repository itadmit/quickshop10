/**
 * Public API v1 - Products
 * GET /api/v1/products - List products
 * POST /api/v1/products - Create product
 * 
 * Requires: X-API-Key header
 * Scopes: products:read, products:write
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { products, productImages, productVariants, productOptions, productOptionValues, productCategories, categories, media } from '@/lib/db/schema';
import { eq, and, desc, asc, sql, like, or } from 'drizzle-orm';
import { requireApiAuth, apiSuccess, apiError, logApiRequest } from '@/lib/api-auth';
import { isValidImageUrl } from '@/lib/security/url-validator';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import { nanoid } from 'nanoid';

// GET /api/v1/products
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  const result = await requireApiAuth(request, 'products:read');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const status = searchParams.get('status'); // active, draft, all
    const categoryId = searchParams.get('category_id');
    const query = searchParams.get('query');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const fields = searchParams.get('fields')?.split(',');
    
    const offset = (page - 1) * limit;
    
    // Build conditions
    const conditions = [eq(products.storeId, auth.store.id)];
    
    if (status === 'active') {
      conditions.push(eq(products.isActive, true));
    } else if (status === 'draft') {
      conditions.push(eq(products.isActive, false));
    }
    
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }
    
    if (query) {
      conditions.push(
        or(
          like(products.name, `%${query}%`),
          like(products.sku, `%${query}%`),
          like(products.barcode, `%${query}%`)
        )!
      );
    }
    
    // Sort
    const orderColumn = sortBy === 'name' ? products.name :
                       sortBy === 'price' ? products.price :
                       sortBy === 'inventory' ? products.inventory :
                       sortBy === 'updated_at' ? products.updatedAt :
                       products.createdAt;
    const orderDir = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);
    
    // Get products with primary image in a single optimized query
    const productsData = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        short_description: products.shortDescription,
        price: products.price,
        compare_price: products.comparePrice,
        cost: products.cost,
        sku: products.sku,
        barcode: products.barcode,
        weight: products.weight,
        has_variants: products.hasVariants,
        track_inventory: products.trackInventory,
        inventory: products.inventory,
        allow_backorder: products.allowBackorder,
        is_active: products.isActive,
        is_featured: products.isFeatured,
        category_id: products.categoryId,
        seo_title: products.seoTitle,
        seo_description: products.seoDescription,
        created_at: products.createdAt,
        updated_at: products.updatedAt,
      })
      .from(products)
      .where(and(...conditions))
      .orderBy(orderDir)
      .limit(limit)
      .offset(offset);
    
    // Get all product IDs for batch image query
    const productIds = productsData.map(p => p.id);
    
    // Batch query for all images (1 query instead of N)
    const allImages = productIds.length > 0 ? await db
      .select({
        productId: productImages.productId,
        id: productImages.id,
        url: productImages.url,
        alt: productImages.alt,
        sort_order: productImages.sortOrder,
        is_primary: productImages.isPrimary,
      })
      .from(productImages)
      .where(sql`${productImages.productId} IN ${productIds}`)
      .orderBy(asc(productImages.sortOrder)) : [];
    
    // Group images by product ID
    const imagesByProduct = new Map<string, typeof allImages>();
    for (const img of allImages) {
      if (!imagesByProduct.has(img.productId)) {
        imagesByProduct.set(img.productId, []);
      }
      const productImgs = imagesByProduct.get(img.productId)!;
      if (productImgs.length < 10) { // Limit to 10 images per product
        productImgs.push(img);
      }
    }
    
    // Transform products with their images (no N+1!)
    const productsWithImages = productsData.map((product) => ({
      ...product,
      price: product.price ? Number(product.price) : null,
      compare_price: product.compare_price ? Number(product.compare_price) : null,
      cost: product.cost ? Number(product.cost) : null,
      weight: product.weight ? Number(product.weight) : null,
      images: (imagesByProduct.get(product.id) || []).map(({ productId, ...img }) => img),
    }));
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(...conditions));
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    
    return apiSuccess(productsWithImages, {
      pagination: {
        page,
        limit,
        total: Number(count),
        total_pages: Math.ceil(Number(count) / limit),
        has_next: page * limit < Number(count),
        has_prev: page > 1,
      },
    });
    
  } catch (error) {
    console.error('API v1 products list error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to fetch products', 500);
  }
}

// ============================================
// Helper: Upload image from URL to Vercel Blob
// ============================================

async function uploadImageFromUrl(
  imageUrl: string, 
  folder: string,
  storeId: string
): Promise<{ url: string; width: number; height: number } | null> {
  try {
    // Security: Validate URL to prevent SSRF attacks
    if (!isValidImageUrl(imageUrl)) {
      console.warn(`SSRF Protection: Blocked potentially unsafe URL: ${imageUrl}`);
      return null;
    }
    
    // Download image
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': 'QuickShop-API/1.0' },
      signal: AbortSignal.timeout(30000),
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch image from ${imageUrl}: ${response.status}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('image')) {
      console.warn(`Not an image: ${contentType}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    let buffer: Buffer = Buffer.from(arrayBuffer);
    let width = 0, height = 0;
    
    // Convert to WebP using sharp
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      if (metadata.width && metadata.width > 1200) {
        buffer = await image.resize(1200, null, { withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
      } else {
        buffer = await image.webp({ quality: 80 }).toBuffer();
      }
      
      const finalMetadata = await sharp(buffer).metadata();
      width = finalMetadata.width || 0;
      height = finalMetadata.height || 0;
    } catch (sharpErr) {
      console.warn('Sharp conversion failed, using original:', sharpErr);
    }
    
    // Upload to Vercel Blob
    const uniqueId = nanoid(10);
    const pathname = `${folder}/${uniqueId}.webp`;
    
    const blob = await put(pathname, buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'image/webp',
    });
    
    // Save to media library
    try {
      await db.insert(media).values({
        storeId,
        filename: uniqueId,
        originalFilename: imageUrl.split('/').pop() || uniqueId,
        mimeType: 'image/webp',
        size: buffer.length,
        width,
        height,
        url: blob.url,
        thumbnailUrl: blob.url,
        publicId: pathname,
        alt: null,
        folder: folder.split('/').pop() || null,
      });
    } catch {}
    
    return { url: blob.url, width, height };
  } catch (error) {
    console.error(`Failed to upload image from ${imageUrl}:`, error);
    return null;
  }
}

// ============================================
// Helper: Generate unique slug
// ============================================

async function generateUniqueSlug(storeId: string, baseSlug: string): Promise<string> {
  let slug = baseSlug.trim()
    .toLowerCase()
    .replace(/[^a-zא-ת0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  if (slug.length < 2) {
    slug = `product-${Date.now().toString(36)}`;
  }
  
  const existing = await db
    .select({ slug: products.slug })
    .from(products)
    .where(and(eq(products.storeId, storeId), like(products.slug, `${slug}%`)));
  
  const existingSlugs = new Set(existing.map(e => e.slug));
  
  if (!existingSlugs.has(slug)) {
    return slug;
  }
  
  let counter = 1;
  while (existingSlugs.has(`${slug}-${counter}`)) {
    counter++;
  }
  
  return `${slug}-${counter}`;
}

// ============================================
// POST /api/v1/products - Create product
// ============================================

interface CreateProductBody {
  name: string;
  slug?: string;
  short_description?: string;
  description?: string;
  price?: string;
  compare_price?: string;
  cost?: string;
  sku?: string;
  barcode?: string;
  weight?: string;
  track_inventory?: boolean;
  inventory?: number;
  allow_backorder?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  has_variants?: boolean;
  category_ids?: string[];
  seo_title?: string;
  seo_description?: string;
  metadata?: Record<string, unknown>;
  
  // Images - URL based, optionally downloaded to Vercel Blob
  images?: {
    url: string;
    alt?: string;
    is_primary?: boolean;
    media_type?: 'image' | 'video';
    thumbnail_url?: string;
  }[];
  
  // Options (for variants)
  options?: {
    name: string;
    display_type?: 'button' | 'color' | 'pattern' | 'image';
    values: { value: string; metadata?: Record<string, unknown> }[];
  }[];
  
  // Variants
  variants?: {
    title: string;
    sku?: string;
    barcode?: string;
    price: string;
    compare_price?: string;
    cost?: string;
    weight?: string;
    inventory?: number;
    allow_backorder?: boolean;
    option1?: string;
    option2?: string;
    option3?: string;
    image_url?: string;
  }[];
  
  // Flag: download images to Vercel Blob instead of storing URLs
  download_images?: boolean;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  const result = await requireApiAuth(request, 'products:write');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const body: CreateProductBody = await request.json();
    
    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      return apiError('validation_error', 'Product name is required', 400);
    }
    
    // Generate unique slug
    const baseSlug = body.slug || body.name;
    const uniqueSlug = await generateUniqueSlug(auth.store.id, baseSlug);
    
    // Validate categories exist
    let categoryIds: string[] = [];
    if (body.category_ids && body.category_ids.length > 0) {
      const existingCats = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(
          eq(categories.storeId, auth.store.id),
          sql`${categories.id} IN ${body.category_ids}`
        ));
      categoryIds = existingCats.map(c => c.id);
    }
    
    const primaryCategoryId = categoryIds.length > 0 ? categoryIds[0] : null;
    const hasVariants = body.has_variants ?? false;
    
    // Create product
    const [product] = await db.insert(products).values({
      storeId: auth.store.id,
      name: body.name.trim(),
      slug: uniqueSlug,
      shortDescription: body.short_description || null,
      description: body.description || null,
      price: hasVariants ? null : (body.price || null),
      comparePrice: hasVariants ? null : (body.compare_price || null),
      cost: hasVariants ? null : (body.cost || null),
      sku: hasVariants ? null : (body.sku || null),
      barcode: hasVariants ? null : (body.barcode || null),
      weight: body.weight || null,
      trackInventory: body.track_inventory ?? true,
      inventory: hasVariants ? null : (body.inventory ?? 0),
      allowBackorder: body.allow_backorder ?? false,
      isActive: body.is_active ?? true,
      isFeatured: body.is_featured ?? false,
      hasVariants,
      categoryId: primaryCategoryId,
      seoTitle: body.seo_title || null,
      seoDescription: body.seo_description || null,
      metadata: body.metadata || {},
    }).returning();
    
    // Add categories
    if (categoryIds.length > 0) {
      await db.insert(productCategories).values(
        categoryIds.map(categoryId => ({
          productId: product.id,
          categoryId,
        }))
      );
    }
    
    // Process and add images
    const createdImages: { id: string; url: string; is_primary: boolean }[] = [];
    
    if (body.images && body.images.length > 0) {
      const storeFolder = `quickshop/stores/${auth.store.slug}/products`;
      const imageValues: {
        productId: string;
        url: string;
        alt: string | null;
        sortOrder: number;
        isPrimary: boolean;
        mediaType: 'image' | 'video';
        thumbnailUrl: string | null;
      }[] = [];
      
      for (let i = 0; i < body.images.length; i++) {
        const img = body.images[i];
        const isVideo = img.media_type === 'video';
        let finalUrl = img.url;
        
        // Download and convert images to Vercel Blob (not videos)
        if (body.download_images && !isVideo && img.url) {
          const uploaded = await uploadImageFromUrl(img.url, storeFolder, auth.store.id);
          if (uploaded) {
            finalUrl = uploaded.url;
          }
        }
        
        imageValues.push({
          productId: product.id,
          url: finalUrl,
          alt: img.alt || body.name,
          sortOrder: i,
          isPrimary: img.is_primary ?? (i === 0),
          mediaType: isVideo ? 'video' : 'image',
          thumbnailUrl: img.thumbnail_url || null,
        });
      }
      
      if (imageValues.length > 0) {
        const insertedImages = await db.insert(productImages).values(imageValues).returning();
        createdImages.push(...insertedImages.map(img => ({
          id: img.id,
          url: img.url,
          is_primary: img.isPrimary,
        })));
      }
    }
    
    // Add options and variants if hasVariants
    if (hasVariants && body.options && body.options.length > 0) {
      // Create options
      for (let i = 0; i < body.options.length; i++) {
        const opt = body.options[i];
        const [option] = await db.insert(productOptions).values({
          productId: product.id,
          name: opt.name,
          displayType: opt.display_type || 'button',
          sortOrder: i,
        }).returning();
        
        // Create option values
        for (let j = 0; j < opt.values.length; j++) {
          const val = opt.values[j];
          await db.insert(productOptionValues).values({
            optionId: option.id,
            value: val.value,
            metadata: val.metadata || {},
            sortOrder: j,
          });
        }
      }
      
      // Create variants
      if (body.variants && body.variants.length > 0) {
        await db.insert(productVariants).values(
          body.variants.map((v, index) => ({
            productId: product.id,
            title: v.title,
            sku: v.sku || null,
            barcode: v.barcode || null,
            price: v.price,
            comparePrice: v.compare_price || null,
            cost: v.cost || null,
            weight: v.weight || null,
            inventory: v.inventory ?? 0,
            allowBackorder: v.allow_backorder ?? false,
            option1: v.option1 || null,
            option2: v.option2 || null,
            option3: v.option3 || null,
            imageUrl: v.image_url || null,
            sortOrder: index,
          }))
        );
      }
    }
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 201, Date.now() - startTime);
    
    return apiSuccess({
      id: product.id,
      name: product.name,
      slug: product.slug,
      is_active: product.isActive,
      has_variants: product.hasVariants,
      images: createdImages,
      created_at: product.createdAt,
    }, { message: 'Product created successfully' });
    
  } catch (error) {
    console.error('API v1 product create error:', error);
    await logApiRequest(result.auth.apiKey.id, result.auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to create product', 500);
  }
}

