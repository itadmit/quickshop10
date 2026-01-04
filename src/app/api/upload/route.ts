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

// Generate optimized URL with auto-format (WebP/AVIF) and auto-quality
function getOptimizedUrl(secureUrl: string): string {
  // Transform: .../upload/... → .../upload/f_auto,q_auto/...
  return secureUrl.replace('/upload/', '/upload/f_auto,q_auto/');
}

// Generate thumbnail URL (small, optimized)
function getThumbnailUrl(secureUrl: string, size = 300): string {
  return secureUrl.replace('/upload/', `/upload/f_auto,q_auto,w_${size},h_${size},c_fill/`);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'quickshop';
    const tags = formData.get('tags') as string;
    const storeId = formData.get('storeId') as string; // Optional: save to media library
    const skipMediaRecord = formData.get('skipMediaRecord') === 'true'; // Allow skipping DB save

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary using signed upload
    // Convert to WebP on upload for storage efficiency
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          format: 'webp', // ⚡ Convert to WebP on upload
          quality: 'auto:good', // ⚡ Optimal quality
          tags: tags ? tags.split(',') : ['quickshop'],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const optimizedUrl = getOptimizedUrl(result.secure_url);
    const thumbnailUrl = getThumbnailUrl(result.secure_url);

    // Save to media library if storeId provided (and not skipped)
    let mediaRecord = null;
    if (storeId && !skipMediaRecord) {
      try {
        const [newMedia] = await db.insert(media).values({
          storeId,
          filename: result.public_id.split('/').pop() || result.original_filename,
          originalFilename: result.original_filename || null,
          mimeType: `${result.resource_type}/${result.format}`,
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
        // Log but don't fail - upload was successful
        console.error('Error saving to media library:', dbError);
      }
    }

    // Return optimized URLs for maximum speed (f_auto = WebP/AVIF, q_auto = optimal quality)
    return NextResponse.json({
      public_id: result.public_id,
      secure_url: optimizedUrl, // ⚡ Optimized URL
      url: getOptimizedUrl(result.url),
      thumbnail_url: thumbnailUrl, // ⚡ Small thumbnail
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      resource_type: result.resource_type,
      created_at: result.created_at,
      original_filename: result.original_filename,
      folder: result.folder,
      media_id: mediaRecord?.id, // ID of saved media record
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

