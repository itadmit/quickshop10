/**
 * Save Media Record API
 * 
 * Saves a media record to the database after client-side blob upload.
 * Used because onUploadCompleted callback doesn't work in local development.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { media } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, folder, url, pathname, contentType, originalFilename, size } = body;

    if (!storeId || !url) {
      return NextResponse.json(
        { error: 'Missing required fields: storeId and url' },
        { status: 400 }
      );
    }

    const filename = pathname?.split('/').pop()?.split('.')[0] || pathname || 'unknown';
    const mimeType = contentType || 'application/octet-stream';

    await db.insert(media).values({
      storeId,
      filename,
      originalFilename: originalFilename || null,
      mimeType,
      size: size || 0,
      url,
      thumbnailUrl: url, // For videos, thumbnail is same as url (could generate later)
      publicId: pathname || url,
      folder: folder || null,
    });

    console.log('[Save Media] Media record created:', { storeId, url, mimeType });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Save Media] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save media record' },
      { status: 500 }
    );
  }
}

