'use client';

import { Trash2 } from 'lucide-react';
import { deleteCategory, deleteGuide } from './actions';
import { useState } from 'react';

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm('למחוק את הקטגוריה וכל המדריכים שבה?')) return;
    setPending(true);
    await deleteCategory(categoryId);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

export function DeleteGuideButton({ guideId }: { guideId: string }) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm('למחוק את המדריך?')) return;
    setPending(true);
    await deleteGuide(guideId);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

