'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DataTable, Badge, EmptyState } from '@/components/admin/ui';
import type { Column, Tab, BulkAction } from '@/components/admin/ui';
import { duplicateProduct, bulkActivateProducts, bulkDeactivateProducts, bulkDeleteProducts } from './actions';

// ============================================
// ProductsDataTable - Client Component
// עוטף את DataTable עם הגדרות columns
// ============================================

type ProductCategory = {
  id: string;
  name: string;
  parentId: string | null;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  price: string | null;
  comparePrice: string | null;
  isActive: boolean;
  inventory: number | null;
  trackInventory: boolean;
  hasVariants?: boolean;
  image?: string | null;
  categoryId: string | null;
  categoryName?: string | null;
  productCategories?: ProductCategory[];
  // Variant aggregate data
  variantMinPrice?: string | null;
  variantMaxPrice?: string | null;
  variantTotalInventory?: number | null;
  variantCount?: number | null;
};

type Category = {
  id: string;
  name: string;
  parentId?: string | null;
};

interface ProductsDataTableProps {
  products: Product[];
  storeSlug: string;
  tabs: Tab[];
  currentTab: string;
  searchValue?: string;
  categories: Category[];
  currentCategory?: string;
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
  categories,
  currentCategory,
  pagination,
}: ProductsDataTableProps) {
  const router = useRouter();
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Handle duplicate product
  const handleDuplicate = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (duplicatingId) return;
    
    setDuplicatingId(productId);
    try {
      const result = await duplicateProduct(productId, storeSlug);
      if (result.success && result.newProductId) {
        router.push(`/shops/${storeSlug}/admin/products/${result.newProductId}`);
      }
    } finally {
      setDuplicatingId(null);
    }
  };

  // Handle category filter change
  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(window.location.search);
    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    params.delete('page'); // Reset to page 1
    router.push(`/shops/${storeSlug}/admin/products?${params.toString()}`);
  };

  // Handle perPage change
  const handlePerPageChange = (newPerPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('perPage', newPerPage.toString());
    params.delete('page'); // Reset to page 1
    router.push(`/shops/${storeSlug}/admin/products?${params.toString()}`);
  };

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
        const result = await bulkActivateProducts(selectedIds, storeSlug);
        if (!result.success) {
          alert(result.error || 'שגיאה בהפעלת המוצרים');
        }
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
        const result = await bulkDeactivateProducts(selectedIds, storeSlug);
        if (!result.success) {
          alert(result.error || 'שגיאה בהשבתת המוצרים');
        }
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
        const result = await bulkDeleteProducts(selectedIds, storeSlug);
        if (!result.success) {
          alert(result.error || 'שגיאה במחיקת המוצרים');
        }
        router.refresh();
      },
    },
  ];

  // Define columns inside Client Component
  const columns: Column<Product>[] = [
    {
      key: 'product',
      header: 'מוצר',
      width: '300px',
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
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'קטגוריות',
      width: '180px',
      render: (product) => {
        const cats = product.productCategories || [];
        if (cats.length === 0) {
          return <span className="text-gray-400 text-sm">-</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {cats.slice(0, 3).map((cat) => (
              <span
                key={cat.id}
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  cat.parentId 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
                title={cat.parentId ? 'תת-קטגוריה' : 'קטגוריה ראשית'}
              >
                {cat.name}
              </span>
            ))}
            {cats.length > 3 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-500">
                +{cats.length - 3}
              </span>
            )}
          </div>
        );
      },
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
        // For products with variants, show total variant inventory
        if (product.hasVariants) {
          const stock = product.variantTotalInventory ?? 0;
          return (
            <div className="flex flex-col items-center">
              <span className={`font-medium ${
                stock === 0 ? 'text-red-600' : 
                stock <= 5 ? 'text-amber-600' : 
                'text-gray-900'
              }`}>
                {stock}
              </span>
              {product.variantCount && (
                <span className="text-[10px] text-gray-400">{product.variantCount} וריאציות</span>
              )}
            </div>
          );
        }
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
      width: '140px',
      align: 'center',
      render: (product) => {
        // For products with variants, show price range
        if (product.hasVariants && product.variantMinPrice) {
          const minPrice = Number(product.variantMinPrice);
          const maxPrice = Number(product.variantMaxPrice);
          
          if (minPrice === maxPrice) {
            return (
              <span className="font-medium">₪{minPrice.toFixed(2)}</span>
            );
          }
          
          return (
            <div className="flex flex-col items-center">
              <span className="font-medium text-sm">₪{minPrice.toFixed(2)} - ₪{maxPrice.toFixed(2)}</span>
            </div>
          );
        }
        
        return (
        <div className="flex items-center justify-center gap-1.5">
            <span className="font-medium">₪{Number(product.price || 0).toFixed(2)}</span>
          {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
            <span className="text-xs text-gray-400 line-through">
              ₪{Number(product.comparePrice).toFixed(2)}
            </span>
          )}
        </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'פעולות',
      width: '130px',
      align: 'left',
      render: (product) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => handleDuplicate(product.id, e)}
            disabled={duplicatingId === product.id}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="שכפל מוצר"
          >
            {duplicatingId === product.id ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
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

  const perPageOptions = [10, 20, 50, 100];

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">קטגוריה:</label>
          <select
            value={currentCategory || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">הכל</option>
            {/* Root categories */}
            {categories
              .filter(cat => !cat.parentId)
              .map((cat) => {
                const subcats = categories.filter(sub => sub.parentId === cat.id);
                return (
                  <optgroup key={cat.id} label={cat.name}>
                    <option value={cat.id}>כל {cat.name}</option>
                    {subcats.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        ↳ {sub.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })
            }
          </select>
        </div>

        <div className="h-6 w-px bg-gray-200" />

        {/* Per Page Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">פריטים בעמוד:</label>
          <select
            value={pagination.perPage}
            onChange={(e) => handlePerPageChange(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filters Summary */}
        {currentCategory && (
          <>
            <div className="h-6 w-px bg-gray-200" />
            <button
              onClick={() => handleCategoryChange('')}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <span>{categories.find(c => c.id === currentCategory)?.name}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Data Table */}
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
    </div>
  );
}
