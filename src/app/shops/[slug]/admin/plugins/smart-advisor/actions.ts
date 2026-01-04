'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { 
  advisorQuizzes, 
  advisorQuestions, 
  advisorAnswers, 
  advisorProductRules,
  storePlugins,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Helper to generate URL-safe slug (ASCII only for proper URL handling)
function generateSlug(title: string): string {
  // Generate a random ID for URL-safe slug
  const randomId = Math.random().toString(36).substring(2, 10);
  // Transliterate common characters and clean
  const cleaned = title
    .toLowerCase()
    .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 20);
  return cleaned ? `${cleaned}-${randomId}` : `quiz-${randomId}`;
}

// ============================================
// Quiz Actions
// ============================================

export async function createAdvisorQuiz(
  storeId: string,
  title: string,
  description?: string
): Promise<{ success: boolean; quizId?: string; error?: string }> {
  try {
    const slug = generateSlug(title);

    const [quiz] = await db.insert(advisorQuizzes).values({
      storeId,
      title,
      slug,
      description: description || null,
      isActive: false,
    }).returning({ id: advisorQuizzes.id });

    return { success: true, quizId: quiz.id };
  } catch (error) {
    console.error('Error creating advisor quiz:', error);
    return { success: false, error: 'שגיאה ביצירת היועץ' };
  }
}

export async function updateAdvisorQuiz(
  quizId: string,
  data: {
    title?: string;
    description?: string;
    subtitle?: string;
    imageUrl?: string;
    isActive?: boolean;
    primaryColor?: string;
    backgroundColor?: string;
    buttonStyle?: string;
    startButtonText?: string;
    resultsTitle?: string;
    resultsSubtitle?: string;
    showFloatingButton?: boolean;
    showProgressBar?: boolean;
    showQuestionNumbers?: boolean;
    allowBackNavigation?: boolean;
    resultsCount?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.update(advisorQuizzes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(advisorQuizzes.id, quizId));

    return { success: true };
  } catch (error) {
    console.error('Error updating advisor quiz:', error);
    return { success: false, error: 'שגיאה בעדכון היועץ' };
  }
}

export async function toggleAdvisorActive(
  quizId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.update(advisorQuizzes)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(advisorQuizzes.id, quizId));

    return { success: true };
  } catch (error) {
    console.error('Error toggling advisor active:', error);
    return { success: false, error: 'שגיאה בעדכון הסטטוס' };
  }
}

export async function deleteAdvisorQuiz(
  quizId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(advisorQuizzes).where(eq(advisorQuizzes.id, quizId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting advisor quiz:', error);
    return { success: false, error: 'שגיאה במחיקת היועץ' };
  }
}

export async function regenerateAdvisorSlug(
  quizId: string
): Promise<{ success: boolean; newSlug?: string; error?: string }> {
  try {
    // Get current quiz
    const [quiz] = await db
      .select({ title: advisorQuizzes.title })
      .from(advisorQuizzes)
      .where(eq(advisorQuizzes.id, quizId))
      .limit(1);

    if (!quiz) {
      return { success: false, error: 'היועץ לא נמצא' };
    }

    // Generate new URL-safe slug
    const newSlug = generateSlug(quiz.title);

    await db.update(advisorQuizzes)
      .set({ slug: newSlug, updatedAt: new Date() })
      .where(eq(advisorQuizzes.id, quizId));

    return { success: true, newSlug };
  } catch (error) {
    console.error('Error regenerating advisor slug:', error);
    return { success: false, error: 'שגיאה בעדכון הקישור' };
  }
}

// ============================================
// Question Actions
// ============================================

export async function createAdvisorQuestion(
  quizId: string,
  data: {
    questionText: string;
    questionSubtitle?: string;
    questionType?: 'single' | 'multiple';
    answersLayout?: 'grid' | 'list' | 'cards';
    columns?: number;
    isRequired?: boolean;
    position?: number;
  }
): Promise<{ success: boolean; questionId?: string; error?: string }> {
  try {
    const [question] = await db.insert(advisorQuestions).values({
      quizId,
      questionText: data.questionText,
      questionSubtitle: data.questionSubtitle || null,
      questionType: data.questionType || 'single',
      answersLayout: data.answersLayout || 'grid',
      columns: data.columns || 2,
      isRequired: data.isRequired ?? true,
      position: data.position || 0,
    }).returning({ id: advisorQuestions.id });

    return { success: true, questionId: question.id };
  } catch (error) {
    console.error('Error creating advisor question:', error);
    return { success: false, error: 'שגיאה בהוספת שאלה' };
  }
}

export async function updateAdvisorQuestion(
  questionId: string,
  data: {
    questionText?: string;
    questionSubtitle?: string;
    questionType?: string;
    answersLayout?: string;
    columns?: number;
    isRequired?: boolean;
    position?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.update(advisorQuestions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(advisorQuestions.id, questionId));

    return { success: true };
  } catch (error) {
    console.error('Error updating advisor question:', error);
    return { success: false, error: 'שגיאה בעדכון השאלה' };
  }
}

export async function deleteAdvisorQuestion(
  questionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(advisorQuestions).where(eq(advisorQuestions.id, questionId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting advisor question:', error);
    return { success: false, error: 'שגיאה במחיקת השאלה' };
  }
}

// ============================================
// Answer Actions
// ============================================

export async function createAdvisorAnswer(
  questionId: string,
  data: {
    answerText: string;
    answerSubtitle?: string;
    imageUrl?: string;
    emoji?: string;
    color?: string;
    position?: number;
  }
): Promise<{ success: boolean; answerId?: string; error?: string }> {
  try {
    const [answer] = await db.insert(advisorAnswers).values({
      questionId,
      answerText: data.answerText,
      answerSubtitle: data.answerSubtitle || null,
      imageUrl: data.imageUrl || null,
      emoji: data.emoji || null,
      color: data.color || null,
      position: data.position || 0,
    }).returning({ id: advisorAnswers.id });

    return { success: true, answerId: answer.id };
  } catch (error) {
    console.error('Error creating advisor answer:', error);
    return { success: false, error: 'שגיאה בהוספת תשובה' };
  }
}

export async function updateAdvisorAnswer(
  answerId: string,
  data: {
    answerText?: string;
    answerSubtitle?: string;
    imageUrl?: string;
    emoji?: string;
    color?: string;
    position?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.update(advisorAnswers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(advisorAnswers.id, answerId));

    return { success: true };
  } catch (error) {
    console.error('Error updating advisor answer:', error);
    return { success: false, error: 'שגיאה בעדכון התשובה' };
  }
}

export async function deleteAdvisorAnswer(
  answerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(advisorAnswers).where(eq(advisorAnswers.id, answerId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting advisor answer:', error);
    return { success: false, error: 'שגיאה במחיקת התשובה' };
  }
}

// ============================================
// Product Rules Actions
// ============================================

export async function saveProductRule(
  quizId: string,
  productId: string,
  answerWeights: { answerId: string; weight: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if rule exists
    const existing = await db.query.advisorProductRules.findFirst({
      where: (rules, { and, eq }) => and(
        eq(rules.quizId, quizId),
        eq(rules.productId, productId)
      ),
    });

    if (existing) {
      // Update
      await db.update(advisorProductRules)
        .set({
          answerWeights: answerWeights.map(w => ({
            answer_id: w.answerId,
            weight: w.weight,
          })),
          updatedAt: new Date(),
        })
        .where(eq(advisorProductRules.id, existing.id));
    } else {
      // Create
      await db.insert(advisorProductRules).values({
        quizId,
        productId,
        answerWeights: answerWeights.map(w => ({
          answer_id: w.answerId,
          weight: w.weight,
        })),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving product rule:', error);
    return { success: false, error: 'שגיאה בשמירת הכללים' };
  }
}

export async function deleteProductRule(
  ruleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(advisorProductRules).where(eq(advisorProductRules.id, ruleId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting product rule:', error);
    return { success: false, error: 'שגיאה במחיקת הכלל' };
  }
}

// ============================================
// Plugin Settings Actions
// ============================================

export async function updateAdvisorSettings(
  storeId: string,
  settings: {
    floatingButtonPosition?: 'left' | 'right';
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current plugin
    const [plugin] = await db
      .select()
      .from(storePlugins)
      .where(
        and(
          eq(storePlugins.storeId, storeId),
          eq(storePlugins.pluginSlug, 'smart-advisor')
        )
      )
      .limit(1);

    if (!plugin) {
      return { success: false, error: 'התוסף לא מותקן' };
    }

    // Merge with existing config
    const currentConfig = (plugin.config as Record<string, unknown>) || {};
    const newConfig = {
      ...currentConfig,
      ...settings,
    };

    // Update
    await db
      .update(storePlugins)
      .set({
        config: newConfig,
        updatedAt: new Date(),
      })
      .where(eq(storePlugins.id, plugin.id));

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating advisor settings:', error);
    return { success: false, error: 'שגיאה בשמירת ההגדרות' };
  }
}


