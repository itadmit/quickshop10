import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { media, stores } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/shops/[slug]/media - Get all media for a store
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Get store by slug
    const [store] = await db.select().from(stores).where(eq(stores.slug, slug));
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get all media for this store, ordered by newest first
    const storeMedia = await db
      .select()
      .from(media)
      .where(eq(media.storeId, store.id))
      .orderBy(desc(media.createdAt));

    return NextResponse.json({ 
      media: storeMedia,
      total: storeMedia.length,
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch media' },
      { status: 500 }
    );
  }
}










