/**
 * Advisor Wizard - שאלון יועץ חכם
 * 
 * ⚡ Performance:
 * - CSS animations (no external animation libraries)
 * - Optimistic UI for answers
 * - Lazy loading of results
 * - Fire-and-forget session tracking
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronLeft, ChevronRight, ShoppingCart, Check,
  Sparkles, Brain, Zap, Target, Loader2,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface AdvisorAnswer {
  id: string;
  answerText: string;
  answerSubtitle?: string;
  imageUrl?: string;
  icon?: string;
  emoji?: string;
  color?: string;
  position: number;
}

interface AdvisorQuestion {
  id: string;
  questionText: string;
  questionSubtitle?: string;
  imageUrl?: string;
  questionType: 'single' | 'multiple';
  answersLayout: 'grid' | 'list' | 'cards';
  columns: number;
  isRequired: boolean;
  answers: AdvisorAnswer[];
}

interface AdvisorQuiz {
  id: string;
  title: string;
  slug: string;
  description?: string;
  subtitle?: string;
  imageUrl?: string;
  primaryColor: string;
  backgroundColor: string;
  buttonStyle: 'rounded' | 'square' | 'pill';
  startButtonText: string;
  resultsTitle: string;
  resultsSubtitle?: string;
  showProgressBar: boolean;
  showQuestionNumbers: boolean;
  allowBackNavigation: boolean;
  questions: AdvisorQuestion[];
}

interface AdvisorResult {
  productId: string;
  title: string;
  handle: string;
  imageUrl?: string;
  price: number;
  compareAtPrice?: number;
  matchPercentage: number;
  matchReasons?: string[];
}

interface AdvisorWizardProps {
  quiz: AdvisorQuiz;
  storeSlug: string;
  basePath: string;
  onComplete?: (results: AdvisorResult[]) => void;
  onAddToCart?: (productId: string) => void;
}

// ============================================
// AI Loading Steps
// ============================================

const AI_LOADING_STEPS = [
  { text: 'קבלתי את התשובות שלך', Icon: Check },
  { text: 'מנתח את ההעדפות שלך', Icon: Brain },
  { text: 'הבנתי, מחפש התאמות', Icon: Target },
  { text: 'מתכונן להצגה', Icon: Sparkles },
];

const AI_RESPONSE_PHRASES = [
  'על סמך הניתוח שלי',
  'בהתאם להעדפות שלך',
  'לאחר בחינת הנתונים',
  'המלצה אישית עבורך',
];

// ============================================
// AI Thinking Loader Component
// ============================================

function AIThinkingLoader({ primaryColor }: { primaryColor: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState('');

  // Progress through steps - faster animation
  useEffect(() => {
    if (currentStep < AI_LOADING_STEPS.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 800); // ⚡ Reduced from 1500ms
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Animate dots
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(dotsInterval);
  }, []);

  const CurrentIcon = AI_LOADING_STEPS[currentStep].Icon;

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Brain icon with animation */}
      <div className="relative mb-10 w-32 h-32 flex items-center justify-center">
        {/* Animated circles */}
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{ backgroundColor: primaryColor, opacity: 0.08 }}
        />
        <div
          className="absolute inset-2 rounded-full animate-ping"
          style={{ backgroundColor: primaryColor, opacity: 0.06, animationDuration: '2s' }}
        />

        {/* Main brain icon */}
        <div
          className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Brain className="h-10 w-10" style={{ color: primaryColor }} />
        </div>

        {/* Floating sparkle */}
        <div className="absolute top-0 right-2 z-20 animate-bounce">
          <Sparkles className="h-5 w-5" style={{ color: primaryColor }} />
        </div>
      </div>

      {/* Current step text */}
      <div
        key={currentStep}
        className="flex items-center justify-center gap-3 min-h-[60px] animate-in fade-in slide-in-from-bottom-3 duration-300"
        dir="rtl"
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center animate-pulse"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <CurrentIcon className="h-5 w-5" style={{ color: primaryColor }} />
        </div>
        <span className="font-semibold text-xl text-gray-800">
          {AI_LOADING_STEPS[currentStep].text}
          <span className="inline-block w-8 text-right">{dots}</span>
        </span>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {AI_LOADING_STEPS.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index <= currentStep ? 'scale-100' : 'scale-75 opacity-50'
            }`}
            style={{
              backgroundColor: index <= currentStep ? primaryColor : '#e5e7eb',
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-64 mt-8">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              backgroundColor: primaryColor,
              width: `${((currentStep + 1) / AI_LOADING_STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function AdvisorWizard({
  quiz,
  storeSlug,
  basePath,
  onComplete,
  onAddToCart,
}: AdvisorWizardProps) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AdvisorResult[] | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  const currentQuestion = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  // Random AI phrase
  const [aiPhrase] = useState(() =>
    AI_RESPONSE_PHRASES[Math.floor(Math.random() * AI_RESPONSE_PHRASES.length)]
  );

  // Handle add to cart
  const handleAddToCart = async (result: AdvisorResult) => {
    if (addingProductId) return;

    setAddingProductId(result.productId);
    try {
      // Add to localStorage cart
      const cartKey = 'quickshop_cart';
      const existingCart = JSON.parse(localStorage.getItem(cartKey) || '[]');

      const cartItem = {
        productId: result.productId,
        quantity: 1,
        title: result.title,
        price: result.price,
        image: result.imageUrl,
      };

      const existingIndex = existingCart.findIndex(
        (item: any) => item.productId === result.productId
      );

      if (existingIndex >= 0) {
        existingCart[existingIndex].quantity += 1;
      } else {
        existingCart.push(cartItem);
      }

      localStorage.setItem(cartKey, JSON.stringify(existingCart));
      window.dispatchEvent(new CustomEvent('cart-updated'));

      onAddToCart?.(result.productId);
    } finally {
      setAddingProductId(null);
    }
  };

  const isAnswerSelected = (answerId: string) => {
    const selected = answers.get(currentQuestion?.id);
    return selected?.includes(answerId) || false;
  };

  const handleAnswerSelect = (answer: AdvisorAnswer) => {
    if (!currentQuestion) return;

    const questionId = currentQuestion.id;
    const currentAnswers = answers.get(questionId) || [];

    let newAnswers: string[];

    if (currentQuestion.questionType === 'single') {
      newAnswers = [answer.id];
    } else {
      if (currentAnswers.includes(answer.id)) {
        newAnswers = currentAnswers.filter((id) => id !== answer.id);
      } else {
        newAnswers = [...currentAnswers, answer.id];
      }
    }

    setAnswers(new Map(answers.set(questionId, newAnswers)));

    // Auto-advance for single selection
    if (currentQuestion.questionType === 'single') {
      setTimeout(() => {
        if (currentIndex < totalQuestions - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          handleSubmit();
        }
      }, 300);
    }
  };

  const handleNext = () => {
    const currentAnswers = answers.get(currentQuestion?.id);

    if (currentQuestion?.isRequired && (!currentAnswers || currentAnswers.length === 0)) {
      return;
    }

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const sessionAnswers = [];
      for (const [questionId, answerIds] of answers) {
        sessionAnswers.push({
          questionId,
          answerIds,
        });
      }

      const startTime = Date.now();

      const res = await fetch(`/api/storefront/${storeSlug}/advisor/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quiz.id,
          answers: sessionAnswers,
        }),
      });

      const data = await res.json();

      // Ensure minimum loading time for AI effect (show steps) - optimized for speed!
      const elapsed = Date.now() - startTime;
      const minLoadingTime = 3500; // ⚡ Reduced from 6500ms for better UX
      if (elapsed < minLoadingTime) {
        await new Promise((resolve) => setTimeout(resolve, minLoadingTime - elapsed));
      }

      if (res.ok) {
        setResults(data.results);
        setTimeout(() => {
          setShowResults(true);
        }, 500);
        onComplete?.(data.results);
      }
    } catch (error) {
      console.error('Error calculating results:', error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (!currentQuestion) return false;
    const currentAnswers = answers.get(currentQuestion.id);
    if (currentQuestion.isRequired) {
      return currentAnswers && currentAnswers.length >= 1;
    }
    return true;
  };

  const resetQuiz = () => {
    setStarted(false);
    setCurrentIndex(0);
    setAnswers(new Map());
    setResults(null);
    setShowResults(false);
  };

  const getButtonClass = () => {
    switch (quiz.buttonStyle) {
      case 'pill':
        return 'rounded-full';
      case 'square':
        return 'rounded-none';
      default:
        return 'rounded-lg';
    }
  };

  // ============================================
  // Start Screen
  // ============================================
  if (!started) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: quiz.backgroundColor }}
      >
        <div className="max-w-lg w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* AI Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{
              backgroundColor: `${quiz.primaryColor}15`,
              color: quiz.primaryColor,
            }}
          >
            <Brain className="h-4 w-4" />
            מופעל על ידי AI
            <Sparkles className="h-4 w-4" />
          </div>

          {quiz.imageUrl && (
            <Image
              src={quiz.imageUrl}
              alt={quiz.title}
              width={128}
              height={128}
              className="w-32 h-32 mx-auto rounded-full object-cover shadow-lg"
            />
          )}

          <div className="space-y-2">
            <h1 className="text-3xl font-bold" style={{ color: quiz.primaryColor }}>
              {quiz.title}
            </h1>
            {quiz.subtitle && <p className="text-lg text-gray-600">{quiz.subtitle}</p>}
            {quiz.description && <p className="text-gray-500">{quiz.description}</p>}
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              {totalQuestions} שאלות
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              פחות מדקה
            </span>
          </div>

          <button
            onClick={() => setStarted(true)}
            className={`px-8 py-4 text-lg font-semibold text-white transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer ${getButtonClass()}`}
            style={{ backgroundColor: quiz.primaryColor }}
          >
            <span className="flex items-center gap-2">
              {quiz.startButtonText}
              <ChevronLeft className="h-5 w-5" />
            </span>
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // Loading Screen (AI Effect)
  // ============================================
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: quiz.backgroundColor }}
      >
        <AIThinkingLoader primaryColor={quiz.primaryColor} />
      </div>
    );
  }

  // ============================================
  // Results Screen
  // ============================================
  if (results && showResults) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: quiz.backgroundColor }}>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${quiz.primaryColor}15` }}
            >
              <Check className="h-8 w-8" style={{ color: quiz.primaryColor }} />
            </div>

            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${quiz.primaryColor}10`,
                color: quiz.primaryColor,
              }}
            >
              <Brain className="h-3 w-3" />
              {aiPhrase}
            </div>

            <div>
              <h1 className="text-3xl font-bold">{quiz.resultsTitle}</h1>
              {quiz.resultsSubtitle && (
                <p className="text-gray-600 mt-2">{quiz.resultsSubtitle}</p>
              )}
            </div>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                לא מצאנו מוצרים מתאימים. נסה לענות על השאלות שוב.
              </p>
              <button
                onClick={resetQuiz}
                className={`mt-6 px-6 py-3 font-semibold text-white cursor-pointer ${getButtonClass()}`}
                style={{ backgroundColor: quiz.primaryColor }}
              >
                נסה שוב
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {results.map((result, index) => (
                <div
                  key={result.productId}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-3 duration-500"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {result.imageUrl && (
                    <div className="aspect-square relative overflow-hidden">
                      <Image
                        src={result.imageUrl}
                        alt={result.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                      {/* Match percentage */}
                      <div className="absolute top-3 right-3">
                        <div
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold text-white shadow-lg"
                          style={{ backgroundColor: quiz.primaryColor }}
                        >
                          <Target className="h-3 w-3" />
                          {result.matchPercentage}%
                        </div>
                      </div>

                      {/* AI Recommended badge for top result */}
                      {index === 0 && (
                        <div className="absolute top-3 left-3">
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-400 text-yellow-900">
                            <Sparkles className="h-3 w-3" />
                            המלצת AI
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-lg line-clamp-2">{result.title}</h3>

                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold" style={{ color: quiz.primaryColor }}>
                        ₪{result.price.toFixed(2)}
                      </span>
                      {result.compareAtPrice && result.compareAtPrice > result.price && (
                        <span className="text-sm text-gray-400 line-through">
                          ₪{result.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {result.matchReasons && result.matchReasons.length > 0 && (
                      <div className="space-y-1">
                        {result.matchReasons.map((reason, i) => (
                          <div key={i} className="flex items-center gap-1 text-sm text-gray-600">
                            <Check className="h-3 w-3 text-green-500" />
                            {reason}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Link
                        href={`${basePath}/product/${result.handle}`}
                        className={`flex-1 py-2.5 text-center font-semibold border-2 transition-colors hover:bg-gray-50 ${getButtonClass()}`}
                        style={{
                          borderColor: quiz.primaryColor,
                          color: quiz.primaryColor,
                        }}
                      >
                        צפייה
                      </Link>
                      <button
                        onClick={() => handleAddToCart(result)}
                        disabled={addingProductId === result.productId}
                        className={`flex-1 py-2.5 flex items-center justify-center gap-2 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70 cursor-pointer ${getButtonClass()}`}
                        style={{ backgroundColor: quiz.primaryColor }}
                      >
                        {addingProductId === result.productId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShoppingCart className="h-4 w-4" />
                        )}
                        {addingProductId === result.productId ? 'מוסיף...' : 'הוסף'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Restart button */}
          <div className="text-center pt-6">
            <button onClick={resetQuiz} className="text-gray-500 hover:text-gray-700 underline cursor-pointer">
              התחל מחדש
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state after results calculated
  if (results && !showResults) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: quiz.backgroundColor }}
      >
        <div className="text-center animate-in zoom-in duration-300">
          <Check className="h-16 w-16 mx-auto" style={{ color: quiz.primaryColor }} />
          <p className="mt-4 text-gray-600 font-medium">מוכן!</p>
        </div>
      </div>
    );
  }

  // ============================================
  // Question Screen
  // ============================================
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: quiz.backgroundColor }}>
      {/* Progress bar */}
      {quiz.showProgressBar && (
        <div className="h-1.5 bg-gray-200">
          <div
            className="h-full transition-all duration-300"
            style={{ backgroundColor: quiz.primaryColor, width: `${progress}%` }}
          />
        </div>
      )}

      {/* Navigation */}
      <div className="p-4 flex items-center justify-between">
        {quiz.allowBackNavigation && currentIndex > 0 ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
            חזרה
          </button>
        ) : (
          <div />
        )}

        {quiz.showQuestionNumbers && (
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              שאלה {currentIndex + 1} מתוך {totalQuestions}
            </span>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div
          key={currentQuestion.id}
          className="max-w-2xl w-full space-y-8 animate-in fade-in slide-in-from-left-3 duration-300"
        >
          {/* Question text */}
          <div className="text-center space-y-2">
            {currentQuestion.imageUrl && (
              <Image
                src={currentQuestion.imageUrl}
                alt=""
                width={96}
                height={96}
                className="w-24 h-24 mx-auto rounded-full object-cover mb-4 shadow-lg"
              />
            )}
            <h2 className="text-2xl md:text-3xl font-bold">{currentQuestion.questionText}</h2>
            {currentQuestion.questionSubtitle && (
              <p className="text-gray-500">{currentQuestion.questionSubtitle}</p>
            )}
            {currentQuestion.questionType === 'multiple' && (
              <p className="text-sm text-gray-400">ניתן לבחור מספר תשובות</p>
            )}
          </div>

          {/* Answers */}
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns:
                currentQuestion.answersLayout === 'grid'
                  ? `repeat(${Math.min(currentQuestion.columns || 2, 4)}, minmax(0, 1fr))`
                  : '1fr',
            }}
          >
            {currentQuestion.answers.map((answer, answerIndex) => {
              const selected = isAnswerSelected(answer.id);

              return (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerSelect(answer)}
                  className={`relative p-4 text-right border-2 transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${getButtonClass()} ${
                    currentQuestion.answersLayout === 'cards'
                      ? 'aspect-square flex flex-col items-center justify-center text-center'
                      : ''
                  }`}
                  style={{
                    borderColor: selected ? quiz.primaryColor : '#e5e7eb',
                    backgroundColor: selected ? `${quiz.primaryColor}10` : 'white',
                    animationDelay: `${answerIndex * 50}ms`,
                  }}
                >
                  <div
                    className={`flex items-center gap-3 ${
                      currentQuestion.answersLayout === 'cards' ? 'flex-col' : ''
                    }`}
                  >
                    {/* Media */}
                    {answer.imageUrl ? (
                      <Image
                        src={answer.imageUrl}
                        alt=""
                        width={currentQuestion.answersLayout === 'cards' ? 64 : 48}
                        height={currentQuestion.answersLayout === 'cards' ? 64 : 48}
                        className={`rounded-lg object-cover ${
                          currentQuestion.answersLayout === 'cards' ? 'w-16 h-16' : 'w-12 h-12'
                        }`}
                      />
                    ) : answer.emoji ? (
                      <span
                        className={
                          currentQuestion.answersLayout === 'cards' ? 'text-4xl' : 'text-2xl'
                        }
                      >
                        {answer.emoji}
                      </span>
                    ) : answer.color ? (
                      <div
                        className={`rounded-full border-2 ${
                          currentQuestion.answersLayout === 'cards' ? 'w-12 h-12' : 'w-8 h-8'
                        }`}
                        style={{
                          backgroundColor: answer.color,
                          borderColor: selected ? quiz.primaryColor : 'transparent',
                        }}
                      />
                    ) : null}

                    {/* Text */}
                    <div
                      className={
                        currentQuestion.answersLayout === 'cards' ? 'text-center' : 'flex-1'
                      }
                    >
                      <p className="font-semibold">{answer.answerText}</p>
                      {answer.answerSubtitle && (
                        <p className="text-sm text-gray-500">{answer.answerSubtitle}</p>
                      )}
                    </div>

                    {/* Selection indicator */}
                    {currentQuestion.questionType === 'multiple' && (
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          currentQuestion.answersLayout === 'cards'
                            ? 'absolute top-3 left-3'
                            : ''
                        }`}
                        style={{
                          borderColor: selected ? quiz.primaryColor : '#d1d5db',
                          backgroundColor: selected ? quiz.primaryColor : 'transparent',
                        }}
                      >
                        {selected && <Check className="h-3 w-3 text-white" />}
                      </div>
                    )}

                    {/* Single selection check */}
                    {currentQuestion.questionType === 'single' && selected && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center animate-in zoom-in duration-200"
                        style={{ backgroundColor: quiz.primaryColor }}
                      >
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Next button for multiple selection */}
          {currentQuestion.questionType === 'multiple' && (
            <div className="text-center">
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`px-8 py-3 font-semibold text-white transition-all shadow-lg cursor-pointer ${getButtonClass()} ${
                  !canProceed()
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:opacity-90 hover:shadow-xl'
                }`}
                style={{ backgroundColor: quiz.primaryColor }}
              >
                <span className="flex items-center gap-2">
                  {currentIndex === totalQuestions - 1 ? 'קבל המלצות' : 'המשך'}
                  <ChevronLeft className="h-5 w-5" />
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


