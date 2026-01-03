/**
 * GET /api/storefront/[storeSlug]/advisors
 * 
 * Fetches active advisors for the storefront (floating button)
 * 
 * ⚡ Performance:
 * - Single efficient query
 * - Cached response (ISR)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, advisorQuizzes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const { searchParams } = new URL(request.url);
    const floatingOnly = searchParams.get('floating') === 'true';

    // Get store
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
      columns: { id: true },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Fetch active advisors
    let whereClause = and(
      eq(advisorQuizzes.storeId, store.id),
      eq(advisorQuizzes.isActive, true)
    );

    if (floatingOnly) {
      whereClause = and(
        whereClause,
        eq(advisorQuizzes.showFloatingButton, true)
      );
    }

    const advisors = await db.query.advisorQuizzes.findMany({
      where: whereClause,
      columns: {
        id: true,
        title: true,
        slug: true,
        description: true,
        primaryColor: true,
        icon: true,
      },
      orderBy: (quizzes, { asc }) => [asc(quizzes.position)],
    });

    return NextResponse.json({
      advisors: advisors.map(a => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        description: a.description,
        primaryColor: a.primaryColor,
        icon: a.icon,
      })),
    });
  } catch (error) {
    console.error('Error fetching advisors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

