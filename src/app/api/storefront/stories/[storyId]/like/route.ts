/**
 * Story Like API - Toggle like on story
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productStories, storyLikes } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    
    // Get visitor ID from cookie or header
    const visitorId = 
      request.cookies.get('visitor_id')?.value ||
      request.headers.get('x-visitor-id') ||
      `anon-${Date.now()}`;

    // Check if already liked
    const [existingLike] = await db
      .select({ id: storyLikes.id })
      .from(storyLikes)
      .where(
        and(
          eq(storyLikes.storyId, storyId),
          eq(storyLikes.visitorId, visitorId)
        )
      )
      .limit(1);

    let isLiked = false;

    if (existingLike) {
      // Unlike
      await db.delete(storyLikes).where(eq(storyLikes.id, existingLike.id));
      
      await db
        .update(productStories)
        .set({
          likesCount: sql`GREATEST(${productStories.likesCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(productStories.id, storyId));
    } else {
      // Like
      await db.insert(storyLikes).values({
        storyId,
        visitorId,
      });
      
      await db
        .update(productStories)
        .set({
          likesCount: sql`${productStories.likesCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(productStories.id, storyId));
      
      isLiked = true;
    }

    // Get updated count
    const [story] = await db
      .select({ likesCount: productStories.likesCount })
      .from(productStories)
      .where(eq(productStories.id, storyId))
      .limit(1);

    return NextResponse.json({
      success: true,
      isLiked,
      likesCount: story?.likesCount || 0,
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


