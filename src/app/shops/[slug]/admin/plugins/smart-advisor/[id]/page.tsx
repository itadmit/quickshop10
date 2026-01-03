/**
 * Advisor Quiz Editor Page
 * 
 * ⚡ Performance:
 * - Server Component fetches data
 * - Client component for editing
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stores, advisorQuizzes, products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { AdvisorEditor } from './advisor-editor';

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function AdvisorEditorPage({ params }: PageProps) {
  const { slug, id } = await params;
  
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  // Get store
  const store = await db.query.stores.findFirst({
    where: eq(stores.slug, slug),
  });

  if (!store) {
    redirect('/');
  }

  // Fetch quiz with questions, answers, and rules
  const quiz = await db.query.advisorQuizzes.findFirst({
    where: eq(advisorQuizzes.id, id),
    with: {
      questions: {
        with: {
          answers: true,
        },
        orderBy: (questions, { asc }) => [asc(questions.position)],
      },
      rules: {
        with: {
          product: true,
        },
      },
    },
  });

  if (!quiz) {
    redirect(`/shops/${slug}/admin/plugins/smart-advisor`);
  }

  // Fetch all products for rule assignment
  const storeProducts = await db.query.products.findMany({
    where: eq(products.storeId, store.id),
    columns: {
      id: true,
      name: true,
      slug: true,
      price: true,
    },
  });

  // Transform data for client
  const quizData = {
    id: quiz.id,
    title: quiz.title,
    slug: quiz.slug,
    description: quiz.description,
    subtitle: quiz.subtitle,
    imageUrl: quiz.imageUrl,
    isActive: quiz.isActive,
    primaryColor: quiz.primaryColor,
    backgroundColor: quiz.backgroundColor,
    buttonStyle: quiz.buttonStyle,
    startButtonText: quiz.startButtonText,
    resultsTitle: quiz.resultsTitle,
    resultsSubtitle: quiz.resultsSubtitle,
    showFloatingButton: quiz.showFloatingButton,
    showProgressBar: quiz.showProgressBar,
    showQuestionNumbers: quiz.showQuestionNumbers,
    allowBackNavigation: quiz.allowBackNavigation,
    resultsCount: quiz.resultsCount,
    questions: quiz.questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      questionSubtitle: q.questionSubtitle,
      imageUrl: q.imageUrl,
      questionType: q.questionType,
      answersLayout: q.answersLayout,
      columns: q.columns,
      isRequired: q.isRequired,
      position: q.position,
      answers: q.answers.map(a => ({
        id: a.id,
        answerText: a.answerText,
        answerSubtitle: a.answerSubtitle,
        imageUrl: a.imageUrl,
        emoji: a.emoji,
        color: a.color,
        position: a.position,
      })),
    })),
    rules: quiz.rules.map(r => ({
      id: r.id,
      productId: r.productId,
      productName: r.product?.name,
      answerWeights: r.answerWeights as { answer_id: string; weight: number }[],
    })),
  };

  const productsData = storeProducts.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
  }));

  return (
    <AdvisorEditor
      quiz={quizData}
      products={productsData}
      storeSlug={slug}
    />
  );
}


