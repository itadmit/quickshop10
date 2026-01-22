/**
 * Vercel Blob Client Upload API
 * 
 * For large files (>4.5MB), use client-side upload directly to Vercel Blob.
 * This endpoint handles the completion callback after the upload is done.
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { db } from '@/lib/db';
import { media } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Extract folder and filename info from pathname
        // pathname will be like: "quickshop/stores/argania/xyz123.mp4"
        console.log('[Blob Client] Generating token for:', pathname);
        
        return {
          allowedContentTypes: [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif',
            'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg',
            'application/pdf',
          ],
          maximumSizeInBytes: 15 * 1024 * 1024, // 15MB max
          tokenPayload: JSON.stringify({
            pathname,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This runs after the file is uploaded to Vercel Blob
        console.log('[Blob Client] Upload completed:', blob.pathname);
        
        try {
          const payload = tokenPayload ? JSON.parse(tokenPayload) : {};
          const { storeId, folder } = payload;
          
          // Only save to media library if storeId is provided
          if (storeId) {
            const filename = blob.pathname.split('/').pop()?.split('.')[0] || blob.pathname;
            const mimeType = blob.contentType || 'application/octet-stream';
            
            await db.insert(media).values({
              storeId,
              filename,
              originalFilename: null, // Not available in callback
              mimeType,
              size: 0, // Not available in callback
              url: blob.url,
              thumbnailUrl: blob.url,
              publicId: blob.pathname,
              folder: folder || null,
            });
            
            console.log('[Blob Client] Media record created for:', blob.pathname);
          }
        } catch (dbError) {
          console.error('[Blob Client] Error saving to media library:', dbError);
          // Don't throw - the upload itself succeeded
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('[Blob Client] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 }
    );
  }
}

