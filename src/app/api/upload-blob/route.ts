/**
 * Vercel Blob Upload API Route
 * 
 * Handles file uploads to Vercel Blob storage.
 * Use this instead of Cloudinary for cost savings.
 * 
 * ⚡ PERFORMANCE FEATURES:
 * - Automatic WebP conversion for images (40-80% size reduction)
 * - Quality optimization (maintains visual quality)
 * - Metadata extraction (width/height)
 * - No runtime Image Optimization needed = faster + cheaper
 */

import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { db } from '@/lib/db';
import { media } from '@/lib/db/schema';
import { nanoid } from 'nanoid';
import sharp from 'sharp';

// Max file size: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg'],
  raw: ['application/pdf', 'font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/x-font-ttf', 'application/x-font-otf'],
};

// Image types that should be converted to WebP
const CONVERT_TO_WEBP = ['image/jpeg', 'image/png', 'image/avif'];

// Types to skip conversion (animated/vector)
const SKIP_CONVERSION = ['image/gif', 'image/svg+xml', 'image/webp'];

// Determine resource type from mime type
function getResourceType(mimeType: string): 'image' | 'video' | 'raw' {
  if (ALLOWED_TYPES.image.includes(mimeType)) return 'image';
  if (ALLOWED_TYPES.video.includes(mimeType)) return 'video';
  return 'raw';
}

// Check if file type is allowed
function isAllowedType(mimeType: string): boolean {
  return [...ALLOWED_TYPES.image, ...ALLOWED_TYPES.video, ...ALLOWED_TYPES.raw].includes(mimeType);
}

// Check if image should be converted to WebP
function shouldConvertToWebP(mimeType: string): boolean {
  return CONVERT_TO_WEBP.includes(mimeType);
}

/**
 * Convert image to WebP with optimization
 * Returns: { buffer, width, height, originalSize, optimizedSize }
 */
async function optimizeImage(buffer: Buffer, mimeType: string): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
  format: string;
}> {
  const originalSize = buffer.length;
  
  // Get image metadata
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  
  // Skip conversion for GIF (animated) and SVG (vector)
  if (SKIP_CONVERSION.includes(mimeType)) {
    return {
      buffer,
      width,
      height,
      originalSize,
      optimizedSize: originalSize,
      format: mimeType.split('/')[1],
    };
  }
  
  // Convert to WebP with quality optimization
  // Quality 82 gives ~same visual quality as JPEG 90 but 25-35% smaller
  const optimizedBuffer = await sharp(buffer)
    .webp({ 
      quality: 82,
      effort: 4,  // Balance between speed and compression (0-6)
    })
    .toBuffer();
  
  return {
    buffer: optimizedBuffer,
    width,
    height,
    originalSize,
    optimizedSize: optimizedBuffer.length,
    format: 'webp',
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'quickshop';
    const storeId = formData.get('storeId') as string;
    const skipMediaRecord = formData.get('skipMediaRecord') === 'true';
    const skipOptimization = formData.get('skipOptimization') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (20MB max)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'קובץ גדול מדי. מקסימום 20MB' }, { status: 400 });
    }

    // Validate file type
    if (!isAllowedType(file.type)) {
      return NextResponse.json({ 
        error: 'סוג קובץ לא נתמך. מותר: תמונות, וידאו, PDF, פונטים' 
      }, { status: 400 });
    }

    // Determine resource type
    const resourceType = getResourceType(file.type);
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(new Uint8Array(bytes));
    
    // Image dimensions and format
    let width: number | null = null;
    let height: number | null = null;
    let format = file.type.split('/')[1] || 'bin';
    let finalSize = file.size;
    let compressionInfo: { originalSize: number; optimizedSize: number } | null = null;

    // Optimize images (convert to WebP)
    if (resourceType === 'image' && !skipOptimization) {
      try {
        const optimized = await optimizeImage(buffer, file.type);
        buffer = optimized.buffer;
        width = optimized.width;
        height = optimized.height;
        format = optimized.format;
        finalSize = optimized.optimizedSize;
        
        // Track compression
        if (optimized.originalSize !== optimized.optimizedSize) {
          compressionInfo = {
            originalSize: optimized.originalSize,
            optimizedSize: optimized.optimizedSize,
          };
          console.log(`📦 Image optimized: ${file.name} - ${Math.round(optimized.originalSize / 1024)}KB → ${Math.round(optimized.optimizedSize / 1024)}KB (${Math.round((1 - optimized.optimizedSize / optimized.originalSize) * 100)}% saved)`);
        }
      } catch (sharpError) {
        console.warn('Image optimization failed, uploading original:', sharpError);
        // Continue with original buffer
      }
    }

    // Generate unique filename with correct extension
    const uniqueId = nanoid(10);
    const extension = format === 'webp' ? 'webp' : (file.type.split('/')[1] || 'bin');
    const pathname = `${folder}/${uniqueId}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(pathname, buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: format === 'webp' ? 'image/webp' : file.type,
    });

    // Save to media library if storeId provided
    let mediaRecord = null;
    if (storeId && !skipMediaRecord) {
      try {
        const [newMedia] = await db.insert(media).values({
          storeId,
          filename: uniqueId,
          originalFilename: file.name || null,
          mimeType: format === 'webp' ? 'image/webp' : file.type,
          size: finalSize,
          width,
          height,
          url: blob.url,
          thumbnailUrl: blob.url, // Use next/image for thumbnails
          publicId: pathname, // Store the path as publicId for compatibility
          alt: null,
          folder: folder.split('/').pop() || null,
        }).returning();
        mediaRecord = newMedia;
      } catch (dbError) {
        console.error('Error saving to media library:', dbError);
      }
    }

    return NextResponse.json({
      // Cloudinary-compatible response format
      public_id: pathname,
      secure_url: blob.url,
      url: blob.url,
      thumbnail_url: blob.url, // Use next/image for thumbnails
      format: extension,
      width,
      height,
      bytes: finalSize,
      resource_type: resourceType,
      created_at: new Date().toISOString(),
      original_filename: file.name,
      folder,
      media_id: mediaRecord?.id,
      // Vercel Blob specific
      blob_pathname: blob.pathname,
      blob_contentType: blob.contentType,
      // Optimization info
      optimization: compressionInfo ? {
        original_bytes: compressionInfo.originalSize,
        optimized_bytes: compressionInfo.optimizedSize,
        savings_percent: Math.round((1 - compressionInfo.optimizedSize / compressionInfo.originalSize) * 100),
      } : null,
    });
  } catch (error) {
    console.error('Blob upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

// DELETE endpoint for removing blobs
export async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    await del(url);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Blob delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}

