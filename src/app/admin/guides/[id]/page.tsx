import { notFound } from 'next/navigation';
import { getGuide, getCategories } from '../actions';
import { GuideForm } from '../guide-form';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditGuidePage({ params }: Props) {
  const { id } = await params;
  const [guide, categories] = await Promise.all([
    getGuide(id),
    getCategories(),
  ]);

  if (!guide) {
    notFound();
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">עריכת מדריך</h1>
      <GuideForm guide={guide} categories={categories} />
    </div>
  );
}

