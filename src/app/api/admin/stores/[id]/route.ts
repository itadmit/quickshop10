import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { 
  stores, 
  media, 
  products, 
  productImages, 
  categories,
  productVariants,
  popups,
  pages
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Cloudinary credentials
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

// Bulk delete images from Cloudinary
async function bulkDeleteFromCloudinary(publicIds: string[]): Promise<{ deleted: number; failed: number }> {
  let deleted = 0;
  let failed = 0;
  
  // Process in batches of 10 to avoid overwhelming Cloudinary
  const batchSize = 10;
  for (let i = 0; i < publicIds.length; i += batchSize) {
    const batch = publicIds.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(deleteFromCloudinary));
    deleted += results.filter(r => r).length;
    failed += results.filter(r => !r).length;
  }
  
  return { deleted, failed };
}

// Delete a folder from Cloudinary (must be empty)
async function deleteCloudinaryFolder(folderPath: string): Promise<boolean> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn('Cloudinary credentials not configured');
    return false;
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const stringToSign = `timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/folders/${encodeURIComponent(folderPath)}?api_key=${CLOUDINARY_API_KEY}&signature=${signature}&timestamp=${timestamp}`,
      {
        method: 'DELETE',
      }
    );

    const result = await response.json();
    return response.ok || result.deleted;
  } catch (error) {
    console.error(`Error deleting Cloudinary folder ${folderPath}:`, error);
    return false;
  }
}

// Get subfolders from Cloudinary
async function getCloudinarySubfolders(folderPath: string): Promise<string[]> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return [];
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const stringToSign = `timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/folders/${encodeURIComponent(folderPath)}?api_key=${CLOUDINARY_API_KEY}&signature=${signature}&timestamp=${timestamp}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) return [];
    
    const result = await response.json();
    return (result.folders || []).map((f: { path: string }) => f.path);
  } catch (error) {
    console.error(`Error getting Cloudinary subfolders for ${folderPath}:`, error);
    return [];
  }
}

// Recursively delete folder and all subfolders (from deepest to shallowest)
async function deleteCloudinaryFolderRecursive(basePath: string): Promise<number> {
  let deletedCount = 0;
  
  // Get all subfolders
  const subfolders = await getCloudinarySubfolders(basePath);
  
  // Recursively delete subfolders first (depth-first)
  for (const subfolder of subfolders) {
    deletedCount += await deleteCloudinaryFolderRecursive(subfolder);
  }
  
  // Then delete this folder (now empty)
  const deleted = await deleteCloudinaryFolder(basePath);
  if (deleted) {
    deletedCount++;
    console.log(`[Store Delete] Deleted Cloudinary folder: ${basePath}`);
  }
  
  return deletedCount;
}

// GET - Get store details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const store = await db.query.stores.findFirst({
    where: eq(stores.id, id),
  });

  if (!store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  return NextResponse.json(store);
}

// PATCH - Update store
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Check store exists
  const existingStore = await db.query.stores.findFirst({
    where: eq(stores.id, id),
  });

  if (!existingStore) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  // Check slug uniqueness if changed
  if (body.slug && body.slug !== existingStore.slug) {
    const slugExists = await db.query.stores.findFirst({
      where: eq(stores.slug, body.slug),
    });
    if (slugExists) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }
  }

  // Prepare update data
  const updateData: Partial<typeof stores.$inferInsert> = {};
  
  if (body.name !== undefined) updateData.name = body.name;
  if (body.slug !== undefined) updateData.slug = body.slug;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.customDomain !== undefined) updateData.customDomain = body.customDomain || null;

  const [updatedStore] = await db
    .update(stores)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(stores.id, id))
    .returning();

  return NextResponse.json(updatedStore);
}

// DELETE - Delete store and all related data including Cloudinary images
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Check store exists
  const existingStore = await db.query.stores.findFirst({
    where: eq(stores.id, id),
  });

  if (!existingStore) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  console.log(`[Store Delete] Starting deletion of store: ${existingStore.name} (${id})`);

  // Collect all Cloudinary public IDs to delete
  const publicIdsToDelete: string[] = [];

  try {
    // 1. Get all media library images (has publicId stored)
    const mediaRecords = await db.select({ 
      publicId: media.publicId, 
      url: media.url 
    }).from(media).where(eq(media.storeId, id));
    
    for (const record of mediaRecords) {
      const publicId = record.publicId || extractPublicId(record.url);
      if (publicId) publicIdsToDelete.push(publicId);
    }
    console.log(`[Store Delete] Found ${mediaRecords.length} media library images`);

    // 2. Get all product images
    const storeProducts = await db.select({ id: products.id }).from(products).where(eq(products.storeId, id));
    const productIds = storeProducts.map(p => p.id);
    
    if (productIds.length > 0) {
      // Get product images
      const allProductImages = await db.select({ url: productImages.url })
        .from(productImages)
        .innerJoin(products, eq(productImages.productId, products.id))
        .where(eq(products.storeId, id));
      
      for (const img of allProductImages) {
        const publicId = extractPublicId(img.url);
        if (publicId) publicIdsToDelete.push(publicId);
      }
      console.log(`[Store Delete] Found ${allProductImages.length} product images`);

      // Get variant images
      const allVariantImages = await db.select({ imageUrl: productVariants.imageUrl })
        .from(productVariants)
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(eq(products.storeId, id));
      
      for (const variant of allVariantImages) {
        if (variant.imageUrl) {
          const publicId = extractPublicId(variant.imageUrl);
          if (publicId) publicIdsToDelete.push(publicId);
        }
      }
      console.log(`[Store Delete] Found ${allVariantImages.filter(v => v.imageUrl).length} variant images`);
    }

    // 3. Get category images
    const categoryImages = await db.select({ imageUrl: categories.imageUrl })
      .from(categories)
      .where(eq(categories.storeId, id));
    
    for (const cat of categoryImages) {
      if (cat.imageUrl) {
        const publicId = extractPublicId(cat.imageUrl);
        if (publicId) publicIdsToDelete.push(publicId);
      }
    }
    console.log(`[Store Delete] Found ${categoryImages.filter(c => c.imageUrl).length} category images`);

    // 4. Get popup images
    const popupRecords = await db.select({ content: popups.content })
      .from(popups)
      .where(eq(popups.storeId, id));
    
    for (const popup of popupRecords) {
      const content = popup.content as { imageUrl?: string } | null;
      if (content?.imageUrl) {
        const publicId = extractPublicId(content.imageUrl);
        if (publicId) publicIdsToDelete.push(publicId);
      }
    }
    console.log(`[Store Delete] Found ${popupRecords.length} popups`);

    // 5. Get page section images (hero, banners, split banners, etc.)
    // NEW ARCHITECTURE: Sections stored as JSON on stores and pages tables
    
    // Helper to extract images from section
    const extractSectionImages = (section: { type: string; content: Record<string, unknown> | null }) => {
      const content = section.content;
      if (!content) return;

      // Hero and banner sections have imageUrl directly
      if (content.imageUrl && typeof content.imageUrl === 'string') {
        const publicId = extractPublicId(content.imageUrl);
        if (publicId) {
          publicIdsToDelete.push(publicId);
          sectionImagesCount++;
        }
      }

      // Split banner sections have right/left objects with imageUrl and mobileImageUrl
      if (section.type === 'split_banner') {
        const right = content.right as { imageUrl?: string; mobileImageUrl?: string } | undefined;
        const left = content.left as { imageUrl?: string; mobileImageUrl?: string } | undefined;
        
        if (right?.imageUrl) {
          const publicId = extractPublicId(right.imageUrl);
          if (publicId) {
            publicIdsToDelete.push(publicId);
            sectionImagesCount++;
          }
        }
        if (right?.mobileImageUrl) {
          const publicId = extractPublicId(right.mobileImageUrl);
          if (publicId) {
            publicIdsToDelete.push(publicId);
            sectionImagesCount++;
          }
        }
        if (left?.imageUrl) {
          const publicId = extractPublicId(left.imageUrl);
          if (publicId) {
            publicIdsToDelete.push(publicId);
            sectionImagesCount++;
          }
        }
        if (left?.mobileImageUrl) {
          const publicId = extractPublicId(left.mobileImageUrl);
          if (publicId) {
            publicIdsToDelete.push(publicId);
            sectionImagesCount++;
          }
        }
      }

      // Video banner might have poster/thumbnail
      if (section.type === 'video_banner' && content.posterUrl && typeof content.posterUrl === 'string') {
        const publicId = extractPublicId(content.posterUrl);
        if (publicId) {
          publicIdsToDelete.push(publicId);
          sectionImagesCount++;
        }
      }
    };

    let sectionImagesCount = 0;
    
    // Get sections from stores table (home, coming_soon)
    const homeSections = (existingStore.homeSections || []) as Array<{ type: string; content: Record<string, unknown> | null }>;
    const comingSoonSections = (existingStore.comingSoonSections || []) as Array<{ type: string; content: Record<string, unknown> | null }>;
    
    for (const section of [...homeSections, ...comingSoonSections]) {
      extractSectionImages(section);
    }
    
    // Get sections from pages table (internal pages)
    const pageRecords = await db.select({ sections: pages.sections })
      .from(pages)
      .where(eq(pages.storeId, id));
    
    for (const page of pageRecords) {
      const pageSections = (page.sections || []) as Array<{ type: string; content: Record<string, unknown> | null }>;
      for (const section of pageSections) {
        extractSectionImages(section);
      }
    }
    
    console.log(`[Store Delete] Found ${sectionImagesCount} page section images`);

    // 6. Get store logo and favicon
    if (existingStore.logoUrl) {
      const publicId = extractPublicId(existingStore.logoUrl);
      if (publicId) publicIdsToDelete.push(publicId);
    }
    if (existingStore.faviconUrl) {
      const publicId = extractPublicId(existingStore.faviconUrl);
      if (publicId) publicIdsToDelete.push(publicId);
    }

    // Remove duplicates
    const uniquePublicIds = [...new Set(publicIdsToDelete)];
    console.log(`[Store Delete] Total unique Cloudinary images to delete: ${uniquePublicIds.length}`);

    // Delete all images from Cloudinary
    if (uniquePublicIds.length > 0) {
      console.log(`[Store Delete] Deleting ${uniquePublicIds.length} images from Cloudinary...`);
      const cloudinaryResult = await bulkDeleteFromCloudinary(uniquePublicIds);
      console.log(`[Store Delete] Cloudinary deletion complete: ${cloudinaryResult.deleted} deleted, ${cloudinaryResult.failed} failed`);
    }

    // Delete the store's Cloudinary folder (quickshop/stores/{slug})
    const storeFolderPath = `quickshop/stores/${existingStore.slug}`;
    console.log(`[Store Delete] Deleting Cloudinary folder: ${storeFolderPath}`);
    const deletedFolders = await deleteCloudinaryFolderRecursive(storeFolderPath);
    console.log(`[Store Delete] Deleted ${deletedFolders} Cloudinary folders`);

    // Delete the store - cascades to all related tables
    console.log(`[Store Delete] Deleting store from database (cascades to all related data)...`);
    await db.delete(stores).where(eq(stores.id, id));

    console.log(`[Store Delete] Store ${existingStore.name} (${id}) deleted successfully`);

    return NextResponse.json({ 
      success: true,
      deletedImages: uniquePublicIds.length,
      deletedFolders,
      storeName: existingStore.name
    });
  } catch (error) {
    console.error('[Store Delete] Error deleting store:', error);
    return NextResponse.json(
      { error: 'שגיאה במחיקת החנות. נסה שוב מאוחר יותר.' },
      { status: 500 }
    );
  }
}
