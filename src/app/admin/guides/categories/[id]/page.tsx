import { notFound } from 'next/navigation';
import { getCategory } from '../../actions';
import { CategoryForm } from '../category-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
  const category = await getCategory(id);

  if (!category) {
    notFound();
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">עריכת קטגוריה</h1>
      <CategoryForm category={category} />
    </div>
  );
}

