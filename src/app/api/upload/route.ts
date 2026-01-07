import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { db } from '@/lib/db';
import { media } from '@/lib/db/schema';

// Configure Cloudinary with server-side credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Max file size: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg'],
  raw: ['application/pdf', 'font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/x-font-ttf', 'application/x-font-otf'],
};

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

// Generate optimized URL with auto-format (WebP/AVIF) and auto-quality - ONLY for images
function getOptimizedUrl(secureUrl: string, resourceType: string): string {
  if (resourceType === 'image') {
    return secureUrl.replace('/upload/', '/upload/f_auto,q_auto/');
  }
  return secureUrl;
}

// Generate thumbnail URL (small, optimized) - ONLY for images/videos
function getThumbnailUrl(secureUrl: string, resourceType: string, size = 300): string {
  if (resourceType === 'image') {
    return secureUrl.replace('/upload/', `/upload/f_auto,q_auto,w_${size},h_${size},c_fill/`);
  }
  if (resourceType === 'video') {
    // For videos, get a frame as thumbnail
    return secureUrl.replace('/upload/', `/upload/f_jpg,w_${size},h_${size},c_fill,so_0/`).replace(/\.[^/.]+$/, '.jpg');
  }
  return secureUrl; // Raw files don't have thumbnails
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'quickshop';
    const tags = formData.get('tags') as string;
    const storeId = formData.get('storeId') as string;
    const skipMediaRecord = formData.get('skipMediaRecord') === 'true';

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
    const buffer = Buffer.from(bytes);

    // Build upload options based on file type
    const uploadOptions: Record<string, unknown> = {
      folder,
      resource_type: resourceType,
      tags: tags ? tags.split(',') : ['quickshop'],
    };

    // Only apply image optimizations for images
    if (resourceType === 'image' && !file.type.includes('svg') && !file.type.includes('gif')) {
      uploadOptions.format = 'webp';
      uploadOptions.quality = 'auto:good';
    }

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const optimizedUrl = getOptimizedUrl(result.secure_url, resourceType);
    const thumbnailUrl = getThumbnailUrl(result.secure_url, resourceType);

    // Save to media library if storeId provided
    let mediaRecord = null;
    if (storeId && !skipMediaRecord) {
      try {
        const [newMedia] = await db.insert(media).values({
          storeId,
          filename: result.public_id.split('/').pop() || result.original_filename,
          originalFilename: result.original_filename || null,
          mimeType: file.type,
          size: result.bytes,
          width: result.width || null,
          height: result.height || null,
          url: optimizedUrl,
          thumbnailUrl: thumbnailUrl,
          publicId: result.public_id,
          alt: null,
          folder: folder.split('/').pop() || null,
        }).returning();
        mediaRecord = newMedia;
      } catch (dbError) {
        console.error('Error saving to media library:', dbError);
      }
    }

    return NextResponse.json({
      public_id: result.public_id,
      secure_url: optimizedUrl,
      url: optimizedUrl,
      thumbnail_url: thumbnailUrl,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      resource_type: resourceType,
      created_at: result.created_at,
      original_filename: result.original_filename,
      folder: result.folder,
      media_id: mediaRecord?.id,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

