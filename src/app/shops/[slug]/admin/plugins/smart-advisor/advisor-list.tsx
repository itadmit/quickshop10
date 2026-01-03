'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain, Plus, Search, MoreHorizontal, Eye, Edit, Trash2,
  BarChart3, Copy, CheckCircle, XCircle, Zap, HelpCircle,
} from 'lucide-react';
import { createAdvisorQuiz, deleteAdvisorQuiz, toggleAdvisorActive } from './actions';

interface Quiz {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  questionsCount: number;
  totalStarts: number;
  totalCompletions: number;
  createdAt: string;
}

interface AdvisorListProps {
  quizzes: Quiz[];
  storeSlug: string;
  storeId: string;
}

export function AdvisorList({ quizzes, storeSlug, storeId }: AdvisorListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = quizzes.filter(q => q.isActive).length;
  const totalCompletions = quizzes.reduce((acc, q) => acc + q.totalCompletions, 0);

  const handleCreate = async () => {
    if (!formData.title.trim()) return;

    startTransition(async () => {
      const result = await createAdvisorQuiz(storeId, formData.title, formData.description);
      if (result.success && result.quizId) {
        setShowCreateDialog(false);
        setFormData({ title: '', description: '' });
        router.push(`/shops/${storeSlug}/admin/plugins/smart-advisor/${result.quizId}`);
      }
    });
  };

  const handleDelete = async () => {
    if (!selectedQuiz) return;

    startTransition(async () => {
      await deleteAdvisorQuiz(selectedQuiz.id);
      setShowDeleteDialog(false);
      setSelectedQuiz(null);
      router.refresh();
    });
  };

  const handleToggleActive = async (quiz: Quiz) => {
    startTransition(async () => {
      await toggleAdvisorActive(quiz.id, !quiz.isActive);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">יועץ חכם</h1>
            <p className="text-sm text-gray-500">צור שאלונים שממליצים על מוצרים ללקוחות</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          יועץ חדש
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">סה"כ יועצים</p>
              <p className="text-2xl font-bold">{quizzes.length}</p>
            </div>
            <Brain className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">פעילים</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">סה"כ השלמות</p>
              <p className="text-2xl font-bold">{totalCompletions}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">יחס המרה</p>
              <p className="text-2xl font-bold">--</p>
            </div>
            <Zap className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="חפש יועץ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Quizzes List */}
      {filteredQuizzes.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Brain className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'לא נמצאו יועצים' : 'עדיין אין יועצים'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery
              ? 'נסה לחפש עם מילות מפתח אחרות'
              : 'צור יועץ חכם ראשון שיעזור ללקוחות למצוא מוצרים'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors mx-auto"
            >
              <Plus className="h-4 w-4" />
              צור יועץ ראשון
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{quiz.title}</h3>
                    {quiz.isActive ? (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        פעיל
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        טיוטה
                      </span>
                    )}
                  </div>
                  {quiz.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{quiz.description}</p>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === quiz.id ? null : quiz.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <MoreHorizontal className="h-5 w-5 text-gray-400" />
                  </button>
                  {openDropdown === quiz.id && (
                    <div className="absolute left-0 mt-1 bg-white rounded-lg shadow-xl border z-10 min-w-[150px]">
                      <Link
                        href={`/shops/${storeSlug}/admin/plugins/smart-advisor/${quiz.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <Edit className="h-4 w-4" />
                        עריכה
                      </Link>
                      <a
                        href={`/shops/${storeSlug}/advisor/${quiz.slug}`}
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <Eye className="h-4 w-4" />
                        צפייה
                      </a>
                      <button
                        onClick={() => {
                          handleToggleActive(quiz);
                          setOpenDropdown(null);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 w-full text-right"
                      >
                        {quiz.isActive ? (
                          <>
                            <XCircle className="h-4 w-4" />
                            השבת
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            הפעל
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedQuiz(quiz);
                          setShowDeleteDialog(true);
                          setOpenDropdown(null);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 w-full text-right text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        מחק
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <HelpCircle className="h-4 w-4" />
                  {quiz.questionsCount} שאלות
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  {quiz.totalCompletions} השלמות
                </span>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/shops/${storeSlug}/admin/plugins/smart-advisor/${quiz.id}`}
                  className="flex-1 py-2 text-center font-medium border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center justify-center gap-1">
                    <Edit className="h-4 w-4" />
                    עריכה
                  </span>
                </Link>
                <a
                  href={`/shops/${storeSlug}/advisor/${quiz.slug}`}
                  target="_blank"
                  className={`flex-1 py-2 text-center font-medium rounded-lg transition-colors ${
                    quiz.isActive
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={(e) => !quiz.isActive && e.preventDefault()}
                >
                  <span className="flex items-center justify-center gap-1">
                    <Eye className="h-4 w-4" />
                    צפייה
                  </span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">יצירת יועץ חדש</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם היועץ *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="למשל: מצא את השמפו המושלם עבורך"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  תיאור
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="תיאור קצר של היועץ"
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending || !formData.title.trim()}
                className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isPending ? 'יוצר...' : 'צור יועץ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && selectedQuiz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">מחיקת יועץ</h2>
            <p className="text-gray-600">
              האם אתה בטוח שברצונך למחוק את "{selectedQuiz.title}"?
              פעולה זו לא ניתנת לביטול.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setSelectedQuiz(null);
                }}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isPending ? 'מוחק...' : 'מחק'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


