'use client';

/**
 * Advisor Quiz Editor
 * 
 * ⚡ Performance:
 * - useTransition for non-blocking updates
 * - Optimistic UI updates
 * - Debounced auto-save
 * - Minimal re-renders
 */

import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, Save, Eye, Plus, Trash2, ChevronDown, ChevronUp,
  Package, Brain, Settings, HelpCircle, Palette,
} from 'lucide-react';
import {
  updateAdvisorQuiz,
  createAdvisorQuestion,
  updateAdvisorQuestion,
  deleteAdvisorQuestion,
  createAdvisorAnswer,
  updateAdvisorAnswer,
  deleteAdvisorAnswer,
  saveProductRule,
  deleteProductRule,
  regenerateAdvisorSlug,
} from '../actions';

// ============================================
// Types
// ============================================

interface Answer {
  id: string;
  answerText: string;
  answerSubtitle?: string | null;
  imageUrl?: string | null;
  emoji?: string | null;
  color?: string | null;
  position: number;
}

interface Question {
  id: string;
  questionText: string;
  questionSubtitle?: string | null;
  imageUrl?: string | null;
  questionType: string;
  answersLayout: string;
  columns: number;
  isRequired: boolean;
  position: number;
  answers: Answer[];
}

interface Rule {
  id: string;
  productId: string;
  productName?: string;
  answerWeights: { answer_id: string; weight: number }[];
}

interface Quiz {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  subtitle?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  primaryColor: string;
  backgroundColor: string;
  buttonStyle: string;
  startButtonText: string;
  resultsTitle: string;
  resultsSubtitle?: string | null;
  showFloatingButton: boolean;
  showProgressBar: boolean;
  showQuestionNumbers: boolean;
  allowBackNavigation: boolean;
  resultsCount: number;
  questions: Question[];
  rules: Rule[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
}

interface AdvisorEditorProps {
  quiz: Quiz;
  products: Product[];
  storeSlug: string;
}

// ============================================
// Component
// ============================================

export function AdvisorEditor({ quiz: initialQuiz, products, storeSlug }: AdvisorEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // State
  const [quiz, setQuiz] = useState(initialQuiz);
  const [questions, setQuestions] = useState(initialQuiz.questions);
  const [rules, setRules] = useState(initialQuiz.rules);
  const [activeTab, setActiveTab] = useState<'questions' | 'rules' | 'settings'>('questions');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set(initialQuiz.questions.map(q => q.id))
  );
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());
  
  // Rule dialog
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [ruleWeights, setRuleWeights] = useState<Record<string, number>>({});

  // ============================================
  // Quiz Actions
  // ============================================

  const handleSaveQuiz = useCallback(() => {
    startTransition(async () => {
      await updateAdvisorQuiz(quiz.id, {
        title: quiz.title,
        description: quiz.description || undefined,
        subtitle: quiz.subtitle || undefined,
        isActive: quiz.isActive,
        primaryColor: quiz.primaryColor,
        backgroundColor: quiz.backgroundColor,
        buttonStyle: quiz.buttonStyle,
        startButtonText: quiz.startButtonText,
        resultsTitle: quiz.resultsTitle,
        resultsSubtitle: quiz.resultsSubtitle || undefined,
        showFloatingButton: quiz.showFloatingButton,
        showProgressBar: quiz.showProgressBar,
        showQuestionNumbers: quiz.showQuestionNumbers,
        allowBackNavigation: quiz.allowBackNavigation,
        resultsCount: quiz.resultsCount,
      });
      router.refresh();
    });
  }, [quiz, router]);

  // ============================================
  // Question Actions
  // ============================================

  const handleAddQuestion = useCallback(() => {
    const key = 'add-question';
    setSavingItems(prev => new Set(prev).add(key));

    startTransition(async () => {
      const result = await createAdvisorQuestion(quiz.id, {
        questionText: 'שאלה חדשה',
        questionType: 'single',
        answersLayout: 'grid',
        columns: 2,
        isRequired: true,
        position: questions.length,
      });

      if (result.success && result.questionId) {
        const newQuestion: Question = {
          id: result.questionId,
          questionText: 'שאלה חדשה',
          questionType: 'single',
          answersLayout: 'grid',
          columns: 2,
          isRequired: true,
          position: questions.length,
          answers: [],
        };
        setQuestions(prev => [...prev, newQuestion]);
        setExpandedQuestions(prev => new Set(prev).add(result.questionId!));
      }

      setSavingItems(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    });
  }, [quiz.id, questions.length]);

  const handleUpdateQuestion = useCallback((questionId: string, field: string, value: any) => {
    setQuestions(prev =>
      prev.map(q => (q.id === questionId ? { ...q, [field]: value } : q))
    );
  }, []);

  const handleSaveQuestion = useCallback((questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    startTransition(async () => {
      await updateAdvisorQuestion(questionId, {
        questionText: question.questionText,
        questionSubtitle: question.questionSubtitle || undefined,
        questionType: question.questionType,
        answersLayout: question.answersLayout,
        columns: question.columns,
        isRequired: question.isRequired,
      });
    });
  }, [questions]);

  const handleDeleteQuestion = useCallback((questionId: string) => {
    if (!confirm('האם למחוק את השאלה?')) return;

    startTransition(async () => {
      await deleteAdvisorQuestion(questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    });
  }, []);

  // ============================================
  // Answer Actions
  // ============================================

  const handleAddAnswer = useCallback((questionId: string) => {
    const key = `add-answer-${questionId}`;
    setSavingItems(prev => new Set(prev).add(key));

    startTransition(async () => {
      const question = questions.find(q => q.id === questionId);
      const result = await createAdvisorAnswer(questionId, {
        answerText: 'תשובה חדשה',
        position: question?.answers.length || 0,
      });

      if (result.success && result.answerId) {
        setQuestions(prev =>
          prev.map(q =>
            q.id === questionId
              ? {
                  ...q,
                  answers: [
                    ...q.answers,
                    {
                      id: result.answerId!,
                      answerText: 'תשובה חדשה',
                      position: q.answers.length,
                    },
                  ],
                }
              : q
          )
        );
      }

      setSavingItems(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    });
  }, [questions]);

  const handleUpdateAnswer = useCallback(
    (questionId: string, answerId: string, field: string, value: any) => {
      setQuestions(prev =>
        prev.map(q =>
          q.id === questionId
            ? {
                ...q,
                answers: q.answers.map(a =>
                  a.id === answerId ? { ...a, [field]: value } : a
                ),
              }
            : q
        )
      );
    },
    []
  );

  const handleSaveAnswer = useCallback((answerId: string) => {
    const answer = questions.flatMap(q => q.answers).find(a => a.id === answerId);
    if (!answer) return;

    startTransition(async () => {
      await updateAdvisorAnswer(answerId, {
        answerText: answer.answerText,
        answerSubtitle: answer.answerSubtitle || undefined,
        emoji: answer.emoji || undefined,
        color: answer.color || undefined,
      });
    });
  }, [questions]);

  const handleDeleteAnswer = useCallback((questionId: string, answerId: string) => {
    if (!confirm('האם למחוק את התשובה?')) return;

    startTransition(async () => {
      await deleteAdvisorAnswer(answerId);
      setQuestions(prev =>
        prev.map(q =>
          q.id === questionId
            ? { ...q, answers: q.answers.filter(a => a.id !== answerId) }
            : q
        )
      );
    });
  }, []);

  // ============================================
  // Rule Actions
  // ============================================

  const openRuleDialog = useCallback((productId?: string) => {
    if (productId) {
      setSelectedProduct(productId);
      const existingRule = rules.find(r => r.productId === productId);
      if (existingRule?.answerWeights) {
        const weights: Record<string, number> = {};
        for (const w of existingRule.answerWeights) {
          weights[w.answer_id] = w.weight;
        }
        setRuleWeights(weights);
      } else {
        setRuleWeights({});
      }
    } else {
      setSelectedProduct(null);
      setRuleWeights({});
    }
    setShowRuleDialog(true);
  }, [rules]);

  const handleSaveRule = useCallback(() => {
    if (!selectedProduct) return;

    startTransition(async () => {
      const answerWeights = Object.entries(ruleWeights)
        .filter(([_, weight]) => weight > 0)
        .map(([answerId, weight]) => ({ answerId, weight }));

      await saveProductRule(quiz.id, selectedProduct, answerWeights);

      // Update local rules
      const product = products.find(p => p.id === selectedProduct);
      const existingRuleIndex = rules.findIndex(r => r.productId === selectedProduct);

      if (existingRuleIndex >= 0) {
        setRules(prev =>
          prev.map((r, i) =>
            i === existingRuleIndex
              ? { ...r, answerWeights: answerWeights.map(w => ({ answer_id: w.answerId, weight: w.weight })) }
              : r
          )
        );
      } else {
        setRules(prev => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            productId: selectedProduct,
            productName: product?.name,
            answerWeights: answerWeights.map(w => ({ answer_id: w.answerId, weight: w.weight })),
          },
        ]);
      }

      setShowRuleDialog(false);
    });
  }, [selectedProduct, ruleWeights, quiz.id, products, rules]);

  const handleDeleteRule = useCallback((ruleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('האם למחוק את המוצר מרשימת ההתאמות?')) return;

    startTransition(async () => {
      await deleteProductRule(ruleId);
      setRules(prev => prev.filter(r => r.id !== ruleId));
    });
  }, []);

  const toggleQuestion = useCallback((questionId: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }, []);

  // ============================================
  // Render
  // ============================================

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/shops/${storeSlug}/admin/plugins/smart-advisor`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-semibold">{quiz.title}</h1>
              <p className="text-sm text-gray-500">עריכת יועץ חכם</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/shops/${storeSlug}/advisor/${quiz.slug}`}
              target="_blank"
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                quiz.isActive ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={e => !quiz.isActive && e.preventDefault()}
            >
              <Eye className="h-4 w-4" />
              תצוגה מקדימה
            </a>
            <button
              onClick={handleSaveQuiz}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isPending ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'questions'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            שאלות ותשובות
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'rules'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package className="h-4 w-4" />
            התאמת מוצרים
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="h-4 w-4" />
            הגדרות
          </button>
        </div>

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {questions.map((question, qIndex) => (
              <div key={question.id} className="bg-white rounded-xl border overflow-hidden">
                {/* Question Header */}
                <div
                  className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleQuestion(question.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                      {qIndex + 1}
                    </span>
                    <span className="font-medium">{question.questionText}</span>
                    <span className="text-sm text-gray-500">
                      ({question.answers.length} תשובות)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteQuestion(question.id);
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {expandedQuestions.has(question.id) ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Question Content */}
                {expandedQuestions.has(question.id) && (
                  <div className="p-4 space-y-4">
                    {/* Question Text */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          טקסט השאלה
                        </label>
                        <input
                          type="text"
                          value={question.questionText}
                          onChange={e =>
                            handleUpdateQuestion(question.id, 'questionText', e.target.value)
                          }
                          onBlur={() => handleSaveQuestion(question.id)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          כותרת משנה (אופציונלי)
                        </label>
                        <input
                          type="text"
                          value={question.questionSubtitle || ''}
                          onChange={e =>
                            handleUpdateQuestion(question.id, 'questionSubtitle', e.target.value)
                          }
                          onBlur={() => handleSaveQuestion(question.id)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    {/* Answers Section */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold">תשובות</label>
                        <button
                          onClick={() => handleAddAnswer(question.id)}
                          disabled={savingItems.has(`add-answer-${question.id}`)}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4" />
                          הוסף תשובה
                        </button>
                      </div>

                      {/* Answers List */}
                      <div className="space-y-2">
                        {question.answers.map((answer, aIndex) => (
                          <div
                            key={answer.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <span className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-xs font-medium">
                              {aIndex + 1}
                            </span>
                            <input
                              type="text"
                              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                              value={answer.answerText}
                              onChange={e =>
                                handleUpdateAnswer(
                                  question.id,
                                  answer.id,
                                  'answerText',
                                  e.target.value
                                )
                              }
                              onBlur={() => handleSaveAnswer(answer.id)}
                              placeholder="טקסט התשובה"
                            />
                            <input
                              type="text"
                              className="w-16 px-3 py-2 border rounded-lg text-center"
                              value={answer.emoji || ''}
                              onChange={e =>
                                handleUpdateAnswer(
                                  question.id,
                                  answer.id,
                                  'emoji',
                                  e.target.value
                                )
                              }
                              onBlur={() => handleSaveAnswer(answer.id)}
                              placeholder="😀"
                            />
                            <button
                              onClick={() => handleDeleteAnswer(question.id, answer.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}

                        {question.answers.length === 0 && (
                          <p className="text-center text-gray-400 py-4">
                            אין תשובות. לחץ "הוסף תשובה" להוספת תשובה ראשונה.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add Question Button */}
            <button
              onClick={handleAddQuestion}
              disabled={savingItems.has('add-question')}
              className="w-full py-3 border-2 border-dashed rounded-xl text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="h-5 w-5" />
              הוסף שאלה חדשה
            </button>
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold">התאמת מוצרים לתשובות</h2>
            </div>
            <p className="text-gray-600 mb-4">
              בחר מוצר והגדר משקל לכל תשובה. המוצרים עם הציון הגבוה ביותר יוצגו ללקוח.
            </p>
            <button
              onClick={() => openRuleDialog()}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              הוסף כלל התאמה
            </button>

            {/* Existing Rules */}
            {rules.length > 0 && (
              <div className="mt-4 space-y-2">
                {rules.map(rule => (
                  <div
                    key={rule.id}
                    onClick={() => openRuleDialog(rule.productId)}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group"
                  >
                    <span className="font-medium">{rule.productName || 'מוצר לא ידוע'}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {rule.answerWeights?.length || 0} כללים
                      </span>
                      <button
                        onClick={(e) => handleDeleteRule(rule.id, e)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="מחק מהרשימה"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl border p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold">הגדרות כלליות</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם השאלון
                </label>
                <input
                  type="text"
                  value={quiz.title}
                  onChange={e => setQuiz({ ...quiz, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
                <input
                  type="text"
                  value={quiz.description || ''}
                  onChange={e => setQuiz({ ...quiz, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Slug / URL */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                קישור לשאלון
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 px-3 py-2 bg-white border rounded-lg text-gray-600 text-sm font-mono" dir="ltr">
                  /shops/{storeSlug}/advisor/{quiz.slug}
                </div>
                <button
                  onClick={async () => {
                    if (!confirm('האם לייצר קישור חדש? הקישור הישן יפסיק לעבוד.')) return;
                    startTransition(async () => {
                      const result = await regenerateAdvisorSlug(quiz.id);
                      if (result.success && result.newSlug) {
                        setQuiz({ ...quiz, slug: result.newSlug });
                        alert('הקישור עודכן בהצלחה!');
                      } else {
                        alert(result.error || 'שגיאה בעדכון');
                      }
                    });
                  }}
                  disabled={isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm cursor-pointer"
                >
                  צור קישור חדש
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                אם הקישור מכיל תווים לא תקינים, לחץ על "צור קישור חדש" לייצור קישור תקין
              </p>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>שאלון פעיל</span>
                <input
                  type="checkbox"
                  checked={quiz.isActive}
                  onChange={e => setQuiz({ ...quiz, isActive: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>הצג כפתור צף בדף הבית</span>
                <input
                  type="checkbox"
                  checked={quiz.showFloatingButton}
                  onChange={e => setQuiz({ ...quiz, showFloatingButton: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>הצג סרגל התקדמות</span>
                <input
                  type="checkbox"
                  checked={quiz.showProgressBar}
                  onChange={e => setQuiz({ ...quiz, showProgressBar: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>הצג מספור שאלות</span>
                <input
                  type="checkbox"
                  checked={quiz.showQuestionNumbers}
                  onChange={e => setQuiz({ ...quiz, showQuestionNumbers: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>אפשר חזרה אחורה</span>
                <input
                  type="checkbox"
                  checked={quiz.allowBackNavigation}
                  onChange={e => setQuiz({ ...quiz, allowBackNavigation: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">צבע ראשי</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={quiz.primaryColor}
                    onChange={e => setQuiz({ ...quiz, primaryColor: e.target.value })}
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={quiz.primaryColor}
                    onChange={e => setQuiz({ ...quiz, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                    dir="ltr"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">צבע רקע</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={quiz.backgroundColor}
                    onChange={e => setQuiz({ ...quiz, backgroundColor: e.target.value })}
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={quiz.backgroundColor}
                    onChange={e => setQuiz({ ...quiz, backgroundColor: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* CTA Texts */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  טקסט כפתור התחלה
                </label>
                <input
                  type="text"
                  value={quiz.startButtonText}
                  onChange={e => setQuiz({ ...quiz, startButtonText: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  כותרת תוצאות
                </label>
                <input
                  type="text"
                  value={quiz.resultsTitle}
                  onChange={e => setQuiz({ ...quiz, resultsTitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rule Dialog */}
      {showRuleDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">הגדרת כללי התאמה למוצר</h2>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">בחר מוצר</label>
                <select
                  value={selectedProduct || ''}
                  onChange={e => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">בחר מוצר...</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && questions.length > 0 && (
                <div className="space-y-4 mt-4">
                  <p className="text-sm font-medium">קבע משקל לכל תשובה (0-100):</p>
                  {questions.map(question => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <p className="font-medium mb-3">{question.questionText}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {question.answers.map(answer => (
                          <div key={answer.id} className="flex items-center gap-2">
                            <span className="text-sm flex-1">
                              {answer.emoji && <span className="ml-1">{answer.emoji}</span>}
                              {answer.answerText}
                            </span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="w-20 px-2 py-1 border rounded text-center"
                              value={ruleWeights[answer.id] || 0}
                              onChange={e =>
                                setRuleWeights({
                                  ...ruleWeights,
                                  [answer.id]: parseInt(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                onClick={() => setShowRuleDialog(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleSaveRule}
                disabled={isPending || !selectedProduct}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isPending ? 'שומר...' : 'שמור'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

