/**
 * Story View API - Record story view
 * 
 * ⚡ Fire-and-forget - non-blocking
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productStories, storyViews } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

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

    // Try to insert view (unique constraint will prevent duplicates)
    try {
      await db.insert(storyViews).values({
        storyId,
        visitorId,
      });

      // Increment view count
      await db
        .update(productStories)
        .set({
          viewsCount: sql`${productStories.viewsCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(productStories.id, storyId));
    } catch {
      // Duplicate view - ignore
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording view:', error);
    return NextResponse.json({ success: true }); // Don't fail the client
  }
}


