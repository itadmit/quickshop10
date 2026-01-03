'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { DataTable, Badge, EmptyState } from '@/components/admin/ui';
import type { Column, Tab, BulkAction } from '@/components/admin/ui';

// ============================================
// ProductsDataTable - Client Component
// עוטף את DataTable עם הגדרות columns
// ============================================

type Product = {
  id: string;
  name: string;
  slug: string;
  price: string | null;
  comparePrice: string | null;
  isActive: boolean;
  inventory: number | null;
  trackInventory: boolean;
  image?: string | null;
  categoryId: string | null;
};

interface ProductsDataTableProps {
  products: Product[];
  storeSlug: string;
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

export function ProductsDataTable({
  products,
  storeSlug,
  tabs,
  currentTab,
  searchValue,
  pagination,
}: ProductsDataTableProps) {
  const router = useRouter();

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
        // TODO: Implement bulk activate
        console.log('Activate:', selectedIds);
        router.refresh();
      },
    },
    {
      id: 'deactivate',
      label: 'השבת',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      ),
      onAction: async (selectedIds) => {
        // TODO: Implement bulk deactivate
        console.log('Deactivate:', selectedIds);
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
        if (!confirm(`האם למחוק ${selectedIds.length} מוצרים?`)) return;
        // TODO: Implement bulk delete
        console.log('Delete:', selectedIds);
        router.refresh();
      },
    },
  ];

  // Define columns inside Client Component
  const columns: Column<Product>[] = [
    {
      key: 'product',
      header: 'מוצר',
      render: (product) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <Link 
              href={`/shops/${storeSlug}/admin/products/${product.id}`}
              className="font-medium text-gray-900 hover:text-blue-600 truncate block"
              onClick={(e) => e.stopPropagation()}
            >
              {product.name}
            </Link>
            <p className="text-xs text-gray-500 truncate">/{product.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'סטטוס',
      width: '100px',
      align: 'center',
      render: (product) => (
        <Badge variant={product.isActive ? 'success' : 'default'}>
          {product.isActive ? 'פעיל' : 'טיוטה'}
        </Badge>
      ),
    },
    {
      key: 'inventory',
      header: 'מלאי',
      width: '100px',
      align: 'center',
      render: (product) => {
        if (!product.trackInventory) {
          return <span className="text-gray-400">-</span>;
        }
        const stock = product.inventory ?? 0;
        return (
          <span className={`font-medium ${
            stock === 0 ? 'text-red-600' : 
            stock <= 5 ? 'text-amber-600' : 
            'text-gray-900'
          }`}>
            {stock}
          </span>
        );
      },
    },
    {
      key: 'price',
      header: 'מחיר',
      width: '120px',
      align: 'center',
      render: (product) => (
        <div>
          <span className="font-medium">₪{Number(product.price).toLocaleString()}</span>
          {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
            <span className="text-xs text-gray-400 line-through mr-1">
              ₪{Number(product.comparePrice).toLocaleString()}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'פעולות',
      width: '200px',
      align: 'right',
      render: (product) => (
        <div className="flex items-center gap-1 justify-start" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/shops/${storeSlug}/product/${product.slug}`}
            target="_blank"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="צפה במוצר"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
          <Link
            href={`/shops/${storeSlug}/admin/products/${product.id}`}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="ערוך מוצר"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={products}
      columns={columns}
      getRowKey={(product) => product.id}
      getRowHref={(product) => `/shops/${storeSlug}/admin/products/${product.id}`}
      tabs={tabs}
      currentTab={currentTab}
      selectable
      bulkActions={bulkActions}
      searchable
      searchPlaceholder="חיפוש לפי שם מוצר..."
      searchValue={searchValue}
      pagination={pagination}
      emptyState={
        <EmptyState
          icon="products"
          title="אין מוצרים"
          description={searchValue ? 'לא נמצאו מוצרים התואמים לחיפוש' : 'הוסף את המוצר הראשון לחנות'}
          action={{
            label: 'הוסף מוצר',
            href: `/shops/${storeSlug}/admin/products/new`,
          }}
        />
      }
    />
  );
}
