'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { DataTable, Badge, EmptyState } from '@/components/admin/ui';
import type { Column, Tab, BulkAction } from '@/components/admin/ui';
import { DeleteCategoryButton } from './delete-button';

// ============================================
// CategoriesDataTable - Client Component
// ============================================

type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number | null;
  isActive: boolean;
  parentId: string | null;
  createdAt: Date;
  productCount: number;
};

interface CategoriesDataTableProps {
  categories: CategoryWithCount[];
  allCategories: CategoryWithCount[];
  storeSlug: string;
  storeId: string;
  tabs: Tab[];
  currentTab: string;
  searchValue?: string;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
  };
}

export function CategoriesDataTable({
  categories,
  allCategories,
  storeSlug,
  storeId,
  tabs,
  currentTab,
  searchValue,
  pagination,
}: CategoriesDataTableProps) {
  const router = useRouter();

  // Create a map for parent names
  const parentNameMap = new Map(allCategories.map(c => [c.id, c.name]));

  // Bulk Actions
  const bulkActions: BulkAction[] = [
    {
      id: 'activate',
      label: 'הפעל',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        console.log('Activate categories:', selectedIds);
        router.refresh();
      },
    },
    {
      id: 'deactivate',
      label: 'הסתר',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        console.log('Deactivate categories:', selectedIds);
        router.refresh();
      },
    },
    {
      id: 'delete',
      label: 'מחק',
      variant: 'danger',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        if (!confirm(`האם למחוק ${selectedIds.length} קטגוריות?`)) return;
        console.log('Delete categories:', selectedIds);
        router.refresh();
      },
    },
  ];

  const columns: Column<CategoryWithCount>[] = [
    {
      key: 'category',
      header: 'קטגוריה',
      render: (category) => (
        <div className="flex items-center gap-3">
          {/* Indent subcategories */}
          {category.parentId && (
            <div className="w-4 h-4 flex items-center justify-center text-gray-300 shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
            {category.imageUrl ? (
              <Image
                src={category.imageUrl}
                alt={category.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                </svg>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900">{category.name}</p>
            {category.parentId && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <span>תת-קטגוריה של:</span>
                <span className="font-medium">{parentNameMap.get(category.parentId) || 'לא ידוע'}</span>
              </p>
            )}
            {category.description && !category.parentId && (
              <p className="text-sm text-gray-500 truncate max-w-[200px]">
                {category.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'products',
      header: 'מוצרים',
      width: '100px',
      align: 'center',
      render: (category) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          {category.productCount}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'סטטוס',
      width: '100px',
      align: 'center',
      render: (category) => (
        <Badge variant={category.isActive ? 'success' : 'default'}>
          {category.isActive ? 'פעיל' : 'מוסתר'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'פעולות',
      width: '120px',
      align: 'left',
      render: (category) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/shops/${storeSlug}/category/${category.slug}`}
            target="_blank"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="צפה בקטגוריה"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
          <Link
            href={`/shops/${storeSlug}/admin/categories/${category.id}`}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="ערוך קטגוריה"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>
          <DeleteCategoryButton 
            categoryId={category.id}
            categoryName={category.name}
            productCount={category.productCount}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={categories}
      columns={columns}
      getRowKey={(category) => category.id}
      getRowHref={(category) => `/shops/${storeSlug}/admin/categories/${category.id}`}
      tabs={tabs}
      currentTab={currentTab}
      tabParamName="filter"
      selectable
      bulkActions={bulkActions}
      searchable
      searchPlaceholder="חיפוש לפי שם קטגוריה..."
      searchValue={searchValue}
      pagination={pagination}
      emptyState={
        <EmptyState
          icon="categories"
          title="אין קטגוריות"
          description={searchValue ? 'לא נמצאו קטגוריות התואמות לחיפוש' : 'צור קטגוריה ראשונה כדי לארגן את המוצרים שלך'}
        />
      }
    />
  );
}
