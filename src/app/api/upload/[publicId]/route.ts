import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// DELETE /api/upload/[publicId] - Delete from Cloudinary
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params;
    
    // publicId comes URL encoded, decode it
    const decodedPublicId = decodeURIComponent(publicId);
    
    if (!decodedPublicId) {
      return NextResponse.json({ error: 'No publicId provided' }, { status: 400 });
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(decodedPublicId, {
      invalidate: true, // Invalidate CDN cache for immediate effect
    });

    if (result.result === 'ok' || result.result === 'not found') {
      return NextResponse.json({ success: true, result: result.result });
    }

    return NextResponse.json(
      { error: 'Delete failed', result },
      { status: 500 }
    );
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}










