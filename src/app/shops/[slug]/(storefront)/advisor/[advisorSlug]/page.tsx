/**
 * Advisor Quiz Page (Storefront)
 * 
 * ⚡ Performance:
 * - Server Component fetches all data
 * - Client component only for interactions
 * - Incremental tracking (fire-and-forget)
 */

import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { stores, advisorQuizzes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { AdvisorWizard } from '@/components/storefront/advisor-wizard';

interface PageProps {
  params: Promise<{ slug: string; advisorSlug: string }>;
}

export default async function AdvisorPage({ params }: PageProps) {
  const { slug, advisorSlug } = await params;

  // Get store
  const store = await db.query.stores.findFirst({
    where: eq(stores.slug, slug),
    columns: { id: true },
  });

  if (!store) {
    notFound();
  }

  // Fetch quiz with questions and answers
  const quiz = await db.query.advisorQuizzes.findFirst({
    where: and(
      eq(advisorQuizzes.storeId, store.id),
      eq(advisorQuizzes.slug, advisorSlug),
      eq(advisorQuizzes.isActive, true)
    ),
    with: {
      questions: {
        with: {
          answers: {
            orderBy: (answers, { asc }) => [asc(answers.position)],
          },
        },
        orderBy: (questions, { asc }) => [asc(questions.position)],
      },
    },
  });

  if (!quiz) {
    notFound();
  }

  // Fire-and-forget: Increment start count
  (async () => {
    try {
      await db.execute(`
        UPDATE advisor_quizzes 
        SET total_starts = total_starts + 1, updated_at = NOW() 
        WHERE id = '${quiz.id}'
      `);
    } catch (error) {
      console.error('Error incrementing quiz starts:', error);
    }
  })();

  // Transform for client component
  const quizData = {
    id: quiz.id,
    title: quiz.title,
    slug: quiz.slug,
    description: quiz.description || undefined,
    subtitle: quiz.subtitle || undefined,
    imageUrl: quiz.imageUrl || undefined,
    primaryColor: quiz.primaryColor,
    backgroundColor: quiz.backgroundColor,
    buttonStyle: quiz.buttonStyle as 'rounded' | 'square' | 'pill',
    startButtonText: quiz.startButtonText,
    resultsTitle: quiz.resultsTitle,
    resultsSubtitle: quiz.resultsSubtitle || undefined,
    showProgressBar: quiz.showProgressBar,
    showQuestionNumbers: quiz.showQuestionNumbers,
    allowBackNavigation: quiz.allowBackNavigation,
    questions: quiz.questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      questionSubtitle: q.questionSubtitle || undefined,
      imageUrl: q.imageUrl || undefined,
      questionType: q.questionType as 'single' | 'multiple',
      answersLayout: q.answersLayout as 'grid' | 'list' | 'cards',
      columns: q.columns,
      isRequired: q.isRequired,
      answers: q.answers.map(a => ({
        id: a.id,
        answerText: a.answerText,
        answerSubtitle: a.answerSubtitle || undefined,
        imageUrl: a.imageUrl || undefined,
        emoji: a.emoji || undefined,
        color: a.color || undefined,
        position: a.position,
      })),
    })),
  };

  return <AdvisorWizard quiz={quizData} storeSlug={slug} />;
}

