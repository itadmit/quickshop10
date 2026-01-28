/**
 * Product Import API with Real-time Progress Streaming
 * 
 * Supports:
 * - Create new products (import mode)
 * - Update existing products only (update mode) - by SKU or name
 * - Image download and WebP conversion via Vercel Blob
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { products, productImages, categories, productCategories, media, stores } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { isValidImageUrl } from '@/lib/security/url-validator';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import { nanoid } from 'nanoid';

// Helper to send SSE message
function sendSSE(controller: ReadableStreamDefaultController, data: object) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(message));
}

// Upload image from URL to Vercel Blob
async function uploadImageFromUrl(
  imageUrl: string, 
  folder: string,
  storeId: string,
  onProgress?: (message: string) => void
): Promise<{ url: string; width: number; height: number } | null> {
  try {
    if (!isValidImageUrl(imageUrl)) {
      onProgress?.('URL לא תקין');
      return null;
    }
    
    onProgress?.('מוריד תמונה...');
    
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': 'QuickShop-Import/1.0' },
      signal: AbortSignal.timeout(30000),
    });
    
    if (!response.ok) {
      onProgress?.(`שגיאה ${response.status}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('image')) {
      onProgress?.(`לא תמונה: ${contentType}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    let buffer: Buffer = Buffer.from(arrayBuffer);
    let width = 0, height = 0;
    
    onProgress?.('ממיר ל-WebP...');
    
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      if (metadata.width && metadata.width > 1200) {
        const resizedBuffer = await image.resize(1200, null, { withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
        buffer = Buffer.from(resizedBuffer);
      } else {
        const webpBuffer = await image.webp({ quality: 80 }).toBuffer();
        buffer = Buffer.from(webpBuffer);
      }
      
      const finalMetadata = await sharp(buffer).metadata();
      width = finalMetadata.width || 0;
      height = finalMetadata.height || 0;
    } catch (sharpErr) {
      onProgress?.('המרה נכשלה, משתמש במקור');
      console.error('Sharp error:', sharpErr);
    }
    
    onProgress?.('מעלה לשרת...');
    
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
    
    onProgress?.('תמונה הועלתה');
    
    return { url: blob.url, width, height };
  } catch (error) {
    onProgress?.(`שגיאה: ${error instanceof Error ? error.message : 'Unknown'}`);
    return null;
  }
}

// Parse CSV
function parseCSV(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  // Get store
  const store = await db.select().from(stores).where(eq(stores.slug, slug)).then(r => r[0]);
  if (!store) {
    return new Response(JSON.stringify({ error: 'Store not found' }), { status: 404 });
  }
  
  // Parse request
  const body = await request.json();
  const { csvText, mapping, imagePrefix, testMode, updateMode, updateKey } = body;
  
  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const logs: string[] = [];
      const errors: string[] = [];
      
      const log = (message: string) => {
        logs.push(message);
        sendSSE(controller, { type: 'log', message, logs });
      };
      
      const logError = (message: string) => {
        errors.push(message);
        logs.push(message);
        sendSSE(controller, { type: 'log', message, logs });
      };
      
      const progress = (current: number, total: number, step: string) => {
        const percent = Math.round((current / total) * 100);
        sendSSE(controller, { type: 'progress', current, total, percent, step });
      };
      
      try {
        if (updateMode) {
          log(`מצב עדכון: זיהוי לפי ${updateKey === 'sku' ? 'מק"ט' : 'שם מוצר'}`);
        } else {
          log('מצב ייבוא: יצירת מוצרים חדשים');
        }
        progress(0, 100, 'מנתח CSV');
        
        // Parse CSV
        const allRows = parseCSV(csvText);
        if (allRows.length < 2) {
          sendSSE(controller, { type: 'error', message: 'הקובץ ריק או לא בפורמט נכון' });
          controller.close();
          return;
        }
        
        const dataRows = testMode ? allRows.slice(1, 4) : allRows.slice(1);
        const totalProducts = dataRows.length;
        
        log(`נמצאו ${totalProducts} שורות בקובץ`);
        progress(5, 100, 'טוען נתונים קיימים');
        
        // Get existing categories
        const existingCategories = await db.select().from(categories).where(eq(categories.storeId, store.id));
        const categoryMap = new Map(existingCategories.map(c => [c.name.toLowerCase(), c.id]));
        
        // Get existing products (for update mode)
        const existingProducts = await db.select({
          id: products.id,
          name: products.name,
          sku: products.sku,
        }).from(products).where(eq(products.storeId, store.id));
        
        const productByName = new Map(existingProducts.map(p => [p.name.toLowerCase(), p]));
        const productBySku = new Map(existingProducts.filter(p => p.sku).map(p => [p.sku!.toLowerCase(), p]));
        
        log(`${existingCategories.length} קטגוריות, ${existingProducts.length} מוצרים קיימים`);
        
        let imported = 0;
        let updated = 0;
        let skipped = 0;
        let failed = 0;
        const createdCategories: string[] = [];
        const storeFolder = `quickshop/${store.slug}/products`;
        
        // Process each product
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const productNum = i + 1;
          const overallProgress = 10 + Math.round((i / dataRows.length) * 85);
          
          progress(overallProgress, 100, `מעבד ${productNum}/${totalProducts}`);
          
          try {
            // Extract data using mapping
            const name = row[mapping.name]?.trim();
            const shortDescription = mapping.shortDescription >= 0 ? row[mapping.shortDescription]?.trim() || '' : '';
            const description = row[mapping.description]?.trim() || '';
            const priceStr = row[mapping.price]?.trim() || '0';
            const price = parseFloat(priceStr.replace(/[^\d.]/g, '')) || 0;
            const comparePriceStr = row[mapping.comparePrice]?.trim() || '';
            const comparePrice = comparePriceStr ? parseFloat(comparePriceStr.replace(/[^\d.]/g, '')) : null;
            const sku = row[mapping.sku]?.trim() || null;
            const inventoryStr = row[mapping.inventory]?.trim() || '0';
            const inventory = parseInt(inventoryStr.replace(/[^\d]/g, '')) || 0;
            const categoriesStr = row[mapping.categories]?.trim() || '';
            const imagesStr = row[mapping.images]?.trim() || '';
            
            if (!name) {
              logError(`שורה ${productNum}: חסר שם מוצר - דילוג`);
              failed++;
              continue;
            }
            
            // Check if product exists
            let existingProduct = null;
            if (updateKey === 'sku' && sku) {
              existingProduct = productBySku.get(sku.toLowerCase());
            } else if (updateKey === 'name') {
              existingProduct = productByName.get(name.toLowerCase());
            }
            
            // In UPDATE MODE - only update existing, skip new
            if (updateMode && !existingProduct) {
              log(`דילוג: "${name}" - לא נמצא במערכת`);
              skipped++;
              continue;
            }
            
            let productId: string;
            
            if (existingProduct) {
              // UPDATE existing product - update ALL fields
              log(`מעדכן: "${name}"`);
              
              await db.update(products).set({
                name,
                shortDescription: shortDescription || null,
                description,
                price: price.toString(),
                comparePrice: comparePrice?.toString() || null,
                sku,
                inventory,
                updatedAt: new Date(),
                updatedBy: session.user.id,
              }).where(eq(products.id, existingProduct.id));
              
              productId = existingProduct.id;
              
              // Update categories - clear and recreate
              if (categoriesStr) {
                await db.delete(productCategories).where(eq(productCategories.productId, productId));
                
                const catNames = categoriesStr.split(/[,;|]/).map(c => c.trim()).filter(Boolean);
                const catIds: string[] = [];
                
                for (const catName of catNames) {
                  const existing = categoryMap.get(catName.toLowerCase());
                  if (existing) {
                    catIds.push(existing);
                  } else {
                    const catSlug = catName.toLowerCase()
                      .replace(/[^\u0590-\u05FFa-zA-Z0-9\s-]/g, '')
                      .replace(/\s+/g, '-') + '-' + nanoid(4);
                    
                    const [newCat] = await db.insert(categories).values({
                      storeId: store.id,
                      name: catName,
                      slug: catSlug,
                    }).returning();
                    
                    categoryMap.set(catName.toLowerCase(), newCat.id);
                    catIds.push(newCat.id);
                    createdCategories.push(catName);
                  }
                }
                
                if (catIds.length > 0) {
                  await db.insert(productCategories).values(
                    catIds.map((catId, idx) => ({
                      productId,
                      categoryId: catId,
                      sortOrder: idx,
                    }))
                  );
                }
              }
              
              // Update images - clear and recreate if provided
              if (imagesStr) {
                await db.delete(productImages).where(eq(productImages.productId, productId));
                
                const imageNames = imagesStr.split(/[,;|]/).map(img => img.trim()).filter(Boolean);
                
                for (let imgIdx = 0; imgIdx < imageNames.length; imgIdx++) {
                  const imgName = imageNames[imgIdx];
                  // If already a full URL, use as-is; otherwise add prefix
                  const fullUrl = imgName.startsWith('http://') || imgName.startsWith('https://') 
                    ? imgName 
                    : (imagePrefix || '') + imgName;
                  
                  const uploaded = await uploadImageFromUrl(fullUrl, storeFolder, store.id, (msg) => {
                    log(`   ${msg}`);
                  });
                  
                  if (uploaded) {
                    await db.insert(productImages).values({
                      productId,
                      url: uploaded.url,
                      alt: name,
                      sortOrder: imgIdx,
                      isPrimary: imgIdx === 0,
                    });
                  } else {
                    await db.insert(productImages).values({
                      productId,
                      url: fullUrl,
                      alt: name,
                      sortOrder: imgIdx,
                      isPrimary: imgIdx === 0,
                    });
                  }
                }
              }
              
              updated++;
              
            } else {
              // CREATE new product (only in import mode)
              log(`יוצר: "${name}"`);
              
              const productSlug = name.toLowerCase()
                .replace(/[^\u0590-\u05FFa-zA-Z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 100) + '-' + nanoid(6);
              
              const [insertedProduct] = await db.insert(products).values({
                storeId: store.id,
                name,
                slug: productSlug,
                shortDescription: shortDescription || null,
                description,
                price: price.toString(),
                comparePrice: comparePrice?.toString() || null,
                sku,
                inventory,
                trackInventory: true,
                isActive: true,
                hasVariants: false,
                createdBy: session.user.id,
              }).returning();
              
              productId = insertedProduct.id;
              imported++;
              
              // Add to maps
              productByName.set(name.toLowerCase(), { id: productId, name, sku });
              if (sku) productBySku.set(sku.toLowerCase(), { id: productId, name, sku });
              
              // Handle categories
              if (categoriesStr) {
                const catNames = categoriesStr.split(/[,;|]/).map(c => c.trim()).filter(Boolean);
                const catIds: string[] = [];
                
                for (const catName of catNames) {
                  const existing = categoryMap.get(catName.toLowerCase());
                  if (existing) {
                    catIds.push(existing);
                  } else {
                    const catSlug = catName.toLowerCase()
                      .replace(/[^\u0590-\u05FFa-zA-Z0-9\s-]/g, '')
                      .replace(/\s+/g, '-') + '-' + nanoid(4);
                    
                    const [newCat] = await db.insert(categories).values({
                      storeId: store.id,
                      name: catName,
                      slug: catSlug,
                    }).returning();
                    
                    categoryMap.set(catName.toLowerCase(), newCat.id);
                    catIds.push(newCat.id);
                    createdCategories.push(catName);
                  }
                }
                
                if (catIds.length > 0) {
                  await db.insert(productCategories).values(
                    catIds.map((catId, idx) => ({
                      productId,
                      categoryId: catId,
                      sortOrder: idx,
                    }))
                  );
                }
              }
              
              // Handle images
              if (imagesStr) {
                const imageNames = imagesStr.split(/[,;|]/).map(img => img.trim()).filter(Boolean);
                
                for (let imgIdx = 0; imgIdx < imageNames.length; imgIdx++) {
                  const imgName = imageNames[imgIdx];
                  // If already a full URL, use as-is; otherwise add prefix
                  const fullUrl = imgName.startsWith('http://') || imgName.startsWith('https://') 
                    ? imgName 
                    : (imagePrefix || '') + imgName;
                  
                  const uploaded = await uploadImageFromUrl(fullUrl, storeFolder, store.id, (msg) => {
                    log(`   ${msg}`);
                  });
                  
                  if (uploaded) {
                    await db.insert(productImages).values({
                      productId,
                      url: uploaded.url,
                      alt: name,
                      sortOrder: imgIdx,
                      isPrimary: imgIdx === 0,
                    });
                  } else {
                    await db.insert(productImages).values({
                      productId,
                      url: fullUrl,
                      alt: name,
                      sortOrder: imgIdx,
                      isPrimary: imgIdx === 0,
                    });
                  }
                }
              }
            }
            
            log(`"${name}" ${existingProduct ? 'עודכן' : 'נוצר'} בהצלחה`);
            
          } catch (error) {
            failed++;
            logError(`שגיאה בשורה ${productNum}: ${error instanceof Error ? error.message : 'Unknown'}`);
          }
        }
        
        progress(100, 100, 'הושלם');
        
        const summary = updateMode
          ? `הושלם! ${updated} עודכנו, ${skipped} דולגו (לא נמצאו), ${failed} נכשלו`
          : `הושלם! ${imported} חדשים, ${updated} עודכנו, ${failed} נכשלו`;
        log(summary);
        
        sendSSE(controller, {
          type: 'complete',
          result: {
            success: imported > 0 || updated > 0,
            imported,
            updated,
            skipped,
            failed,
            errors,
            createdCategories,
            totalInFile: dataRows.length,
            isTestMode: testMode,
          }
        });
        
      } catch (error) {
        sendSSE(controller, { 
          type: 'error', 
          message: error instanceof Error ? error.message : 'שגיאה בייבוא' 
        });
      }
      
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
