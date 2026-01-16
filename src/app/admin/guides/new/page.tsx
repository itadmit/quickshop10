import { getCategories } from '../actions';
import { GuideForm } from '../guide-form';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ category?: string }>;
}

export default async function NewGuidePage({ searchParams }: Props) {
  const { category } = await searchParams;
  const categories = await getCategories();

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">מדריך חדש</h1>
      <GuideForm categories={categories} defaultCategoryId={category} />
    </div>
  );
}

