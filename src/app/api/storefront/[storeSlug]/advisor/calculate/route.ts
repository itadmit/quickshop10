/**
 * POST /api/storefront/[storeSlug]/advisor/calculate
 * 
 * Calculates product recommendations based on quiz answers
 * 
 * ⚡ Performance (REQUIREMENTS.md compliant):
 * - Single batch query for images (no N+1!)
 * - Efficient scoring algorithm
 * - Fire-and-forget session tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  stores, 
  advisorQuizzes, 
  advisorProductRules, 
  advisorSessions,
  productImages,
} from '@/lib/db/schema';
import { eq, inArray, and, desc } from 'drizzle-orm';

interface SessionAnswer {
  questionId: string;
  answerIds: string[];
}

interface AnswerWeight {
  answer_id: string;
  weight: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const body = await request.json();
    const { quizId, answers } = body as { 
      quizId: string; 
      answers: SessionAnswer[];
    };

    if (!quizId || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get store and quiz in parallel
    const [store, quiz] = await Promise.all([
      db.query.stores.findFirst({
        where: eq(stores.slug, storeSlug),
        columns: { id: true },
      }),
      db.query.advisorQuizzes.findFirst({
        where: eq(advisorQuizzes.id, quizId),
        columns: { id: true, resultsCount: true, storeId: true },
      }),
    ]);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (!quiz || quiz.storeId !== store.id) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Get all selected answer IDs
    const selectedAnswerIds = answers.flatMap(a => a.answerIds);

    // Get product rules with products
    const rules = await db.query.advisorProductRules.findMany({
      where: and(
        eq(advisorProductRules.quizId, quizId),
        eq(advisorProductRules.isActive, true)
      ),
      with: {
        product: {
          columns: {
            id: true,
            name: true,
            slug: true,
            price: true,
            comparePrice: true,
          },
        },
      },
    });

    // Get all product IDs that have rules
    const productIds = rules
      .filter(r => r.product)
      .map(r => r.productId);

    // ⚡ BATCH: Get all product images in ONE query (not N+1!)
    const allImages = productIds.length > 0 
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
            isPrimary: productImages.isPrimary,
          })
          .from(productImages)
          .where(inArray(productImages.productId, productIds))
          .orderBy(desc(productImages.isPrimary))
      : [];

    // Create image map (productId -> url)
    const imageMap = new Map<string, string>();
    for (const img of allImages) {
      // Only set if not already set (first one is primary due to ordering)
      if (!imageMap.has(img.productId)) {
        imageMap.set(img.productId, img.url);
      }
    }

    // Calculate scores for each product
    const scoredProducts: {
      productId: string;
      name: string;
      handle: string;
      price: number;
      comparePrice: number | null;
      imageUrl: string | null;
      score: number;
      maxScore: number;
    }[] = [];

    for (const rule of rules) {
      if (!rule.product) continue;

      const answerWeights = rule.answerWeights as AnswerWeight[];
      let score = rule.baseScore || 0;
      let maxScore = rule.baseScore || 0;

      // Calculate score based on selected answers
      for (const weight of answerWeights) {
        maxScore += weight.weight;
        if (selectedAnswerIds.includes(weight.answer_id)) {
          score += weight.weight;
        }
      }

      // Check bonus rules
      if (rule.bonusRules) {
        const bonusRule = rule.bonusRules as { all_answers: string[]; bonus: number };
        if (bonusRule.all_answers && bonusRule.bonus) {
          const allSelected = bonusRule.all_answers.every(id =>
            selectedAnswerIds.includes(id)
          );
          if (allSelected) {
            score += bonusRule.bonus;
            maxScore += bonusRule.bonus;
          }
        }
      }

      // Check exclusions
      const excludeAnswers = (rule.excludeIfAnswers as string[]) || [];
      const shouldExclude = excludeAnswers.some(id => selectedAnswerIds.includes(id));

      if (!shouldExclude && score > 0) {
        scoredProducts.push({
          productId: rule.product.id,
          name: rule.product.name,
          handle: rule.product.slug,
          price: Number(rule.product.price),
          comparePrice: rule.product.comparePrice ? Number(rule.product.comparePrice) : null,
          imageUrl: imageMap.get(rule.product.id) || null,
          score: score + (rule.priorityBoost || 0),
          maxScore,
        });
      }
    }

    // Sort by score and get top results
    scoredProducts.sort((a, b) => b.score - a.score);
    const topResults = scoredProducts.slice(0, quiz.resultsCount || 3);

    // Calculate match percentage
    const results = topResults.map(product => ({
      productId: product.productId,
      title: product.name,
      handle: product.handle,
      imageUrl: product.imageUrl,
      price: product.price,
      compareAtPrice: product.comparePrice,
      matchPercentage: Math.round((product.score / Math.max(product.maxScore, 1)) * 100),
    }));

    // Generate session ID
    const sessionId = `advisor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Fire-and-forget: Save session, update quiz stats, and answer statistics (don't block response!)
    (async () => {
      try {
        // Prepare all updates
        const updatePromises = [
          // Save session
          db.insert(advisorSessions).values({
            quizId,
            sessionId,
            answers: answers.map(a => ({
              question_id: a.questionId,
              answer_ids: a.answerIds,
            })),
            recommendedProducts: results.map(r => ({
              product_id: r.productId,
              score: r.matchPercentage,
            })),
            isCompleted: true,
            completedAt: new Date(),
          }),
          // Update quiz stats
          db.execute(`
            UPDATE advisor_quizzes 
            SET total_completions = total_completions + 1, updated_at = NOW() 
            WHERE id = '${quizId}'
          `),
        ];
        
        // Increment selection counts for each selected answer (efficient batch update)
        if (selectedAnswerIds.length > 0) {
          // Use a single SQL statement to increment all selected answers
          const answerIdsStr = selectedAnswerIds.map(id => `'${id}'`).join(',');
          updatePromises.push(
            db.execute(`
              UPDATE advisor_answers 
              SET total_selections = total_selections + 1 
              WHERE id IN (${answerIdsStr})
            `)
          );
        }
        
        await Promise.all(updatePromises);
      } catch (error) {
        console.error('Error saving advisor session:', error);
      }
    })();

    return NextResponse.json({
      results,
      sessionId,
      totalProductsMatched: scoredProducts.length,
    });
  } catch (error) {
    console.error('Error calculating advisor results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
