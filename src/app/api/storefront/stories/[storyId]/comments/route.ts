/**
 * Story Comments API
 * 
 * ⚡ Performance:
 * - GET: Fetch comments with pagination
 * - POST: Add new comment
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storyComments, productStories } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

// GET - Fetch comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;

    const comments = await db
      .select({
        id: storyComments.id,
        authorName: storyComments.authorName,
        content: storyComments.content,
        createdAt: storyComments.createdAt,
        isApproved: storyComments.isApproved,
      })
      .from(storyComments)
      .where(eq(storyComments.storyId, storyId))
      .orderBy(desc(storyComments.createdAt))
      .limit(50);

    // Only return approved comments
    const approvedComments = comments.filter(c => c.isApproved);

    return NextResponse.json({
      comments: approvedComments.map(c => ({
        id: c.id,
        visitorName: c.authorName,
        content: c.content,
        createdAt: c.createdAt?.toISOString() || new Date().toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const body = await request.json();
    const { visitorName, content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Get visitor ID
    const visitorId = 
      request.cookies.get('visitor_id')?.value ||
      request.headers.get('x-visitor-id') ||
      `anon-${Date.now()}`;

    // Insert comment (pending approval)
    const [comment] = await db
      .insert(storyComments)
      .values({
        storyId,
        visitorId,
        authorName: visitorName?.trim() || 'אורח',
        content: content.trim(),
        isApproved: true, // Auto-approve for now, can be changed later
      })
      .returning();

    // Update comment count
    await db
      .update(productStories)
      .set({
        commentsCount: sql`${productStories.commentsCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(productStories.id, storyId));

    return NextResponse.json({
      success: true,
      comment: {
        id: comment.id,
        visitorName: comment.authorName,
        content: comment.content,
        createdAt: comment.createdAt?.toISOString() || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

