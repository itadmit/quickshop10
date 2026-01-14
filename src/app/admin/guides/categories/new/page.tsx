import { CategoryForm } from '../category-form';

export default function NewCategoryPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">קטגוריה חדשה</h1>
      <CategoryForm />
    </div>
  );
}

