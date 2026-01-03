/**
 * Smart Advisor Admin Page
 * 
 * ⚡ Performance:
 * - Server Component fetches data
 * - Client component for interactions
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stores, advisorQuizzes } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { AdvisorList } from './advisor-list';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SmartAdvisorPage({ params }: PageProps) {
  const { slug } = await params;
  
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

  // Fetch quizzes with question count
  const quizzes = await db.query.advisorQuizzes.findMany({
    where: eq(advisorQuizzes.storeId, store.id),
    orderBy: [desc(advisorQuizzes.createdAt)],
    with: {
      questions: true,
    },
  });

  // Transform for client
  const quizzesData = quizzes.map(quiz => ({
    id: quiz.id,
    title: quiz.title,
    slug: quiz.slug,
    description: quiz.description,
    isActive: quiz.isActive,
    questionsCount: quiz.questions?.length || 0,
    totalStarts: quiz.totalStarts,
    totalCompletions: quiz.totalCompletions,
    createdAt: quiz.createdAt.toISOString(),
  }));

  return (
    <AdvisorList 
      quizzes={quizzesData} 
      storeSlug={slug}
      storeId={store.id}
    />
  );
}


